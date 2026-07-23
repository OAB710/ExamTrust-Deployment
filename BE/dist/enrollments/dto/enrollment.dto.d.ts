export declare class CreateEnrollmentDto {
    courseId: string;
    studentId: string;
}
export declare class BulkEnrollmentDto {
    courseId: string;
    studentIds: string[];
}
export declare class BulkEnrollByEmailsDto {
    courseId: string;
    emails: string[];
}
export declare class UpdateEnrollmentStatusDto {
    status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
}
export declare class BulkImportStudentRow {
    email: string;
    studentId?: string;
    fullName?: string;
    className?: string;
}
export declare class BulkImportStudentsDto {
    courseId: string;
    students: BulkImportStudentRow[];
}
