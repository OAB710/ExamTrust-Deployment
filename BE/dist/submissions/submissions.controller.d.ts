import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { SubmissionsService } from './submissions.service';
import { ExamRiskAssessmentService } from './exam-risk-assessment.service';
import { StartExamDto, SubmitExamDto, GradeAnswerDto, UpdateSubmissionStatusDto, AddLogsDto, AutosaveExamDto } from './dto/submission.dto';
import { ReviewAnomalyFlagDto } from './dto/risk-assessment.dto';
import { Observable } from 'rxjs';
import { SubmissionsEventsService } from './submissions-events.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
export declare class SubmissionsController {
    private readonly submissionsService;
    private readonly submissionsEvents;
    private readonly riskAssessmentService;
    private readonly accessPolicy;
    constructor(submissionsService: SubmissionsService, submissionsEvents: SubmissionsEventsService, riskAssessmentService: ExamRiskAssessmentService, accessPolicy: AccessPolicyService);
    streamExamEvents(examId: string, token?: string): Promise<Observable<MessageEvent>>;
    startExam(startExamDto: StartExamDto, req: any): Promise<any>;
    submitExam(id: string, submitExamDto: SubmitExamDto, idempotencyKey: string | undefined, req: any): Promise<any>;
    autosaveAnswers(id: string, autosaveExamDto: AutosaveExamDto, req: any): Promise<{
        success: boolean;
        count: number;
        skipped: number;
        serverVersion: number;
    }>;
    addLogs(id: string, addLogsDto: AddLogsDto, req: any): Promise<void>;
    getIntegrityCases(page?: string, limit?: string, search?: string, confidence?: string, examTitle?: string, submittedFrom?: string, submittedTo?: string, timeAnomaly?: string, status?: string): Promise<{
        data: {
            id: string;
            submissionId: string;
            studentId: string;
            studentName: string;
            examId: string;
            examTitle: string;
            submittedAt: string;
            confidence: "Medium" | "High" | "Low";
            status: "pending" | "reviewed" | "dismissed" | "confirmed";
            reasons: Array<{
                type: "similarity" | "timing" | "pattern" | "behavior";
                description: string;
                weight: number;
                evidence?: string;
            }>;
            similarityScore?: number;
            timeAnomaly?: boolean;
            patternMatch?: string[];
        }[];
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
    getSubmissionTimeline(id: string, req: any): Promise<{
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
    findAll(page?: string, limit?: string): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    findByExam(examId: string, page?: string, limit?: string, req?: any): Promise<import("../common/dto/pagination.dto").PaginatedResult<unknown>>;
    getExamOverview(examId: string, req: any): Promise<{
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
    getExamIntelligence(examId: string, req: any): Promise<{
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
    requestRiskAssessment(id: string, req: any): Promise<{
        jobId: any;
        status: any;
    }>;
    getRiskAssessmentJob(id: string, jobId: string, req: any): Promise<any>;
    listRiskFlags(examId: string, status: string, req: any): Promise<any>;
    reviewRiskFlag(flagId: string, dto: ReviewAnomalyFlagDto, req: any): Promise<any>;
    getManualGradingStatus(examId: string, req: any): Promise<{
        exam: any;
        hasManualGrading: boolean;
        manualTotal: any;
        manualGraded: any;
        manualPending: number;
        published: any;
        canPublish: boolean;
        submissions: any;
    }>;
    publishExamResults(examId: string, req: any): Promise<{
        exam: any;
        hasManualGrading: boolean;
        manualTotal: any;
        manualGraded: any;
        manualPending: number;
        published: any;
        canPublish: boolean;
        submissions: any;
    }>;
    exportExamResults(examId: string, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getMySubmissions(req: any): Promise<any>;
    getMyExamSubmission(examId: string, req: any): Promise<any>;
    getMySubmissionById(id: string, req: any): Promise<any>;
    getStudentSubmissionForInstructor(examId: string, studentId: string, req: any): Promise<any>;
    getManualGradingSubmission(id: string, req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    gradeAnswer(gradeDto: GradeAnswerDto, req: any): Promise<any>;
    finalizeGrading(id: string, req: any): Promise<void>;
    updateStatus(id: string, updateDto: UpdateSubmissionStatusDto, req: any): Promise<any>;
}
