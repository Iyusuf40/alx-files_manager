import { MongoClient } from 'mongodb';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DB = process.env.DB_DATABASE || 'files_manager';

const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect((err, client) => {
      if (!err) {
        this.db = client.db(DB);
      } else {
        throw (err);
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const numberOfUsers = await this.db.collection('users').countDocuments();
    return numberOfUsers;
  }

  async nbFiles() {
    const numberOfFiles = await this.db.collection('files').countDocuments();
    return numberOfFiles;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
