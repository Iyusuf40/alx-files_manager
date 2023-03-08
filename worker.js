const Bull = require('bull');
const { writeFile } = require('fs');
const { ObjectID } = require('mongodb');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const Queue = Bull('fileQueue');
const uQueue = Bull('userQueue');

Queue.process(async (job, done) => {
  if (!job.data.fileId) throw new Error('Missing fileId');
  if (!job.data.userId) throw new Error('Missing userId');
  const file = await dbClient.db.collection('files').findOne(
    { userId: ObjectID(job.data.userId), _id: ObjectID(job.data.fileId) },
  );

  if (!file) throw new Error('File not found');
  const width100 = await imageThumbnail(file.localPath, { width: 100 });
  const width250 = await imageThumbnail(file.localPath, { width: 250 });
  const width500 = await imageThumbnail(file.localPath, { width: 500 });
  writeFile(`${file.localPath}_100`, width100, (err) => {
    if (err) done(err);
  });
  writeFile(`${file.localPath}_250`, width250, (err) => {
    if (err) done(err);
  });
  writeFile(`${file.localPath}_500`, width500, (err) => {
    if (err) done(err);
  });
  done();
});

uQueue.process(async (job, done) => {
  if (!job.data.userId) throw new Error('Missing userId');
  const file = await dbClient.db.collection('users').findOne(
    { _id: ObjectID(job.data.userId) },
  );
  if (!file) throw new Error('User not found');
  console.log(`welcome: ${file.email}`);
  done();
});
