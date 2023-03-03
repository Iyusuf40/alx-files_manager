import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import sha1 from 'sha1';

export default class UsersController {
  static async postNew(req, res) {
    if (redisClient.isAlive() && dbClient.isAlive()) {
      const email = req.body.email
      const password = req.body.password
      if (!email) return res.status(400).send({error: "Missing email"})
      if (!password) return res.status(400).send({error: "Missing password"})
      exists = await dbClient.findByColAndFilter('users', 'email', email)
      if (exists) return res.status(400).send({error: "Already exist"})
      const hashedPwd = UsersController.hashPwd(password)
      const user = { email: email, password: hashedPwd }
      const userId = await dbClient.saveUser(user)
      const response = {id: userId, email: email}
      return res.status(201).send(response)
    }
    return res.status(500).send({error: 'storage unavailable'})
  }

  static hashPwd(password) {
    return sha1(password)
  }
}
