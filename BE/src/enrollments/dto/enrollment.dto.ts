import { IsString, IsArray, IsOptional, IsEnum, IsEmail, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDto {
  @IsString({ message: 'courseId phải là chuỗi ký tự' })
  courseId: string;

  @IsString({ message: 'studentId phải là chuỗi ký tự' })
  studentId: string;
}

export class BulkEnrollmentDto {
  @IsString({ message: 'courseId phải là chuỗi ký tự' })
  courseId: string;

  @IsArray({ message: 'studentIds phải là danh sách' })
  @IsString({ each: true, message: 'Mỗi studentId phải là chuỗi ký tự' })
  studentIds: string[];
}

export class BulkEnrollByEmailsDto {
  @IsString({ message: 'courseId phải là chuỗi ký tự' })
  courseId: string;

  @IsArray({ message: 'emails phải là danh sách' })
  @IsString({ each: true, message: 'Mỗi email phải là chuỗi ký tự' })
  emails: string[];
}

export class UpdateEnrollmentStatusDto {
  @IsEnum(['ACTIVE', 'DROPPED', 'COMPLETED'], { message: 'Trạng thái ghi danh không hợp lệ' })
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
}

export class BulkImportStudentRow {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Cần nhập mã sinh viên' })
  studentId: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Cần nhập họ và tên' })
  fullName: string;

  @IsString({ message: 'Khoa/Đơn vị phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Cần nhập khoa/đơn vị' })
  department: string;
}

export class BulkImportStudentsDto {
  @IsString({ message: 'courseId phải là chuỗi ký tự' })
  courseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportStudentRow)
  students: BulkImportStudentRow[];
}
