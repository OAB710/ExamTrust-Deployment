import { Controller, Get } from '@nestjs/common';

// Deliberately public (no guard) and DB-free — used by the exam-taking
// client to verify real connectivity after a network drop, not just trust
// the browser's often-unreliable navigator.onLine flag.
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { ok: true };
  }
}
