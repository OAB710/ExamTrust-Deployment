const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const courses = await p.course.findMany({
    select: { code: true, name: true, description: true },
  });
  for (const c of courses) {
    console.log(`[${c.code}] name="${c.name}" | desc="${c.description}"`);
  }
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});