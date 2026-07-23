export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    role?: 'ADMIN' | 'LECTURER' | 'STUDENT';
    studentId?: string;
    department?: string;
}
