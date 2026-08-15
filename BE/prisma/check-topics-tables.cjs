const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const scopes = await p.$queryRawUnsafe('SHOW TABLES LIKE "%course_scope%"');
  console.log('course_scope tables:', JSON.stringify(scopes, null, 2));
  const cols = await p.$queryRawUnsafe('SHOW COLUMNS FROM topics');
  console.log('topics columns:', JSON.stringify(cols, null, 2));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});