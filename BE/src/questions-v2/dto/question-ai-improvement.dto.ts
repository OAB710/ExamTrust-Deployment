import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionAiImprovementDto {
  @IsString()
  questionId: string;

  @IsString()
  examId: string;

  @IsOptional()
  @IsString()
  examQuestionId?: string;

  @IsOptional()
  @IsString()
  qualityReviewId?: string;

  @IsOptional()
  @IsObject()
  analytics?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instruction?: string;
}

export class UpdateQuestionAiImprovementDraftDto {
  @IsObject()
  draft: Record<string, any>;
}

export class ApproveQuestionAiImprovementDto {
  @IsObject()
  final: Record<string, any>;
}

export class RejectQuestionAiImprovementDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
