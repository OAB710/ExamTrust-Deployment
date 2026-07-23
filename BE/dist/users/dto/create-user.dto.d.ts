export declare class CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    studentId?: string;
    department?: string;
    status?: 'active' | 'suspended' | 'pending';
}
