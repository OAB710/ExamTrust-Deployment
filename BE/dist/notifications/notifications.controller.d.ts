import { NotificationsService } from "./notifications.service";
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any, page?: string, limit?: string, unreadOnly?: string): Promise<import("../common/dto/pagination.dto").PaginatedResult<any>>;
    getUnreadCount(req: any): Promise<{
        count: any;
    }>;
    markAsRead(id: string, req: any): Promise<any>;
    markAllAsRead(req: any): Promise<{
        message: string;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
