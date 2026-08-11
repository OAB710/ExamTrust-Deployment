import { Body, Controller, ForbiddenException, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MediaService } from './media.service';
import { ConfirmMediaUploadDto, CreatePresignedUploadDto, ReleaseMediaUploadDto } from './dto/media.dto';

@ApiTags('Media')
@ApiBearerAuth('access-token')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LECTURER', 'ADMIN')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  createPresignedUpload(@Body() dto: CreatePresignedUploadDto, @Request() req) {
    return this.mediaService.createPresignedUpload(dto, req.user);
  }

  @Post('confirm')
  confirmUpload(@Body() dto: ConfirmMediaUploadDto) {
    return this.mediaService.confirmUpload(dto);
  }

  @Post('release')
  async releaseUpload(@Body() dto: ReleaseMediaUploadDto, @Request() req) {
    // Object keys are namespaced as `questions/<uploaderId>/...` (see
    // MediaService.createPresignedUpload) — enforce that here so a lecturer
    // can only self-service-delete their own uploads, not guess another
    // user's key to grief the shared storage-usage counter.
    if (req.user.role !== 'ADMIN' && !dto.key.startsWith(`questions/${req.user.id}/`)) {
      throw new ForbiddenException('Bạn không có quyền xoá tệp này');
    }
    await this.mediaService.releaseObject(dto.key, dto.sizeBytes);
    return { released: true };
  }

  @Get('usage')
  @Roles('ADMIN')
  listUsageByUser() {
    return this.mediaService.listUsageByUser();
  }
}
