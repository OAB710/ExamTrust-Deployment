import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LecturerDashboardService } from './lecturer-dashboard.service';

@ApiTags('Lecturer Dashboard')
@ApiBearerAuth('access-token')
@Controller('lecturer/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LECTURER')
export class LecturerDashboardController {
  constructor(private readonly dashboardService: LecturerDashboardService) {}

  @Get('attention')
  getAttention(@Request() req) {
    return this.dashboardService.getAttention(req.user.id);
  }
}
