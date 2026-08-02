import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';

// Unauthenticated on purpose: only exposes which AI provider/model is active
// (no keys, no user data) so ops tooling (e.g. the Zalo bot) can display it.
@ApiTags('AI')
@Controller('ai-status')
export class AiStatusController {
  constructor(private readonly aiService: AiService) {}

  @Get()
  getStatus() {
    return this.aiService.getProviderStatus();
  }
}
