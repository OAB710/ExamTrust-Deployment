import { Module, forwardRef } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiJobsService } from './ai-jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AccessPolicyService } from '../common/services/access-policy.service';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule)],
  controllers: [AiController],
  providers: [AiService, AiJobsService, AccessPolicyService],
  exports: [AiService, AiJobsService],
})
export class AiModule {}
