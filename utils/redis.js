const redis = require('redis');
const util = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.get = util.promisify(this.client.get);
    this.client.set = util.promisify(this.client.set);
    this.client.del = util.promisify(this.client.del);

    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    if (this.client.stream.connecting) { // attempting connection
      // return false if error occured else true
      return !this.client.stream._hadError;
    }
    return this.client.connected;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
