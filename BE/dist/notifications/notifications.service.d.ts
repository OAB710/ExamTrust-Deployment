import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto } from "../common/dto/pagination.dto";
type NotificationPriority = "low" | "normal" | "high";
export interface CreateNotificationInput {
    recipientId: string;
    kind: string;
    title: string;
    message: string;
    link?: string | null;
    priority?: NotificationPriority;
    metadata?: Record<string, any> | null;
}
export declare class NotificationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private isNotificationTableMissing;
    create(input: CreateNotificationInput): Promise<any>;
    createMany(inputs: CreateNotificationInput[]): Promise<any>;
    createForRole(role: "ADMIN" | "LECTURER" | "STUDENT", input: Omit<CreateNotificationInput, "recipientId">): Promise<any>;
    createForUsers(userIds: string[], input: Omit<CreateNotificationInput, "recipientId">): Promise<any>;
    findMyNotifications(userId: string, pagination?: PaginationDto, unreadOnly?: boolean): Promise<import("../common/dto/pagination.dto").PaginatedResult<any>>;
    getUnreadCount(userId: string): Promise<any>;
    markAsRead(id: string, userId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
    notify(input: CreateNotificationInput): Promise<void>;
}
export {};
