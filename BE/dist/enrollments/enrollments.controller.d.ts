import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, BulkEnrollmentDto, BulkEnrollByEmailsDto, BulkImportStudentsDto, UpdateEnrollmentStatusDto } from './dto/enrollment.dto';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    create(createEnrollmentDto: CreateEnrollmentDto, req: any): Promise<any>;
    bulkEnroll(bulkEnrollmentDto: BulkEnrollmentDto, req: any): Promise<{
        success: string[];
        failed: {
            studentId: string;
            reason: string;
        }[];
    }>;
    bulkEnrollByEmails(dto: BulkEnrollByEmailsDto, req: any): Promise<{
        success: {
            email: string;
            fullName: string;
            studentId: string | null;
        }[];
        failed: {
            email: string;
            reason: string;
        }[];
        provisioned: number;
    }>;
    bulkImport(dto: BulkImportStudentsDto, req: any): Promise<{
        success: {
            email: string;
            fullName: string;
            studentId: string | null;
            row: number;
        }[];
        failed: {
            email: string;
            reason: string;
            row: number;
        }[];
        provisioned: number;
        totalProcessed: number;
    }>;
    searchTrainingSystemStudents(query?: string, courseId?: string): Promise<any>;
    findByCourse(courseId: string, req: any): Promise<any>;
    findByStudent(studentId: string, req: any): never[] | Promise<any>;
    getMyEnrollments(req: any): Promise<any>;
    updateStatus(id: string, updateStatusDto: UpdateEnrollmentStatusDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    removeByStudentAndCourse(courseId: string, studentId: string, req: any): Promise<{
        message: string;
    }>;
}
