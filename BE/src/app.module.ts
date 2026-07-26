import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ExamsModule } from './exams/exams.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AiModule } from './ai/ai.module';
import { ExamLinksModule } from './exam-links/exam-links.module';
import { MailerModule } from './mailer/mailer.module';
import { QuestionsContractsModule } from './questions-v2/questions-v2-contracts.module';
import { SharedRedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { CacheModule } from './cache/cache.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { LecturerDashboardModule } from './lecturer-dashboard/lecturer-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Prefer this backend's local env file when running outside the frontend project.
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    SharedRedisModule,
    QueueModule,
    CacheModule,
    EventsModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ExamsModule,
    MailerModule,
    SubmissionsModule,
    AiModule,
    ExamLinksModule,
    QuestionsContractsModule,
    AuditModule,
    LecturerDashboardModule,
  ],
})
export class AppModule {}
