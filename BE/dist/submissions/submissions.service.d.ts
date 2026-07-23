import { PrismaService } from '../prisma/prisma.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { StartExamDto, SubmitExamDto, GradeAnswerDto, UpdateSubmissionStatusDto, AutosaveExamDto } from './dto/submission.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SubmissionsEventsService } from './submissions-events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueueService } from '../queue/queue.service';
type IntegrityCaseConfidence = 'High' | 'Medium' | 'Low';
type IntegrityCaseStatus = 'pending' | 'reviewed' | 'dismissed' | 'confirmed';
type IntegrityReasonType = 'similarity' | 'timing' | 'pattern' | 'behavior';
type IntegrityCasesQuery = {
    page?: string | number;
    limit?: string | number;
    search?: string;
    confidence?: string;
    examTitle?: string;
    submittedFrom?: string;
    submittedTo?: string;
    timeAnomaly?: string | boolean;
    status?: string;
};
type IntegrityCase = {
    id: string;
    submissionId: string;
    studentId: string;
    studentName: string;
    examId: string;
    examTitle: string;
    submittedAt: string;
    confidence: IntegrityCaseConfidence;
    status: IntegrityCaseStatus;
    reasons: Array<{
        type: IntegrityReasonType;
        description: string;
        weight: number;
        evidence?: string;
    }>;
    similarityScore?: number;
    timeAnomaly?: boolean;
    patternMatch?: string[];
};
type RequestUser = {
    id: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
};
export declare class SubmissionsService {
    private prisma;
    private submissionsEvents;
    private readonly notificationsService;
    private readonly accessPolicy;
    private readonly queueService;
    constructor(prisma: PrismaService, submissionsEvents: SubmissionsEventsService, notificationsService: NotificationsService, accessPolicy: AccessPolicyService, queueService: QueueService);
    private getLatestExamSnapshotId;
    private getRealtimeSeverity;
    private clampPercent;
    private seededRandom;
    private shuffleWithSeed;
    private parseLogDetails;
    private getIntegrityLogWeight;
    private getIntegrityConfidence;
    private isTimingAnomalyLog;
    private buildIntegrityLogReason;
    private publishRealtimeLogs;
    startExam(startExamDto: StartExamDto, studentId: string, context?: {
        remoteIp?: string;
        forwardedFor?: string;
        userAgent?: string;
    }): Promise<any>;
    submitExam(submissionId: string, submitExamDto: SubmitExamDto, studentId: string, options?: {
        idempotencyKey?: string;
    }): Promise<any>;
    autosaveAnswers(submissionId: string, payload: AutosaveExamDto, studentId: string): Promise<{
        success: boolean;
        count: number;
        skipped: number;
        serverVersion: number;
    }>;
    addLogs(submissionId: string, logs: Array<{
        type: string;
        details?: any;
        ts?: number;
    }>, studentId: string): Promise<void>;
    private sendIntegrityNotifications;
    private compareAnswers;
    getIntegrityCases(query?: IntegrityCasesQuery): Promise<{
        data: IntegrityCase[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        stats: {
            totalFlagged: number;
            pendingReview: number;
            highConfidence: number;
            confirmedCases: number;
        };
        patterns: {
            tabSwitch: number;
            mouseAnomaly: number;
            copyPaste: number;
            otherBehavior: number;
        };
    }>;
    private buildSubmitResponse;
    gradeAnswer(gradeDto: GradeAnswerDto, actor: {
        id: string;
        role?: string;
    }): Promise<any>;
    finalizeSubmission(submissionId: string): Promise<void>;
    finalizeGrading(submissionId: string, user?: RequestUser): Promise<void>;
    findByExam(examId: string, pagination?: PaginationDto, user?: RequestUser): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    getManualGradingStatus(examId: string, user?: RequestUser): Promise<{
        exam: any;
        hasManualGrading: boolean;
        manualTotal: any;
        manualGraded: any;
        manualPending: number;
        published: any;
        canPublish: boolean;
        submissions: any;
    }>;
    getManualGradingSubmission(submissionId: string, user?: RequestUser): Promise<any>;
    publishExamResults(examId: string, user?: RequestUser): Promise<{
        exam: any;
        hasManualGrading: boolean;
        manualTotal: any;
        manualGraded: any;
        manualPending: number;
        published: any;
        canPublish: boolean;
        submissions: any;
    }>;
    private parseJsonValue;
    private toNumber;
    private normalizeScore;
    private mapSnapshotQuestions;
    getExamOverview(examId: string, user?: RequestUser): Promise<{
        exam: any;
        analyticsScope: string;
        isUnlimited: boolean;
        summary: {
            totalSubmissions: any;
            inProgress: any;
            completed: any;
            avgScorePct: number;
            highestScorePct: number;
            lowestScorePct: number;
        };
        scoreDistribution: {
            key: string;
            min: number;
            max: number;
            count: number;
        }[];
        anomalies: any[];
        updatedAt: string;
    }>;
    getExamIntelligence(examId: string, user?: RequestUser): Promise<{
        exam: any;
        analyticsScope: string;
        isUnlimited: boolean;
        kpis: {
            totalSubmissions: any;
            analyzedSubmissions: any;
            completedSubmissions: any;
            completionRate: number;
            avgScorePct: number;
            passRate: number;
        };
        visualizations: {
            correctVsIncorrect: {
                correct: any;
                incorrect: any;
                skipped: any;
            };
            trendSeries: {
                date: string;
                avgScorePct: number;
            }[];
        };
        questionMetrics: any;
        mostIncorrectQuestions: any[];
        weakestTopics: {
            topicId: string | null;
            topicName: string;
            incorrectRate: number;
            skipRate: number;
            action: {
                path: string;
                params: {
                    courseId: any;
                    topicId: string | undefined;
                };
            };
        }[];
        slowestQuestionTypes: {
            type: string;
            avgTimeSeconds: number;
            incorrectRate: number;
            skipRate: number;
            action: {
                path: string;
                params: {
                    courseId: any;
                    type: string;
                };
            };
        }[];
        mostFlaggedQuestions: any[];
        abnormalSkips: any[];
        aiSummary: string;
        aiRecommendations: ({
            title: string;
            detail: string;
            action: {
                path: string;
                params: {
                    courseId: any;
                    topicId: string | undefined;
                };
            };
        } | {
            title: string;
            detail: string;
            action: {
                path: string;
                params: {
                    courseId: any;
                    type: string;
                };
            };
        })[];
        creatorQualityAlerts: any;
        trackingPlan: {
            experimentName: string;
            primaryMetrics: string[];
            eventKeys: string[];
        };
        updatedAt: string;
    }>;
    getSubmissionTimeline(submissionId: string, user: RequestUser): Promise<{
        submission: {
            id: any;
            status: any;
            startedAt: any;
            submittedAt: any;
            exam: any;
            student: any;
        };
        summary: {
            totalEvents: number;
            tabSwitches: number;
            mouseAnomalies: number;
            warnings: number;
            critical: number;
            anomalyScore: number | null;
            suspiciousFlag: boolean;
        };
        events: {
            id: string;
            timestamp: string;
            type: string;
            description: string;
            severity: "normal" | "warning" | "critical";
            detail?: string;
        }[];
        integrityNotes: {
            id: string;
            question: null;
            note: string;
            severity: "warning" | "normal" | "critical";
            timestamp: string;
            detail: string | undefined;
            order: number;
        }[];
        updatedAt: string;
    }>;
    findAll(pagination?: PaginationDto): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    findByStudent(studentId: string): Promise<any>;
    getMySubmissionById(submissionId: string, studentId: string): Promise<any>;
    findOne(id: string, user?: RequestUser): Promise<any>;
    exportExamResults(examId: string, user?: RequestUser): Promise<string>;
    getStudentSubmission(examId: string, studentId: string): Promise<any>;
    private resolveConfiguredMaxAttempts;
    private isUnlimitedAttemptsExam;
    private collapseLatestCompletedSubmissions;
    updateStatus(id: string, updateDto: UpdateSubmissionStatusDto, user?: RequestUser): Promise<any>;
}
export {};
