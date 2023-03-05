const sha1 = require('sha1');
const dbClient = require('../utils/db');

async function postNew(email, password) {
  const user = await dbClient.db.collection('users').find({ email }).toArray();
  let res;
  if (user.length > 0) {
    res = { error: 'Already exist' };
  } else {
    const shaPassword = sha1(password);
    res = await dbClient.db.collection('users').insert({ email, password: shaPassword });
    res = { id: res.insertedIds['0'], email };
  }
  return res;
}

module.exports = { postNew };
