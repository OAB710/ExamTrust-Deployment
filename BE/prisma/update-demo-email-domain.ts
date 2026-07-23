import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

const backendEnvPath = join(process.cwd(), '.env');

if (!process.env.DATABASE_URL && existsSync(backendEnvPath)) {
  const envFile = readFileSync(backendEnvPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
    if (!match) continue;

    process.env.DATABASE_URL = match[1].replace(/^['"]|['"]$/g, '');
    break;
  }
}

const prisma = new PrismaClient();

const OLD_DOMAIN = '@tdhuhu.edu.vn';
const NEW_DOMAIN = '@tdtutdtu.edu.vn';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        endsWith: OLD_DOMAIN,
      },
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: {
      email: 'asc',
    },
  });

  if (users.length === 0) {
    console.log(`No users found with ${OLD_DOMAIN}. Nothing to update.`);
    return;
  }

  const targetEmails = users.map((user) => user.email.replace(OLD_DOMAIN, NEW_DOMAIN));
  const existingTargets = await prisma.user.findMany({
    where: {
      email: {
        in: targetEmails,
      },
    },
    select: {
      email: true,
    },
  });

  if (existingTargets.length > 0) {
    const conflicts = existingTargets.map((user) => user.email).sort();
    throw new Error(
      `Cannot update demo email domain because target email(s) already exist: ${conflicts.join(', ')}`,
    );
  }

  await prisma.$transaction(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email.replace(OLD_DOMAIN, NEW_DOMAIN),
        },
      }),
    ),
  );

  console.log(`Updated ${users.length} user email(s) from ${OLD_DOMAIN} to ${NEW_DOMAIN}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
