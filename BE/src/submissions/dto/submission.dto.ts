import { IsString, IsOptional, IsObject, IsArray, IsInt, Min, Max, IsEnum, IsBoolean, IsNumber, MaxLength, MinLength, IsDateString } from 'class-validator';

export class StartExamDto {
  @IsString()
  examId: string;

  // Client-side classification is advisory; the server also validates the UA.
  @IsOptional()
  @IsBoolean()
  isMobileOrTablet?: boolean;

  @IsOptional()
  @IsBoolean()
  webcamReady?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  webcamConsentVersion?: string;
}

export class RequestEvidenceCaptureDto {
  @IsEnum(['SCHEDULED', 'SUSPICIOUS_EVENT'])
  trigger: 'SCHEDULED' | 'SUSPICIOUS_EVENT';

  @IsOptional()
  @IsArray()
  signals?: string[];

  // Only meaningful with trigger: 'SCHEDULED' — requests the guaranteed
  // end-of-exam capture at actual submission time, bypassing the normal
  // offset-window check (elapsed time rarely lines up with the last
  // computed offset when the student submits early instead of running out
  // the clock). See ProctoringEvidenceService.requestCapture.
  @IsOptional()
  @IsBoolean()
  final?: boolean;
}

export class FinalizeEvidenceCaptureDto {
  @IsString()
  @MaxLength(200)
  nonce: string;

  @IsString()
  @MaxLength(1_500_000)
  imageDataUrl: string;
}

export class ReviewEvidenceCaptureDto {
  @IsEnum(['REVIEWED', 'DISMISSED'])
  reviewStatus: 'REVIEWED' | 'DISMISSED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewerNote?: string;
}

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsObject()
  answer: Record<string, any>;

  @IsOptional()
  @IsInt()
  timeTaken?: number; // in seconds
}

export class SubmitExamDto {
  @IsArray()
  answers: SubmitAnswerDto[];
  // Optional proctoring logs collected during the exam
  @IsOptional()
  @IsArray()
  logs?: Array<{ type: string; details?: any; ts?: number }>;
}

export class AutosaveAnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(1)
  sequence: number;

  @IsObject()
  answer: Record<string, any>;

  @IsOptional()
  @IsInt()
  timeTaken?: number; // in seconds
}

export class AutosaveExamDto {
  @IsOptional()
  @IsString()
  clientBatchId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseSubmissionVersion?: number;

  @IsArray()
  answers: AutosaveAnswerDto[];
}

export class AddLogsDto {
  @IsArray()
  logs: Array<{ type: string; details?: any; ts?: number; clientEventId?: string }>;
}

export class GradeAnswerDto {
  @IsString()
  submissionAnswerId: string;

  @IsInt()
  @Min(0)
  pointsAwarded: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SuggestGradeDto {
  @IsString()
  submissionAnswerId: string;
}

export class CreateScoreAdjustmentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-10)
  @Max(10)
  amount: number;

  @IsEnum(['QUESTION_ERROR', 'PARTICIPATION', 'OTHER'])
  category: 'QUESTION_ERROR' | 'PARTICIPATION' | 'OTHER';

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}

export class RevokeScoreAdjustmentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}

export class ReopenSubmissionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}

export class ExtendSubmissionDeadlineDto {
  @IsDateString()
  deadlineAt: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}

export class UpdateSubmissionStatusDto {
  @IsEnum(['IN_PROGRESS', 'SUBMITTED', 'GRADED', 'FLAGGED'])
  status: string;
}
