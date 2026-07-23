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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    severityFor(kind, payload) {
        const text = `${kind} ${JSON.stringify(payload || {})}`.toLowerCase();
        if (text.includes('failed') || text.includes('denied') || text.includes('critical'))
            return 'critical';
        if (text.includes('flag') || text.includes('warning') || text.includes('integrity'))
            return 'warning';
        return 'info';
    }
    async listLogs(params) {
        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Math.min(100, Number(params.limit || 20)));
        const search = String(params.search || '').trim().toLowerCase();
        const kind = String(params.kind || '').trim();
        const severity = String(params.severity || '').trim().toLowerCase();
        const where = {};
        if (kind && kind !== 'all') {
            where.kind = kind;
        }
        const [records, totalBeforeSeverity] = await Promise.all([
            this.prisma.eventStore.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Math.min(500, Math.max(limit * page, limit)),
                select: {
                    id: true,
                    kind: true,
                    payload: true,
                    critical: true,
                    status: true,
                    attempts: true,
                    lastError: true,
                    source: true,
                    createdAt: true,
                    processedAt: true,
                },
            }),
            this.prisma.eventStore.count({ where }),
        ]);
        const mapped = records
            .map((record) => {
            const payload = record.payload;
            const inferredSeverity = this.severityFor(record.kind, payload);
            const actor = payload?.user || payload?.actor || payload?.requestedBy || payload?.student || null;
            return {
                id: record.id,
                timestamp: record.createdAt,
                user: actor?.fullName || actor?.email || actor?.id || 'System',
                role: actor?.role || 'SYSTEM',
                action: record.kind,
                resource: payload?.resource || payload?.examId || payload?.submissionId || payload?.questionId || 'event_store',
                ip: payload?.ip || payload?.remoteIp || payload?.clientIp || null,
                severity: inferredSeverity,
                status: record.status,
                details: record.lastError || payload?.message || JSON.stringify(payload || {}),
                source: record.source,
                processedAt: record.processedAt,
                attempts: record.attempts,
                critical: record.critical,
            };
        })
            .filter((row) => {
            if (severity && severity !== 'all' && row.severity !== severity)
                return false;
            if (!search)
                return true;
            const text = `${row.user} ${row.action} ${row.resource} ${row.details}`.toLowerCase();
            return text.includes(search);
        });
        const total = search || severity ? mapped.length : totalBeforeSeverity;
        const pageRows = mapped.slice((page - 1) * limit, page * limit);
        const bySeverity = mapped.reduce((acc, row) => {
            acc[row.severity] += 1;
            return acc;
        }, { info: 0, warning: 0, critical: 0 });
        return {
            data: pageRows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: {
                total,
                ...bySeverity,
            },
            updatedAt: new Date().toISOString(),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map