const { writeFile, existsSync, mkdirSync } = require('fs');
const uuid = require('uuid');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

async function getUserFromToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(userId) });
  return user;
}

async function getFilefromParentId(parentId) {
  const file = await dbClient.db.collection('files').findOne({ _id: ObjectID(parentId) });
  return file;
}

async function saveFolder(req, user) {
  const { name, type } = req.body;
  let { parentId, isPublic } = req.body;

  if (!name) return { error: 'Missing name' };
  if (!type) return { error: 'Missing type' };
  if (parentId) {
    const file = await getFilefromParentId(parentId);
    console.log(file);
    if (!file) return { error: 'Parent not found' };
    if (file.type !== 'folder') return { error: 'Parent is not a folder' };
  } else {
    parentId = 0;
  }
  if (!isPublic) isPublic = false;
  const newFileObj = {
    userId: user._id, name, type, parentId, isPublic,
  };
  const newFile = await dbClient.db.collection('files').insertOne(newFileObj);
  const res = newFile.ops[0];
  return {
    userId: res.userId,
    id: res._id,
    name: res.name,
    type: res.type,
    isPublic: res.isPublic,
    parentId: res.parentId,
  };
}

async function saveFileOrImage(req, user) {
  const storagePath = process.env.FOLDER_PATH || '/tmp/files_manager';
  const {
    name, type, data,
  } = req.body;
  let { parentId, isPublic } = req.body;

  if (!existsSync(storagePath)) {
    mkdirSync(storagePath);
  }

  if (!name) return { error: 'Missing name' };
  if (!type) return { error: 'Missing type' };
  if (!data && (type !== 'folder')) return { error: 'Missing data' };
  if (parentId) {
    const file = await getFilefromParentId(parentId);
    if (!file) return { error: 'Parent not found' };
    if (file.type !== 'folder') return { error: 'Parent is not a folder' };
  } else {
    parentId = 0;
  }
  if (!isPublic) isPublic = false;

  const localPath = `${storagePath}/${uuid.v4()}`;
  writeFile(localPath, data, { encoding: 'base64' }, (err) => {
    if (err) console.log(err);
  });
  const newFileObj = {
    userId: user._id, name, type, isPublic, parentId, localPath,
  };
  const newFile = await dbClient.db.collection('files').insertOne(newFileObj);
  const res = newFile.ops[0];
  return {
    userId: res.userId,
    id: res._id,
    name: res.name,
    type: res.type,
    isPublic: res.isPublic,
    parentId: res.parentId,
  };
}

async function postUpload(req) {
  const user = await getUserFromToken(req.header('X-Token'));
  if (user) {
    const { type } = req.body;
    let res;

    if (!type) {
      res = { error: 'Missing type' };
    } else if (type === 'folder') {
      res = await saveFolder(req, user);
    } else {
      res = await saveFileOrImage(req, user);
    }
    return res;
  }
  return { error: 'Unauthorized' };
}

module.exports = { postUpload };
