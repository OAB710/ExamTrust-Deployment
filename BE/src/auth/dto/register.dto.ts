import { IsString, IsEmail, IsOptional, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'LECTURER', 'STUDENT'], { message: 'Vai trò không hợp lệ' })
  role?: 'ADMIN' | 'LECTURER' | 'STUDENT';

  @IsOptional()
  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  studentId?: string;

  @IsOptional()
  @IsString({ message: 'Khoa/Đơn vị phải là chuỗi ký tự' })
  department?: string;
}
