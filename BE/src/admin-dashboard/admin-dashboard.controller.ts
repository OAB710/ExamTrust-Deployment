import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin dashboard')
@ApiBearerAuth('access-token')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}
  @Get('analytics')
  analytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.analytics(from, to);
  }

  @Get('devops-status')
  devopsStatus() {
    return this.service.devopsStatus();
  }
}
