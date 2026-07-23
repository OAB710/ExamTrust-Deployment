import { PrismaService } from '../prisma/prisma.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto } from './dto/exam-link.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ExamLinksService {
    private prisma;
    private notificationsService;
    private readonly accessPolicy;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, accessPolicy: AccessPolicyService);
    private makeToken;
    private hashToken;
    private getAppBaseUrl;
    private assertCanManageExam;
    generateLink(examId: string, dto: GenerateExamLinkDto, userId: string, role: string): Promise<{
        id: any;
        token: string;
        url: string;
        qrDataUrl: string;
        expiresAt: any;
        maxUses: any;
        restrictedToCourse: any;
        disabled: any;
    }>;
    private getLinkByRawToken;
    private validateEligibility;
    validateToken(token: string): Promise<{
        valid: boolean;
        requiresPassword: boolean;
        requiresAuth: boolean;
        examId: any;
        examTitle: any;
        course: any;
        joinUrl: string;
        expiresAt: any;
        maxUses: any;
        usedCount: any;
    }>;
    joinByToken(token: string, dto: JoinExamLinkDto, context: {
        userId?: string;
        ip?: string;
        userAgent?: string;
    }): Promise<{
        valid: boolean;
        examId: any;
        joinUrl: string;
        usedCount: any;
        maxUses: any;
    }>;
    listByExam(examId: string, userId: string, role: string): Promise<any>;
    updateLink(id: string, dto: UpdateExamLinkDto, userId: string, role: string): Promise<{
        id: any;
        disabled: any;
        expiresAt: any;
        maxUses: any;
        usedCount: any;
        note: any;
        updatedAt: any;
    }>;
    usageByLink(id: string, userId: string, role: string): Promise<any>;
}
