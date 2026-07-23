import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private severityFor;
    listLogs(params: {
        page?: string | number;
        limit?: string | number;
        search?: string;
        kind?: string;
        severity?: string;
    }): Promise<{
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
