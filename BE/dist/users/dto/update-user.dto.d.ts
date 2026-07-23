export declare class UpdateUserDto {
    email?: string;
    fullName?: string;
    password?: string;
    role?: 'ADMIN' | 'LECTURER' | 'STUDENT';
    studentId?: string;
    department?: string;
    status?: 'active' | 'suspended' | 'pending';
}
