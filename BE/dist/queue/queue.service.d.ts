import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { DistributedEventsService } from '../events/distributed-events.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
export declare class QueueService {
    private integrityLogsQueue;
    private notificationsQueue;
    private gradingQueue;
    private eventsQueue;
    private aiGenerationQueue;
    private prisma;
    private events;
    private readonly redisService;
    private readonly logger;
    constructor(integrityLogsQueue: Queue, notificationsQueue: Queue, gradingQueue: Queue, eventsQueue: Queue, aiGenerationQueue: Queue, prisma: PrismaService, events: DistributedEventsService, redisService: RedisService);
    enqueueIntegrityLogs(data: any): Promise<void>;
    enqueueNotification(data: any): Promise<void>;
    enqueueGrading(data: any): Promise<void>;
    enqueueAiGeneration(data: any): Promise<void>;
    publishEvent(opts: {
        kind: string;
        payload: any;
        critical?: boolean;
        dedupId?: string;
        channel?: string;
        source?: string;
    }): Promise<void>;
    getQueueStats(queueName: string): Promise<any>;
    isQueueOverloaded(queueName: string, waitingThreshold: number): Promise<boolean>;
    private getQueue;
}
