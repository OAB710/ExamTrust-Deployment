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
  StreamableFile,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { SubmissionsService } from './submissions.service';
import { ExamRiskAssessmentService } from './exam-risk-assessment.service';
import { StartExamDto, SubmitExamDto, GradeAnswerDto, SuggestGradeDto, UpdateSubmissionStatusDto, AddLogsDto, AutosaveExamDto, CreateScoreAdjustmentDto, RevokeScoreAdjustmentDto, ReopenSubmissionDto, ExtendSubmissionDeadlineDto, RequestEvidenceCaptureDto, FinalizeEvidenceCaptureDto, ReviewEvidenceCaptureDto } from './dto/submission.dto';
import { ProctoringEvidenceService } from './proctoring-evidence.service';
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
    private readonly proctoringEvidence: ProctoringEvidenceService,
  ) {}

  @Sse('exam/:examId/events')
  async streamExamEvents(
    @Param('examId') examId: string,
    @Query('token') token?: string,
  ): Promise<Observable<MessageEvent>> {
    if (!token) {
      throw new UnauthorizedException('Thiếu token truy cập');
    }

    let payload: any;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'examtrust-secret-key-2024',
      );
    } catch {
      throw new UnauthorizedException('Token truy cập không hợp lệ');
    }

    const role = String(payload?.role || '').toUpperCase();
    if (!['LECTURER', 'ADMIN'].includes(role)) {
      throw new ForbiddenException('Chỉ giảng viên/quản trị viên được theo dõi sự kiện thời gian thực');
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
    @Query('examId') examId?: string,
    @Query('term') term?: string,
    @Query('academicYear') academicYear?: string,
    @Query('submittedFrom') submittedFrom?: string,
    @Query('submittedTo') submittedTo?: string,
    @Query('timeAnomaly') timeAnomaly?: string,
    @Query('status') status?: string,
    @Query('submissionId') submissionId?: string,
    @Request() req?: any,
  ) {
    return this.submissionsService.getIntegrityCases({
      page,
      limit,
      search,
      confidence,
      examTitle,
      examId,
      term,
      academicYear,
      submittedFrom,
      submittedTo,
      timeAnomaly,
      status,
      submissionId,
    }, req.user);
  }

  @Post(':id/evidence-captures/request')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit('integrity')
  requestEvidenceCapture(@Param('id') id: string, @Body() dto: RequestEvidenceCaptureDto, @Request() req) {
    return this.proctoringEvidence.requestCapture(id, req.user.id, dto);
  }

  @Post(':id/evidence-captures/:captureId/finalize')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit('integrity')
  finalizeEvidenceCapture(@Param('id') id: string, @Param('captureId') captureId: string, @Body() dto: FinalizeEvidenceCaptureDto, @Request() req) {
    return this.proctoringEvidence.finalizeCapture(id, req.user.id, captureId, dto.nonce, dto.imageDataUrl);
  }

  @Get(':id/evidence-captures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  listEvidenceCaptures(@Param('id') id: string, @Request() req) {
    return this.proctoringEvidence.listForInstructor(id, req.user);
  }

  @Get(':id/evidence-captures/:captureId/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  async getEvidenceImage(@Param('id') id: string, @Param('captureId') captureId: string, @Request() req, @Res({ passthrough: true }) res: Response) {
    const image = await this.proctoringEvidence.getImagePath(id, captureId, req.user);
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(createReadStream(image.path));
  }

  @Patch(':id/evidence-captures/:captureId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  reviewEvidenceCapture(@Param('id') id: string, @Param('captureId') captureId: string, @Body() dto: ReviewEvidenceCaptureDto, @Request() req) {
    return this.proctoringEvidence.reviewCapture(id, captureId, dto, req.user);
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

  @Get('exam/:examId/answer-matrix')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  getExamAnswerMatrix(@Param('examId') examId: string, @Request() req) {
    return this.submissionsService.getExamAnswerMatrix(examId, req.user);
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

  @Get('my-results-history')
  @UseGuards(JwtAuthGuard)
  getMyResultsHistory(@Request() req) {
    return this.submissionsService.getMyResultsHistory(req.user.id);
  }

  @Get('exam/:examId/my-submission')
  @UseGuards(JwtAuthGuard)
  getMyExamSubmission(@Param('examId') examId: string, @Request() req) {
    // Return sanitized view for the student: include proctoring summary but not raw logs
    return this.submissionsService.getStudentSubmission(examId, req.user.id).then((submission) => {
      if (!submission) return submission;
      const sanitized = this.submissionsService.sanitizeStudentSubmissionView(submission) as any;
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

  @Post(':id/score-adjustments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  createScoreAdjustment(@Param('id') id: string, @Body() dto: CreateScoreAdjustmentDto, @Request() req) {
    return this.submissionsService.createScoreAdjustment(id, dto, req.user);
  }

  @Patch(':id/score-adjustments/:adjustmentId/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  revokeScoreAdjustment(
    @Param('id') id: string,
    @Param('adjustmentId') adjustmentId: string,
    @Body() dto: RevokeScoreAdjustmentDto,
    @Request() req,
  ) {
    return this.submissionsService.revokeScoreAdjustment(id, adjustmentId, dto, req.user);
  }

  @Post(':id/reopen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  reopenSubmission(@Param('id') id: string, @Body() dto: ReopenSubmissionDto, @Request() req) {
    return this.submissionsService.reopenSubmission(id, dto.reason, req.user);
  }

  @Post(':id/deadline-extension')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  extendSubmissionDeadline(@Param('id') id: string, @Body() dto: ExtendSubmissionDeadlineDto, @Request() req) {
    return this.submissionsService.extendSubmissionDeadline(id, dto, req.user);
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

  @Post('grade-answer/ai-suggest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LECTURER', 'ADMIN')
  suggestGradeForAnswer(@Body() dto: SuggestGradeDto, @Request() req) {
    return this.submissionsService.suggestGradeForAnswer(dto.submissionAnswerId, req.user);
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
