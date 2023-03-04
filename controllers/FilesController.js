import { v4 as uuidv4 } from 'uuid';
import { promises } from 'fs'; // promises;
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { open, mkdir } = promises;
const folder = process.env.FOLDER_PATH || '/tmp/files_manager';

export default class FilesController {
  static async postUpload(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      const token = req.get('X-Token');
      const userId = await redisClient.get(`auth_${token}`);
      const users = await dbClient.find('users', '_id', userId);
      const user = users[0];
      if (!user) return res.status(401).send({ error: 'Unauthorized' });
      const [isValid, data] = await FilesController.validateFile(req);
      if (!isValid) return res.status(400).send(data);
      if (data.type === 'folder') delete (data.data);
      data.userId = ObjectId(userId);
      data.parentId = data.parentId === undefined ? 0 : ObjectId(data.parentId);
      if (data.type === 'folder') {
        const fileId = await dbClient.saveFile(data);
        data.id = fileId;
        delete (data._id);
        return res.status(201).send(data);
      }
      await FilesController.createDir(folder);
      const fileName = uuidv4();
      const filePath = folder.endsWith('/') ? folder + fileName : `${folder}/${fileName}`;
      const buff = FilesController.decodedeBase64toBinaryFile(data.data);
      await FilesController.saveToPath(buff, filePath);
      data.localPath = filePath;
      const reply = {
        userId: data.userId,
        name: data.name,
        type: data.type,
        isPublic: data.isPublic,
        parentId: data.parentId,
        localPath: data.localPath,
      };
      const fileId = await dbClient.saveFile(reply);
      reply.id = fileId;
      reply.parentId = reply.parentId.toString();
      delete (reply.localPath);
      delete (reply._id);
      return res.status(201).send(reply);
    }
    return res.status(500).send({ error: 'storage unavailable' });
  }

  static async validateFile(req) {
    const validTypes = ['folder', 'file', 'image'];
    const {
      name, type, parentId, data,
    } = req.body;
    let { isPublic } = req.body;
    isPublic = isPublic !== undefined ? isPublic : false;
    if (!name) return [false, { error: 'Missing name' }];
    if (!type) return [false, { error: 'Missing type' }];
    if (!(validTypes.includes(type))) return [false, { error: 'Missing type' }];
    if (!data && type !== 'folder') return [false, { error: 'Missing data' }];
    if (parentId) {
      const parent = await dbClient.findByColAndFilter('files', '_id', parentId);
      if (!parent) return [false, { error: 'Parent not found' }];
      if (parent.type !== 'folder') {
        return [false, { error: 'Parent is not a folder' }];
      }
    }
    return [true, {
      name, type, parentId, isPublic, data,
    }];
  }

  static decodedeBase64toBinaryFile(encoding) {
    const buffer = Buffer.from(encoding, 'base64');
    return buffer;
  }

  static async saveToPath(buffer, path) {
    return open(path, 'w').then((fd) => {
      fd.write(buffer);
      fd.close();
    });
  }

  static async createDir(path) {
    return mkdir(path, { recursive: true });
  }
}
