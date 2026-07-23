import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto, BulkEnrollmentDto, BulkEnrollByEmailsDto, BulkImportStudentsDto, UpdateEnrollmentStatusDto } from './dto/enrollment.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class EnrollmentsService {
    private prisma;
    private notificationsService;
    private readonly logger;
    private assertCanManageCourse;
    private assertCanManageCourseById;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(createEnrollmentDto: CreateEnrollmentDto, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<any>;
    bulkEnroll(bulkEnrollmentDto: BulkEnrollmentDto, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<{
        success: string[];
        failed: {
            studentId: string;
            reason: string;
        }[];
    }>;
    bulkEnrollByEmails(dto: BulkEnrollByEmailsDto, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<{
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
    bulkImport(dto: BulkImportStudentsDto, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<{
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
    findByCourse(courseId: string, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<any>;
    findByStudent(studentId: string): Promise<any>;
    updateStatus(id: string, updateStatusDto: UpdateEnrollmentStatusDto, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<any>;
    remove(id: string, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<{
        message: string;
    }>;
    removeByStudentAndCourse(studentId: string, courseId: string, user: {
        id: string;
        role: 'ADMIN' | 'LECTURER' | 'STUDENT';
    }): Promise<{
        message: string;
    }>;
}
