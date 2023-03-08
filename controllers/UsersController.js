const sha1 = require('sha1');
const Bull = require('bull');
const dbClient = require('../utils/db');

const userQueue = Bull('userQueue');

async function postNew(email, password) {
  const user = await dbClient.db.collection('users').find({ email }).toArray();
  let res;
  if (user.length > 0) {
    res = { error: 'Already exist' };
  } else {
    const shaPassword = sha1(password);
    res = await dbClient.db.collection('users').insertOne({ email, password: shaPassword });
    res = { id: res.insertedId, email };
    console.log(res.id);
    if (res) userQueue.add({ userId: res.id });
  }
  return res;
}

module.exports = { postNew };
