const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function getStatus() {
  let res;
  if (dbClient.isAlive() && redisClient.isAlive()) {
    res = { redis: true, db: true };
  } else if (dbClient.isAlive()) {
    res = { redis: false, db: true };
  } else if (redisClient.isAlive()) {
    res = { redis: true, db: false };
  } else {
    res = { redis: false, db: false };
  }
  console.log(res);
  return res;
}

async function getStats() {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();
  return { users, files };
}

module.exports = { getStats, getStatus };
