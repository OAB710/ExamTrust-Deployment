import { RedisService } from '@liaoliaots/nestjs-redis';
import { Observable } from 'rxjs';
export declare class DistributedEventsService {
    private readonly redisService;
    private readonly redis;
    private readonly redisSubscriber;
    private readonly redisPub;
    private eventSubjects;
    constructor(redisService: RedisService);
    emitEvent(channel: string, event: any): Promise<void>;
    subscribeToChannel(channel: string): Observable<any>;
    emitExamEvent(examId: string, event: any): Promise<void>;
    subscribeToExamEvents(examId: string): Observable<any>;
    broadcastToRole(role: string, event: any): Promise<void>;
    subscribeToRoleNotifications(role: string): Observable<any>;
    disconnect(): Promise<void>;
}
