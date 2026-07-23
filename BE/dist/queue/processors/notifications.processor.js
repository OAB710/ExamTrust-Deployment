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
var NotificationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const notifications_service_1 = require("../../notifications/notifications.service");
const common_1 = require("@nestjs/common");
let NotificationsProcessor = NotificationsProcessor_1 = class NotificationsProcessor {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationsProcessor_1.name);
    }
    async processNotification(job) {
        const { type, recipientId, data } = job.data;
        try {
            switch (type) {
                case 'submission_received':
                    await this.notificationsService.create({
                        recipientId,
                        kind: 'SUBMISSION_RECEIVED',
                        title: data.title,
                        message: data.message,
                        link: data.link,
                        priority: data.priority || 'normal',
                        metadata: data.metadata,
                    });
                    break;
                case 'integrity_risk':
                    await this.notificationsService.create({
                        recipientId,
                        kind: 'INTEGRITY_RISK_DETECTED',
                        title: data.title,
                        message: data.message,
                        link: data.link,
                        priority: data.priority || 'high',
                        metadata: data.metadata,
                    });
                    break;
                case 'role_broadcast':
                    await this.notificationsService.createForRole(recipientId, {
                        kind: data.kind,
                        title: data.title,
                        message: data.message,
                        link: data.link,
                        priority: data.priority || 'normal',
                        metadata: data.metadata,
                    });
                    break;
                default:
                    this.logger.warn(`Unknown notification type: ${type}`);
            }
            this.logger.log(`Processed notification for recipient: ${recipientId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process notification: ${error?.message || String(error)}`, error?.stack);
            throw error;
        }
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsProcessor.prototype, "processNotification", null);
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map