import { IsString, IsEnum, IsOptional, IsObject, IsInt, Min, Max, IsArray, IsIn } from 'class-validator';

export class CopyQuestionBankDto {
  @IsString()
  sourceCourseId: string;

  @IsString()
  targetCourseId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topicIds?: string[];
}

export class CreateQuestionCrudDto {
  @IsEnum(['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING', 'FIND_ERROR'])
  type: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsObject()
  correctAnswer?: Record<string, any>;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  defaultPoints?: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  // Single optional media attachment. All four are set together (after a
  // successful presigned upload to R2) or all cleared together (null) when
  // the lecturer removes the attachment.
  @IsOptional()
  @IsString()
  mediaUrl?: string | null;

  @IsOptional()
  @IsIn(['image', 'audio'])
  mediaType?: 'image' | 'audio' | null;

  @IsOptional()
  @IsString()
  mediaKey?: string | null;

  @IsOptional()
  @IsInt()
  mediaSizeBytes?: number | null;
}

export class UpdateQuestionCrudDto {
  @IsOptional()
  @IsEnum(['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING', 'FIND_ERROR'])
  type?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @IsOptional()
  @IsObject()
  correctAnswer?: Record<string, any>;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  defaultPoints?: number;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string | null;

  @IsOptional()
  @IsIn(['image', 'audio'])
  mediaType?: 'image' | 'audio' | null;

  @IsOptional()
  @IsString()
  mediaKey?: string | null;

  @IsOptional()
  @IsInt()
  mediaSizeBytes?: number | null;
}
