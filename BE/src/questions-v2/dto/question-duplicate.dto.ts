import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class DuplicateQuestionCheckDto {
  @IsString()
  courseId: string;
}

export class UpdateDuplicatePreferenceDto {
  @IsInt()
  @Min(1)
  @Max(100)
  similarityThreshold: number;
}

export class CreateDuplicateAnalysisJobDto {
  @IsString()
  courseId: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(30)
  @IsUUID('4', { each: true })
  questionIds: string[];
}
