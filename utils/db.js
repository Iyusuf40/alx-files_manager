import { MongoClient, ObjectId } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const dbName = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = MongoClient(url, { useUnifiedTopology: true });
    this.connect();
    this.connected = false;
  }

  async connect() {
    await this.client.connect();
    this.connected = true;
    this.db = this.client.db(dbName);
    this.filesCollection = this.db.collection('files');
    this.usersCollection = this.db.collection('users');
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const usersCollection = this.db.collection('users');
    const noOfCollections = await usersCollection.countDocuments({});
    return noOfCollections;
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    const noOfFiles = await filesCollection.countDocuments({});
    return noOfFiles;
  }

  async findByColAndFilter(collection, key, value) {
    let result = null;
    const filter = JSON.parse(`{"${key}":"${value}"}`);
    if (collection === 'users') {
      result = await this.usersCollection.findOne(filter);
    } else if (collection === 'files') {
      result = await this.filesCollection.findOne(filter);
    }
    return result;
  }

  async find(collection, key, value) {
    let result = null;
    let filter = JSON.parse(`{"${key}":"${value}"}`);
    if (!key) {
      filter = {};
    }
    if (key === '_id') {
      filter = { _id: ObjectId(value) };
    }
    if (collection === 'users') {
      result = await this.usersCollection.find(filter);
    } else if (collection === 'files') {
      result = await this.filesCollection.find(filter);
    }
    return result.toArray();
  }

  async saveUser(user) {
    const reply = await this.usersCollection.insertOne(user);
    return reply.ops[0]._id; // id of inserted user
  }

  async saveFile(file) {
    const reply = await this.filesCollection.insertOne(file);
    return reply.ops[0]._id; // id of file
  }
}

const dbClient = new DBClient();
export default dbClient;
