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
var MailerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const fs = require("fs");
let MailerService = MailerService_1 = class MailerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MailerService_1.name);
        const host = this.configService.get('SMTP_HOST', 'smtp.gmail.com');
        const port = Number(this.configService.get('SMTP_PORT', 587));
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        const allowSelfSigned = this.configService.get('MAILER_ALLOW_SELF_SIGNED', 'false') === 'true' && process.env.NODE_ENV !== 'production';
        const transportOptions = {
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
            requireTLS: true,
            tls: allowSelfSigned ? { rejectUnauthorized: false } : { rejectUnauthorized: true },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            greetingTimeout: 10000,
            connectionTimeout: 10000,
        };
        const caPath = this.configService.get('SMTP_CA_PATH');
        if (caPath) {
            try {
                const ca = fs.readFileSync(caPath, 'utf8');
                transportOptions.tls = { ...(transportOptions.tls || {}), ca: [ca] };
                this.logger.log(`Loaded SMTP CA certificate from ${caPath}`);
            }
            catch (err) {
                this.logger.warn(`Failed to read SMTP_CA_PATH (${caPath})`, err);
            }
        }
        this.transporter = nodemailer.createTransport(transportOptions);
        this.transporter
            .verify()
            .then(() => this.logger.log('Mailer transport verified'))
            .catch((err) => this.logger.warn('Mailer transport verification failed', err));
    }
    async sendExamLink(to, subject, html, text) {
        const from = this.configService.get('EMAIL_FROM') || this.configService.get('SMTP_USER') || 'no-reply@example.com';
        const recipients = Array.isArray(to) ? to.join(',') : to;
        try {
            const info = await this.transporter.sendMail({
                from,
                to: recipients,
                subject,
                html,
                text,
            });
            this.logger.log(`Email sent: ${info.messageId} to ${recipients}`);
            return info;
        }
        catch (err) {
            this.logger.error('Failed to send email', err);
            throw err;
        }
    }
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = MailerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailerService);
//# sourceMappingURL=mailer.service.js.map