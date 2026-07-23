import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class SubmissionsEventsService {
    private readonly examStreams;
    streamExam(examId: string): Observable<MessageEvent>;
    emitIntegrityEvent(examId: string, payload: {
        id: string;
        submissionId: string;
        eventType: string;
        details?: string;
        timestamp: string;
        severity: 'low' | 'medium' | 'high';
        student: {
            id?: string;
            fullName?: string;
            studentId?: string;
        };
    }): void;
}
