import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';

// Unauthenticated on purpose, same rationale as AiStatusController: only
// exposes aggregate counts (no PII, no per-user/per-exam detail) so ops
// tooling (the Zalo bot) can display a system overview without a JWT.
@ApiTags('Admin dashboard')
@Controller('system-overview')
export class SystemOverviewController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  getOverview() {
    return this.service.systemOverview();
  }
}
