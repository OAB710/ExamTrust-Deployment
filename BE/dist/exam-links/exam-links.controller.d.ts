import { ExamLinksService } from './exam-links.service';
import { GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto } from './dto/exam-link.dto';
export declare class ExamLinksController {
    private readonly examLinksService;
    constructor(examLinksService: ExamLinksService);
    generateLink(examId: string, dto: GenerateExamLinkDto, req: any): Promise<{
        id: any;
        token: string;
        url: string;
        qrDataUrl: string;
        expiresAt: any;
        maxUses: any;
        restrictedToCourse: any;
        disabled: any;
    }>;
    listExamLinks(examId: string, req: any): Promise<any>;
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
    joinByToken(token: string, dto: JoinExamLinkDto, req: any): Promise<{
        valid: boolean;
        examId: any;
        joinUrl: string;
        usedCount: any;
        maxUses: any;
    }>;
    updateLink(id: string, dto: UpdateExamLinkDto, req: any): Promise<{
        id: any;
        disabled: any;
        expiresAt: any;
        maxUses: any;
        usedCount: any;
        note: any;
        updatedAt: any;
    }>;
    getUsage(id: string, req: any): Promise<any>;
}
