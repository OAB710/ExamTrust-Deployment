import { Module } from '@nestjs/common';
import { QuestionDraftsController } from './question-drafts.controller';
import { AIGenerationJobsController } from './ai-generation-jobs.controller';
import { QuestionsService } from './questions-v2.service';
import { AiModule } from '../ai/ai.module';
import { QuestionMetadataController } from './question-metadata.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [AiModule, MediaModule],
  controllers: [QuestionDraftsController, AIGenerationJobsController, QuestionMetadataController],
  providers: [QuestionsService],
})
export class QuestionsContractsModule {}
