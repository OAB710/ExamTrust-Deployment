import { IsString, IsOptional, IsEnum, IsEmail, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'LECTURER', 'STUDENT'], { message: 'Vai trò không hợp lệ' })
  role?: 'ADMIN' | 'LECTURER' | 'STUDENT';

  @IsOptional()
  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  studentId?: string;

  @IsOptional()
  @IsString({ message: 'Khoa/Đơn vị phải là chuỗi ký tự' })
  department?: string;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'pending'], { message: 'Trạng thái không hợp lệ' })
  status?: 'active' | 'suspended' | 'pending';
}
