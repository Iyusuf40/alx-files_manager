const sha1 = require('sha1');
const uuid = require('uuid');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function getBase64(req) {
  return req.header('Authorization').split(' ')[1];
}

function getCredentials(Base64) {
  const credentials = Buffer.from(Base64, 'base64').toString('utf-8').split(':');
  const email = credentials[0];
  const password = credentials[1];
  return { email, password };
}

async function getUserFromEmail(email) {
  const user = await dbClient.db.collection('users').findOne({ email });
  return user;
}

async function getConnect(req) {
  const Base64 = getBase64(req);
  const { email, password } = getCredentials(Base64);
  const user = await getUserFromEmail(email);
  if (user && (sha1(password) === user.password)) {
    const token = uuid.v4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 1000 * 86400);
    return { token };
  }
  return { error: 'Unauthorized' };
}

async function getUserFromToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  const user = await dbClient.db.collection('users').findOne({ _id: ObjectID(userId) });
  return user;
}

async function getDisconnect(req) {
  const token = req.header('X-Token');
  const user = await getUserFromToken(token);
  if (user) {
    await redisClient.del(`auth_${token}`);
    return true;
  }
  return false;
}

async function getMe(req) {
  const token = req.header('X-Token');
  const user = await getUserFromToken(token);
  if (user) {
    const { email, _id } = user;
    return { id: _id, email };
  }
  return '';
}

module.exports = {
  getConnect, getDisconnect, getMe, getUserFromToken,
};
