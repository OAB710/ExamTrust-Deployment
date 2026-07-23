import { Job } from 'bull';
import { NotificationsService } from '../../notifications/notifications.service';
export declare class NotificationsProcessor {
    private readonly notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    processNotification(job: Job<any>): Promise<void>;
}
