import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Headers,
  Query,
  UseGuards,
  Request,
  Res,
  Sse,
  MessageEvent,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { SubmissionsService } from './submissions.service';
import { ExamRiskAssessmentService } from './exam-risk-assessment.service';
import { StartExamDto, SubmitExamDto, GradeAnswerDto, UpdateSubmissionStatusDto, AddLogsDto, AutosaveExamDto } from './dto/submission.dto';
import { ReviewAnomalyFlagDto, ReviewIntegrityCaseDto } from './dto/risk-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Observable } from 'rxjs';
import { SubmissionsEventsService } from './submissions-events.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import * as jwt from 'jsonwebtoken';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Submissions')
@ApiBearerAuth('access-token')
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly submissionsEvents: SubmissionsEventsService,
    private readonly riskAssessmentService: ExamRiskAssessmentService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  @Sse('exam/:examId/events')
  async streamExamEvents(
    @Param('examId') examId: string,
    @Query('token') token?: string,
  ): Promise<Observable<MessageEvent>> {
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: any;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'examtrust-secret-key-2024',
      );
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const role = String(payload?.role || '').toUpperCase();
    if (!['LECTURER', 'ADMIN'].includes(role)) {
      throw new ForbiddenException('Only lecturers/admin can monitor realtime events');
    }

    await this.accessPolicy.assertInstructorCanAccessExam(examId, {
      id: String(payload?.sub || payload?.id || ''),
      role,
    });

    return this.submissionsEvents.streamExam(examId);
  }

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit('start')
  startExam(@Body() startExamDto: StartExamDto, @Request() req) {
    const userAgent = req?.headers?.['user-agent'] || undefined;
    return this.submissionsService.startExam(startExamDto, req.user.id, { userAgent });
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit('submit')
  submitExam(
    @Param('id') id: string,
    @Body() submitExamDto: SubmitExamDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Request() req,
  ) {
    return this.submissionsService.submitExam(id, submitExamDto, req.user.id, { idempotencyKey });
  }

  @Post(':id/autosave')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit('autosave')
  autosaveAnswers(
    @Param('id') id: string,
    @Body() autosaveExamDto: AutosaveExamDto,
    @Request() req,
  ) {
    return this.submissionsService.autosaveAnswers(id, autosaveExamDto, req.user.id);
  }

  @Post(':id/logs')
  @UseGuards(JwtAuthGuard)
  @UseGuards(RateLimitGuard)
  @RateLimit('integrity')
  addLogs(
    @Param('id') id: string,
    @Body() addLogsDto: AddLogsDto,
    @Request() req,
  ) {
    return this.submissionsService.addLogs(id, addLogsDto.logs || [], req.user.id);
  }

  @Get('integrity/cases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LECTURER')
  getIntegrityCases(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('confidence') confidence?: string,
    @Query('examTitle') examTitle?: string,
    @Query('submittedFrom') submittedFrom?: string,
    @Query('submittedTo') submittedTo?: string,
    @Query('timeAnomaly') timeAnomaly?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    return this.submissionsService.getIntegrityCases({
      page,
      limit,
      search,
      confidence,
      examTitle,
      submittedFrom,
      submittedTo,
      timeAnomaly,
      status,
    }, req.user);
  }

  @Patch('integrity/cases/:submissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LECTURER')
  reviewIntegrityCase(
    @Param('submissionId') submissionId: string,
    @Body() dto: ReviewIntegrityCaseDto,
    @Request() req,
  ) {
    return this.submissionsService.reviewIntegrityCase(submissionId, dto, req.user);
  }

  @Get(':id/timeline')
  @UseGuards(JwtAuthGuard)
  getSubmissionTimeline(@Param('id') id: string, @Request() req) {
    return this.submissionsService.getSubmissionTimeline(id, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    return this.submissionsService.findAll(pagination);
  }

  @Get('exam/:examId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  findByExam(
    @Param('examId') examId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?,
  ) {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    return this.submissionsService.findByExam(examId, pagination, req.user);
  }

  @Get('exam/:examId/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getExamOverview(@Param('examId') examId: string, @Request() req) {
    return this.submissionsService.getExamOverview(examId, req.user);
  }

  @Get('exam/:examId/intelligence')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getExamIntelligence(@Param('examId') examId: string, @Request() req) {
    return this.submissionsService.getExamIntelligence(examId, req.user);
  }

  @Post(':id/risk-assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  requestRiskAssessment(@Param('id') id: string, @Request() req) {
    return this.riskAssessmentService.requestAssessment(id, req.user);
  }

  @Get(':id/risk-assessment/eligibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getRiskAssessmentEligibility(@Param('id') id: string, @Request() req) {
    return this.riskAssessmentService.getEligibility(id, req.user);
  }

  @Get(':id/risk-assessment/jobs/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getRiskAssessmentJob(
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Request() req,
  ) {
    return this.riskAssessmentService.getJob(id, jobId, req.user);
  }

  @Get('exam/:examId/risk-flags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  listRiskFlags(
    @Param('examId') examId: string,
    @Query('status') status: string,
    @Request() req,
  ) {
    return this.riskAssessmentService.listFlags(examId, req.user, status);
  }

  @Patch('risk-flags/:flagId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  reviewRiskFlag(
    @Param('flagId') flagId: string,
    @Body() dto: ReviewAnomalyFlagDto,
    @Request() req,
  ) {
    return this.riskAssessmentService.reviewFlag(flagId, dto, req.user);
  }

  @Get('exam/:examId/manual-grading-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getManualGradingStatus(@Param('examId') examId: string, @Request() req) {
    return this.submissionsService.getManualGradingStatus(examId, req.user);
  }

  @Post('exam/:examId/publish-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  publishExamResults(@Param('examId') examId: string, @Request() req) {
    return this.submissionsService.publishExamResults(examId, req.user);
  }

  @Get('exam/:examId/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  async exportExamResults(@Param('examId') examId: string, @Request() req, @Res() res: Response) {
    const csv = await this.submissionsService.exportExamResults(examId, req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="exam-${examId}-results.csv"`);
    return res.send(csv);
  }

  @Get('my-submissions')
  @UseGuards(JwtAuthGuard)
  getMySubmissions(@Request() req) {
    return this.submissionsService.findByStudent(req.user.id);
  }

  @Get('exam/:examId/my-submission')
  @UseGuards(JwtAuthGuard)
  getMyExamSubmission(@Param('examId') examId: string, @Request() req) {
    // Return sanitized view for the student: include proctoring summary but not raw logs
    return this.submissionsService.getStudentSubmission(examId, req.user.id).then((submission) => {
      if (!submission) return submission;
      const sanitized = { ...submission } as any;
      if (sanitized.proctoring) {
        sanitized.proctoring = {
          tabSwitchCount: sanitized.proctoring.tabSwitchCount ?? 0,
          mouseAnomalies: sanitized.proctoring.mouseAnomalies ?? 0,
          logsCount: Array.isArray(sanitized.proctoring.logs) ? sanitized.proctoring.logs.length : 0,
        };
      }
      return sanitized;
    });
  }

  @Get('my-submissions/:id')
  @UseGuards(JwtAuthGuard)
  getMySubmissionById(@Param('id') id: string, @Request() req) {
    return this.submissionsService.getMySubmissionById(id, req.user.id).then((submission) => {
      if (!submission) return submission;
      const sanitized = { ...submission } as any;
      if (sanitized.proctoring) {
        sanitized.proctoring = {
          tabSwitchCount: sanitized.proctoring.tabSwitchCount ?? 0,
          mouseAnomalies: sanitized.proctoring.mouseAnomalies ?? 0,
          logsCount: Array.isArray(sanitized.proctoring.logs) ? sanitized.proctoring.logs.length : 0,
        };
      }
      return sanitized;
    });
  }

  @Get('exam/:examId/student/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  async getStudentSubmissionForInstructor(@Param('examId') examId: string, @Param('studentId') studentId: string, @Request() req) {
    // Lecturer / admin endpoint - returns full submission including proctoring.logs
    await this.accessPolicy.assertInstructorCanAccessExam(examId, req.user);
    return this.submissionsService.getStudentSubmission(examId, studentId);
  }

  @Get(':id/manual-grading')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getManualGradingSubmission(@Param('id') id: string, @Request() req) {
    return this.submissionsService.getManualGradingSubmission(id, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.submissionsService.findOne(id, req.user);
  }

  @Post('grade-answer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  gradeAnswer(@Body() gradeDto: GradeAnswerDto, @Request() req) {
    return this.submissionsService.gradeAnswer(gradeDto, req.user);
  }

  @Post(':id/finalize-grading')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  finalizeGrading(@Param('id') id: string, @Request() req) {
    return this.submissionsService.finalizeGrading(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateSubmissionStatusDto, @Request() req) {
    return this.submissionsService.updateStatus(id, updateDto, req.user);
  }
}
