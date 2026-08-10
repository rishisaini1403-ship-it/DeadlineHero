const mongoose = require('mongoose');
const connStr = 'mongodb+srv://kaizen:ezYrYsRFK1YOVyV7@ac-5u9cqox-shard-00-00.iyx1tqv.mongodb.net/deadlinehero?retryWrites=true&w=majority&appName=Cluster0';
const taskId = process.argv[2];

mongoose.connect(connStr).then(async () => {
  const db = mongoose.connection.db;
  const before = await db.collection('tasks').findOne(
    { _id: new mongoose.Types.ObjectId(taskId) },
    { projection: { updatedAt: 1 } }
  );
  console.log('Before:', before.updatedAt);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(10, 0, 0, 0);
  const r = await db.collection('tasks').updateOne(
    { _id: new mongoose.Types.ObjectId(taskId) },
    { $set: { updatedAt: yesterday } }
  );
  console.log('Modified:', r.modifiedCount);

  const after = await db.collection('tasks').findOne(
    { _id: new mongoose.Types.ObjectId(taskId) },
    { projection: { updatedAt: 1 } }
  );
  console.log('After:', after.updatedAt);
  await mongoose.disconnect();
});
