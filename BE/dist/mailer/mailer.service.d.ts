import { ConfigService } from '@nestjs/config';
export declare class MailerService {
    private configService;
    private transporter;
    private readonly logger;
    constructor(configService: ConfigService);
    sendExamLink(to: string | string[], subject: string, html: string, text?: string): Promise<any>;
}
