import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({ imports: [PrismaModule, AiModule], controllers: [AdminDashboardController], providers: [AdminDashboardService] })
export class AdminDashboardModule {}
