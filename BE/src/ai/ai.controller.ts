import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GenerateQuestionDto, GenerateExamQuestionsDto, SuggestSimilarTopicsDto } from './dto/generate-question.dto';
import { AiJobsService } from './ai-jobs.service';
import { AiService } from './ai.service';
import { AISection } from '../questions-v2/dto/question-draft.dto';
import { AccessPolicyService } from '../common/services/access-policy.service';

@ApiTags('AI')
@ApiBearerAuth('access-token')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LECTURER', 'ADMIN')
export class AiController {
  constructor(
    private readonly aiJobsService: AiJobsService,
    private readonly aiService: AiService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  private async assertCourseContext(data: { courseId?: string; context?: Record<string, any> }, user: any) {
    const courseId = String(data?.courseId || data?.context?.courseId || '').trim();
    if (courseId) {
      await this.accessPolicy.assertInstructorCanAccessCourse(courseId, user);
    }
  }

  @Post('generate-question')
  async generateQuestion(@Body() dto: GenerateQuestionDto, @Request() req) {
    await this.assertCourseContext(dto, req.user);

    const job = await this.aiJobsService.createJob({
      task: 'single-question',
      section: AISection.CONTENT,
      payload: {
        prompt: dto.prompt,
        questionType: dto.questionType,
        difficulty: dto.difficulty,
        language: dto.language,
        courseName: dto.courseName,
        useCase: dto.useCase,
        context: dto.context || {},
      },
      requestedBy: req.user.id,
    });

    return { jobId: job.id, status: job.status };
  }

  @Post('generate-exam-questions')
  async generateExamQuestions(@Body() dto: GenerateExamQuestionsDto, @Request() req) {
    await this.assertCourseContext(dto, req.user);

    const job = await this.aiJobsService.createJob({
      task: 'exam-questions',
      section: AISection.CONTENT,
      payload: {
        prompt: dto.prompt,
        questionCount: dto.questionCount,
        difficulty: dto.difficulty,
        questionType: dto.questionType,
        language: dto.language,
        courseName: dto.courseName,
        useCase: dto.useCase,
        context: dto.context || {},
      },
      requestedBy: req.user.id,
    });

    return { jobId: job.id, status: job.status };
  }

  @Post('suggest-similar-topics')
  async suggestSimilarTopics(@Body() dto: SuggestSimilarTopicsDto, @Request() req) {
    await this.assertCourseContext(dto, req.user);

    return this.aiService.suggestSimilarTopics({
      topicName: dto.topicName,
      existingTopics: dto.existingTopics,
      language: dto.language,
      courseName: dto.courseName,
      context: dto.context || {},
    });
  }
}
