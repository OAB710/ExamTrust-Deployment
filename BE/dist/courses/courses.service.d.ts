import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
interface AuthUser {
    id: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}
export declare class CoursesService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private assertLecturerExists;
    private assertCanAccessCourse;
    private toAsciiUpper;
    private buildToken;
    private generateCourseCode;
    create(createCourseDto: CreateCourseDto, user: AuthUser): Promise<any>;
    findAll(lecturerId?: string, pagination?: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    findOne(id: string, user: AuthUser): Promise<any>;
    update(id: string, updateCourseDto: UpdateCourseDto, user: AuthUser): Promise<any>;
    remove(id: string, user: AuthUser): Promise<{
        message: string;
    }>;
    getMyCoursesAsStudent(studentId: string, limit?: number): Promise<any>;
    getMyCoursesAsLecturer(lecturerId: string): Promise<any[]>;
}
export {};
