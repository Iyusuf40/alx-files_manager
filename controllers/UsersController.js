import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class UsersController {
  static async postNew(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      const { email } = req.body;
      const { password } = req.body;
      if (!email) return res.status(400).send({ error: 'Missing email' });
      if (!password) return res.status(400).send({ error: 'Missing password' });
      const exists = await dbClient.findByColAndFilter('users', 'email', email);
      if (exists) return res.status(400).send({ error: 'Already exist' });
      const hashedPwd = UsersController.hashPwd(password);
      const user = { email, password: hashedPwd };
      const userId = await dbClient.saveUser(user);
      const response = { id: userId, email };
      return res.status(201).send(response);
    }
    return res.status(500).send({ error: 'storage unavailable' });
  }

  static async getMe(req, res) {
    const token = req.get('X-Token');
    const userEmail = await redisClient.get(`auth_${token}`);
    const users = await dbClient.find('users', 'email', userEmail);
    const user = users[0];
    if (!user) return res.status(401).send({ error: 'Unauthorized' });
    return res.send({ id: user._id, email: user.email });
  }

  static hashPwd(password) {
    return sha1(password);
  }
}
