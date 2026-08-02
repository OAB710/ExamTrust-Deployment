import { IsInt, IsString, Max, Min } from 'class-validator';

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
