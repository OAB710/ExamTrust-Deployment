export declare class UpdateProfileDto {
    email?: string;
    fullName?: string;
    studentId?: string;
    department?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class DeleteProfileDto {
    currentPassword: string;
}
