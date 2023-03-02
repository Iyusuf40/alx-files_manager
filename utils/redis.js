import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.isAliveFlag = false;
    this.client = redis.createClient();
    this.client.on('error', (err) => console.log(err));
    this.client.on('ready', () => this.isAliveFlag = true);
  }

  isAlive() {
    return this.isAliveFlag;
    //return this.client.connected;
  }

  async get(key) {
    this.client.get = util.promisify(this.client.get);
    const value = await this.client.get(key);
    return value;
  }

  async set(key, value, duration) {
    this.client.set = util.promisify(this.client.set);
    this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    this.client.del = util.promisify(this.client.del);
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
