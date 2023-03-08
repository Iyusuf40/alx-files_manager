const express = require('express');
const { getStats, getStatus } = require('../controllers/AppController');
const { postNew } = require('../controllers/UsersController');
const { getConnect, getDisconnect, getMe } = require('../controllers/AuthController');
const {
  postUpload, getShow, getIndex, putPublish, putUnpublish, getFile,
} = require('../controllers/FilesController');

const router = express.Router();

router.use(express.json());

router.get('/status', (req, res) => {
  res.json(getStatus());
});

router.get('/stats', (req, res) => {
  res.json(getStats());
});

router.post('/users', async (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const newUser = await postNew(email, password);
    if (newUser.error) {
      res.status(400).json(newUser);
    } else {
      res.json(newUser);
    }
  } else if (email) {
    res.status(400).json({ error: 'Missing password' });
  } else if (password) {
    res.status(400).json({ error: 'Missing email' });
  } else {
    res.status(400).json({ error: 'Missing email and password' });
  }
});

router.get('/connect', async (req, res) => {
  const authVerify = await getConnect(req);
  if (authVerify.error) {
    res.status(401).json({ error: 'Unauthorized' });
  } else {
    res.json(authVerify);
  }
});

router.get('/disconnect', async (req, res) => {
  const isValidUser = await getDisconnect(req);
  if (isValidUser) {
    res.status(204).json();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/users/me', async (req, res) => {
  const user = await getMe(req);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/files', async (req, res) => {
  const fileVerify = await postUpload(req);
  if (fileVerify.error === 'Unauthorized') {
    res.status(401).json(fileVerify);
  } else if (fileVerify.error) {
    res.status(400).json(fileVerify);
  } else {
    res.status(201).json(fileVerify);
  }
});

router.get('/files/:id', async (req, res) => {
  const file = await getShow(req);
  if (file.error === 'Unauthorized') {
    res.status(401).json(file);
  } else if (file.error === 'Not found') {
    res.status(404).json(file);
  } else {
    res.json(file);
  }
});

router.get('/files', async (req, res) => {
  const files = await getIndex(req);
  if (files && files.error === 'Unauthorized') {
    res.status(401).json(files);
  } else {
    res.json(files);
  }
});

router.put('/files/:id/publish', async (req, res) => {
  const pub = await putPublish(req);
  if (pub.error === 'Unauthorized') {
    res.status(401).json(pub);
  } else if (pub.error === 'Not found') {
    res.status(404).json(pub);
  } else {
    res.json(pub);
  }
});

router.put('/files/:id/unpublish', async (req, res) => {
  const pub = await putUnpublish(req);
  if (pub.error === 'Unauthorized') {
    res.status(401).json(pub);
  } else if (pub.error === 'Not found') {
    res.status(404).json(pub);
  } else {
    res.json(pub);
  }
});

router.get('/files/:id/data', getFile);

module.exports = router;
