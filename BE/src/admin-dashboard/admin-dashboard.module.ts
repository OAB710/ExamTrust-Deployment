import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { SystemOverviewController } from './system-overview.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [PrismaModule, AiModule, SubmissionsModule],
  controllers: [AdminDashboardController, SystemOverviewController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
