import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
type AuthUser = {
    id: string;
    role?: string;
};
export declare class AccessPolicyService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    resolveClientIpFromParts(remoteIpRaw?: string | null, forwardedForRaw?: string | null): string | null;
    resolveClientIp(req: Request): string | null;
    isIpAllowedForExam(examId: string, clientIp: string | null): Promise<{
        allowed: boolean;
        reason: string;
    } | {
        allowed: boolean;
        reason?: undefined;
    }>;
    assertInstructorCanAccessExam(examId: string, user: AuthUser): Promise<any>;
    assertInstructorCanAccessCourse(courseId: string, user: AuthUser): Promise<any>;
    assertInstructorCanAccessSubmission(submissionId: string, user: AuthUser): Promise<any>;
    assertInstructorCanAccessSubmissionAnswer(answerId: string, user: AuthUser): Promise<any>;
    assertInstructorCanAccessAnomalyFlag(flagId: string, user: AuthUser): Promise<any>;
    logDeniedAccess(examId: string, data: {
        studentId?: string | null;
        resolvedClientIp?: string | null;
        remoteIp?: string | null;
        forwardedFor?: string | null;
        userAgent?: string | null;
        reasonCode?: string | null;
        reasonMessage?: string | null;
        route?: string | null;
    }): Promise<void>;
}
export {};
