const mongoose = require('mongoose');
const connStr = 'mongodb://collegeproject:Preet2115@ac-5u9cqox-shard-00-00.iyx1tqv.mongodb.net:27017,ac-5u9cqox-shard-00-01.iyx1tqv.mongodb.net:27017,ac-5u9cqox-shard-00-02.iyx1tqv.mongodb.net:27017/deadlinehero?ssl=true&replicaSet=atlas-13ivkj-shard-0&authSource=admin&appName=HackathonProject';

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateCurrentStreak(tasks) {
  const dateStrs = tasks.filter(t => t.status === 'completed')
    .map(t => toLocalDateStr(new Date(t.updatedAt || t.createdAt)));
  const unique = [...new Set(dateStrs)].sort();
  if (unique.length === 0) return 0;
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);
  const lastDate = unique[unique.length - 1];
  if (lastDate !== todayStr && lastDate !== yesterdayStr) return 0;
  let curs = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    const curr = new Date(unique[i + 1]);
    const prev = new Date(unique[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) curs++; else break;
  }
  return curs;
}

function calculateBestStreak(tasks) {
  const dateStrs = tasks.filter(t => t.status === 'completed')
    .map(t => toLocalDateStr(new Date(t.updatedAt || t.createdAt)));
  const unique = [...new Set(dateStrs)].sort();
  if (unique.length === 0) return 0;
  let best = 0, run = 1;
  for (let i = 1; i < unique.length; i++) {
    const curr = new Date(unique[i]);
    const prev = new Date(unique[i - 1]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) run++;
    else { best = Math.max(best, run); run = 1; }
  }
  return Math.max(best, run);
}

function calculateWeeklyConsistency(tasks) {
  const now = new Date();
  let count = 0;
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const targetStr = toLocalDateStr(date);
    const hasCompletion = tasks.some(t => {
      if (t.status !== 'completed') return false;
      return toLocalDateStr(new Date(t.updatedAt || t.createdAt)) === targetStr;
    });
    if (hasCompletion) count++;
  }
  return count;
}

mongoose.connect(connStr).then(async () => {
  const db = mongoose.connection.db;
  const ids = [
    { name: 'Rahul', id: '6a534e7b01b930cc00db7432' },
    { name: 'Harish', id: '6a53514a2ae03166c64b1584' },
    { name: 'preethi', id: '6a58bb2c29ed834e734c123d' }
  ];

  for (const { name, id: uid } of ids) {
    console.log(`\n===== ${name} (${uid}) =====`);

    const user = await db.collection('users').findOne(
      { _id: new mongoose.Types.ObjectId(uid) },
      { projection: { name: 1, email: 1, streak: 1, bestStreak: 1, lastActiveDate: 1 } }
    );

    // Load ALL tasks for the user, with ALL fields (no projection filter)
    // so that t.status is available for the shared functions
    const allTasks = await db.collection('tasks').find(
      { user: new mongoose.Types.ObjectId(uid) }
    ).toArray();

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const completedCount = completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    console.log(`DB-stored: streak=${user.streak}, bestStreak=${user.bestStreak}`);
    console.log(`Tasks: ${completedCount}/${totalTasks} completed (${completionRate}%)`);

    if (completedTasks.length === 0) {
      console.log('No completed tasks — all stats will be 0');
      console.log('Pending tasks:');
      allTasks.filter(t => t.status !== 'completed').forEach(t =>
        console.log(`  "${t.title?.substring(0, 30)}" due=${t.dueDate?.toISOString?.()?.split('T')[0] || '?'}`)
      );
    }

    if (completedTasks.length > 0) {
      console.log('Completion dates (local IST):');
      const dateStrs = completedTasks.map(t => ({
        title: (t.title || '').substring(0, 30),
        dueDate: t.dueDate?.toISOString?.()?.split('T')[0],
        completedDate: toLocalDateStr(new Date(t.updatedAt || t.createdAt)),
        rawUpdatedAt: t.updatedAt
      }));
      dateStrs.forEach(t => console.log(`  ${t.completedDate} (due: ${t.dueDate || '?'})  "${t.title}"`));
    }

    const computedStreak = calculateCurrentStreak(allTasks);
    const computedBestStreak = calculateBestStreak(allTasks);
    const computedConsistency = calculateWeeklyConsistency(allTasks);

    console.log(`Computed stats:`);
    console.log(`  currentStreak=${computedStreak} (DB says ${user.streak})`);
    console.log(`  bestStreak=${computedBestStreak} (DB says ${user.bestStreak})`);
    console.log(`  weeklyConsistency=${computedConsistency}/7`);
    console.log(`  completionRate=${completionRate}%`);
  }

  await mongoose.disconnect();
});
