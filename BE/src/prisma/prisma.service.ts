import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
const { PrismaClient } = require('@prisma/client');
import { isPerfLogEnabled, logPerf } from '../common/utils/perf-log';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: isPerfLogEnabled() ? [{ emit: 'event', level: 'query' }] : undefined,
    });

    if (isPerfLogEnabled()) {
      this.$on('query', (event: any) => {
        logPerf(`prisma query=${event.duration}ms target=${event.target || 'db'} sql=${compactSql(event.query)}`);
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function compactSql(sql: string) {
  return sql.replace(/\s+/g, ' ').trim();
}
