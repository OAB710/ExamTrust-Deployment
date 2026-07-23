import { ExamsService } from './exams.service';
import { ExamQualityReviewService } from './exam-quality-review.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { MailerService } from '../mailer/mailer.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateExamDto, UpdateExamDto, AddQuestionsToExamDto, UpdateExamQuestionDto, ShareExamDto, RescheduleExamDto } from './dto/exam.dto';
import { ReviewQualitySuggestionDto } from './dto/exam-quality-review.dto';
export declare class ExamsController {
    private readonly examsService;
    private readonly qualityReviewService;
    private readonly mailerService;
    private readonly enrollmentsService;
    private readonly accessPolicy;
    constructor(examsService: ExamsService, qualityReviewService: ExamQualityReviewService, mailerService: MailerService, enrollmentsService: EnrollmentsService, accessPolicy: AccessPolicyService);
    shareExam(id: string, body: ShareExamDto | any, req: any): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    create(createExamDto: CreateExamDto, req: any): Promise<any>;
    findAll(req: any, courseId?: string, status?: string, page?: string, limit?: string): Promise<any>;
    getAvailableExams(req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    getStats(id: string, req: any): Promise<{
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
    requestQualityReview(id: string, req: any): Promise<{
        jobId: any;
        status: any;
    }>;
    getQualityReviewJob(id: string, jobId: string, req: any): Promise<any>;
    listQualityReviewSuggestions(id: string, status: string, req: any): Promise<any>;
    reviewQualitySuggestion(itemId: string, dto: ReviewQualitySuggestionDto, req: any): Promise<any>;
    update(id: string, updateExamDto: UpdateExamDto, req: any): Promise<any>;
    reschedule(id: string, rescheduleExamDto: RescheduleExamDto, req: any): Promise<any>;
    publish(id: string, req: any): Promise<any>;
    addQuestions(id: string, addQuestionsDto: AddQuestionsToExamDto, req: any): Promise<any[]>;
    updateExamQuestion(id: string, questionId: string, updateDto: UpdateExamQuestionDto, req: any): Promise<any>;
    removeQuestion(id: string, questionId: string, req: any): Promise<{
        message: string;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
