"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    isNotificationTableMissing(error) {
        const knownError = error;
        return (knownError?.code === "P2021" &&
            String(knownError?.meta?.table || "").toLowerCase().includes("notification"));
    }
    async create(input) {
        try {
            return await this.prisma.notification.create({
                data: {
                    recipientId: input.recipientId,
                    kind: input.kind,
                    title: input.title,
                    message: input.message,
                    link: input.link ?? null,
                    priority: input.priority ?? "normal",
                    metadata: input.metadata ?? undefined,
                },
            });
        }
        catch (error) {
            if (this.isNotificationTableMissing(error))
                return null;
            throw error;
        }
    }
    async createMany(inputs) {
        if (inputs.length === 0)
            return [];
        try {
            return await this.prisma.$transaction(inputs.map((input) => this.prisma.notification.create({
                data: {
                    recipientId: input.recipientId,
                    kind: input.kind,
                    title: input.title,
                    message: input.message,
                    link: input.link ?? null,
                    priority: input.priority ?? "normal",
                    metadata: input.metadata ?? undefined,
                },
            })));
        }
        catch (error) {
            if (this.isNotificationTableMissing(error))
                return [];
            throw error;
        }
    }
    async createForRole(role, input) {
        const recipients = await this.prisma.user.findMany({
            where: { role, status: { not: "deleted" } },
            select: { id: true },
        });
        return this.createMany(recipients.map((recipient) => ({
            ...input,
            recipientId: recipient.id,
        })));
    }
    async createForUsers(userIds, input) {
        if (userIds.length === 0)
            return [];
        const uniqueUserIds = Array.from(new Set(userIds));
        return this.createMany(uniqueUserIds.map((recipientId) => ({
            ...input,
            recipientId,
        })));
    }
    async findMyNotifications(userId, pagination, unreadOnly = false) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const where = {
            recipientId: userId,
            ...(unreadOnly ? { isRead: false } : {}),
        };
        let notifications = [];
        let total = 0;
        try {
            [notifications, total] = await Promise.all([
                this.prisma.notification.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                this.prisma.notification.count({ where }),
            ]);
        }
        catch (error) {
            console.error("Error in findMyNotifications:", error);
            if (!this.isNotificationTableMissing(error)) {
                throw error;
            }
        }
        return (0, pagination_dto_1.buildPaginatedResult)(notifications, total, page, limit);
    }
    async getUnreadCount(userId) {
        try {
            return await this.prisma.notification.count({
                where: {
                    recipientId: userId,
                    isRead: false,
                },
            });
        }
        catch (error) {
            console.error("Error in getUnreadCount:", error);
            throw error;
        }
    }
    async markAsRead(id, userId) {
        let notification = null;
        try {
            notification = await this.prisma.notification.findUnique({
                where: { id },
            });
        }
        catch (error) {
            if (this.isNotificationTableMissing(error)) {
                return { message: "Notification not available" };
            }
            throw error;
        }
        if (!notification) {
            throw new common_1.NotFoundException("Notification not found");
        }
        if (notification.recipientId !== userId) {
            throw new common_1.ForbiddenException("Not authorized");
        }
        return this.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: notification.readAt ?? new Date(),
            },
        });
    }
    async markAllAsRead(userId) {
        try {
            await this.prisma.notification.updateMany({
                where: {
                    recipientId: userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }
        catch (error) {
            if (!this.isNotificationTableMissing(error)) {
                throw error;
            }
        }
        return { message: "All notifications marked as read" };
    }
    async remove(id, userId) {
        let notification = null;
        try {
            notification = await this.prisma.notification.findUnique({
                where: { id },
            });
        }
        catch (error) {
            if (this.isNotificationTableMissing(error)) {
                return { message: "Notification not available" };
            }
            throw error;
        }
        if (!notification) {
            throw new common_1.NotFoundException("Notification not found");
        }
        if (notification.recipientId !== userId) {
            throw new common_1.ForbiddenException("Not authorized");
        }
        try {
            await this.prisma.notification.delete({ where: { id } });
        }
        catch (error) {
            if (!this.isNotificationTableMissing(error)) {
                throw error;
            }
        }
        return { message: "Notification deleted successfully" };
    }
    async notify(input) {
        await this.create(input);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map