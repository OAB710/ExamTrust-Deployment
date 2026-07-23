import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    listLogs(page?: string, limit?: string, search?: string, kind?: string, severity?: string): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
        };
        stats: any;
        updatedAt: string;
    }>;
}
