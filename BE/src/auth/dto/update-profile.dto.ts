import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  studentId?: string;

  @IsOptional()
  @IsString({ message: 'Khoa/Đơn vị phải là chuỗi ký tự' })
  department?: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  currentPassword: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

export class DeleteProfileDto {
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  currentPassword: string;
}
