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
    parentId = ObjectID(parentId);
    const file = await getFilefromParentId(parentId);
    if (!file) return { error: 'Parent not found' };
    if (file.type !== 'folder') return { error: 'Parent is not a folder' };
  } else {
    parentId = '0';
  }
  if (!isPublic) isPublic = false;
  const newFileObj = {
    userId: user._id, name, type, parentId, isPublic,
  };
  const newFile = await dbClient.db.collection('files').insertOne(newFileObj);
  const res = newFile.ops[0];
  return {
    id: res._id,
    userId: res.userId,
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
    parentId = ObjectID(parentId);
    const file = await getFilefromParentId(parentId);
    if (!file) return { error: 'Parent not found' };
    if (file.type !== 'folder') return { error: 'Parent is not a folder' };
  } else {
    parentId = '0';
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
    id: res._id,
    userId: res.userId,
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

async function getFilefromId(Id) {
  const file = await dbClient.db.collection('files').findOne({ _id: ObjectID(Id) });
  return file;
}

async function getShow(req) {
  const { id } = req.params;
  const user = await getUserFromToken(req.header('X-Token'));
  const file = await getFilefromId(id);
  let res;
  if (user && file) {
    file.id = file._id;
    delete file._id;
    delete file.localPath;
    res = file;
  } else if (user) {
    res = { error: 'Not found' };
  } else {
    res = { error: 'Unauthorized' };
  }
  return res;
}

async function getIndex(req) {
  const user = await getUserFromToken(req.header('X-Token'));
  if (user) {
    let parentId = req.query.parentId || '0';
    const page = req.query.page || '0';
    let rPage;
    if (parentId !== '0') {
      parentId = ObjectID(parentId);
      const pFile = await getFilefromParentId(parentId);
      if (!pFile || (pFile.type !== 'folder')) return [];
      rPage = dbClient.db.collection('files').aggregate([
        { $match: { parentId } },
        {
          $facet: {
            data: [{ $skip: page * 20 }, { $limit: 20 }],
          },
        }]);
    } else {
      rPage = dbClient.db.collection('files').aggregate([{
        $facet: {
          data: [{ $skip: page * 20 }, { $limit: 20 }],
        },
      }]);
    }
    const res = await rPage.toArray();
    res[0].data.forEach((data) => {
      // eslint-disable-next-line no-param-reassign
      data.id = data._id;
      // eslint-disable-next-line no-param-reassign
      delete data._id;
      // eslint-disable-next-line no-param-reassign
      delete data.localPath;
    });
    console.log(res);
    return res;
  }
  return { error: 'Unauthorized' };
}

async function putPublish(req) {
  const user = await getUserFromToken(req.header('X-Token'));
  const file = await getFilefromId(req.params.id);
  let res;
  if (user && file) {
    await dbClient.db.collection('files').updateOne(
      { _id: ObjectID(req.params.id) }, { $set: { isPublic: true } },
    );
    res = await getFilefromId(req.params.id);
    res.id = res._id;
    delete res._id;
    delete res.localPath;
  } else if (user) {
    res = { error: 'Not found' };
  } else {
    res = { error: 'Unauthorized' };
  }
  return res;
}

async function putUnpublish(req) {
  const user = await getUserFromToken(req.header('X-Token'));
  const file = await getFilefromId(req.params.id);
  let res;
  if (user && file) {
    await dbClient.db.collection('files').updateOne(
      { _id: ObjectID(req.params.id) }, { $set: { isPublic: false } },
    );
    res = await getFilefromId(req.params.id);
    console.log(res);
    res.id = res._id;
    delete res._id;
    delete res.localPath;
  } else if (user) {
    res = { error: 'Not found' };
  } else {
    res = { error: 'Unauthorized' };
  }
  return res;
}

module.exports = {
  postUpload, getShow, getIndex, putPublish, putUnpublish,
};
