import { LecturerDashboardService } from './lecturer-dashboard.service';
export declare class LecturerDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: LecturerDashboardService);
    getAttention(req: any): Promise<import("./dto/lecturer-attention-response.dto").LecturerAttentionResponseDto>;
}
