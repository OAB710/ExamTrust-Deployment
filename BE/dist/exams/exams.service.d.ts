import { PrismaService } from '../prisma/prisma.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { CreateExamDto, UpdateExamDto, UpdateExamQuestionDto, RescheduleExamDto } from './dto/exam.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ExamsService {
    private prisma;
    private notificationsService;
    private readonly accessPolicy;
    private examQuestionVersionColumnExists;
    private examQuestionAssignedScoreColumnExists;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, accessPolicy: AccessPolicyService);
    private getCourseRecipientIds;
    private hasExamQuestionVersionColumn;
    private hasExamQuestionAssignedScoreColumn;
    private insertExamQuestionCompat;
    private parseRawJson;
    private buildQuestionSnapshotPayload;
    private loadExamQuestionsCompat;
    create(createExamDto: CreateExamDto, creatorId: string, creatorRole?: string): Promise<any>;
    findAll(filters?: {
        courseId?: string;
        creatorId?: string;
        status?: string;
    }, pagination?: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    findOne(id: string): Promise<any>;
    findForStudent(id: string, studentId: string, clientIp?: string | null): Promise<any>;
    update(id: string, updateExamDto: UpdateExamDto): Promise<any>;
    reschedule(id: string, rescheduleExamDto: RescheduleExamDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    addQuestionsToExam(examId: string, questionIds: string[]): Promise<any[]>;
    removeQuestionFromExam(examId: string, questionId: string): Promise<{
        message: string;
    }>;
    updateExamQuestion(examId: string, questionId: string, updateDto: UpdateExamQuestionDto): Promise<any>;
    publishExam(id: string): Promise<any>;
    getAvailableExamsForStudent(studentId: string): Promise<any>;
    getCourseExamsForStudent(studentId: string, courseId: string): Promise<any>;
    getExamStats(examId: string): Promise<{
        analyticsScope: string;
        isUnlimited: boolean;
        totalQuestions: any;
        totalSubmissions: any;
        analyzedSubmissions: any;
        completedSubmissions: any;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        passRate: number;
    }>;
    private collapseLatestCompletedSubmissions;
    private normalizeQuestionType;
}
