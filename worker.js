// import FilesController from './controllers/FilesController';
import imageThumbnail from 'image-thumbnail';
import Queue from 'bull';
const fileQueue = new Queue('fileQueue');
export { fileQueue };

fileQueue.on('error', (err) => console.log(err));
fileQueue.on('completed', (job, res) => console.log('comleted', job.id, res));
fileQueue.on('failed', (job, err) => console.log('failed', job.id, err));


function waitConnection(dbClient) {
  return new Promise((resolve, reject) => {
    let i = 0;
    async function repeatFct() {
      setTimeout(async () => {
        i += 1;
        if (i >= 10) {
          reject();
        } else if (!dbClient.isAlive()) {
          await repeatFct();
        } else {
          resolve();
        }
      }, 10);
    }
    repeatFct();
  });
}

export default async function worker(job) {
  const mod = await import('./controllers/FilesController')
  const FilesController = mod.default
  const dbClient = mod.dbClient
  if (!dbClient.isAlive()) await waitConnection(dbClient)
  const {fileId, userId} = job.data
  if (!fileId) return Promise.reject('Missing fileId')
  if (!userId) return Promise.reject('Missing userId')
  const [found, file] = await FilesController.getFileByUserIdAndFileId(userId, fileId);
  if (!found)  return Promise.reject('File not found')
  const opt500 = {width: 500}
  const opt250 = {width: 250}
  const opt100 = {width: 100}
  const optList = [[opt500, '_500'], [opt250, '_250'], [opt100, '_100']]
  optList.forEach(async (option) => {
    try {
      const thumbnail = await imageThumbnail(file.localPath, option[0])
      await FilesController.saveToPath(thumbnail, file.localPath + option[1])
    } catch(err) {
      return Promise.reject('Failed job', job.id)
    }
  })
  return Promise.resolve('success')
}


fileQueue.process(1, worker);
