import { IsString, IsArray, IsOptional, IsEnum, IsEmail, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDto {
  @IsString()
  courseId: string;

  @IsString()
  studentId: string;
}

export class BulkEnrollmentDto {
  @IsString()
  courseId: string;

  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class BulkEnrollByEmailsDto {
  @IsString()
  courseId: string;

  @IsArray()
  @IsString({ each: true })
  emails: string[];
}

export class UpdateEnrollmentStatusDto {
  @IsEnum(['ACTIVE', 'DROPPED', 'COMPLETED'])
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
}

export class BulkImportStudentRow {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  department: string;
}

export class BulkImportStudentsDto {
  @IsString()
  courseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportStudentRow)
  students: BulkImportStudentRow[];
}
