import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { elapsedMs, isPerfLogEnabled, nowMs, logPerf } from '../utils/perf-log';

@Injectable()
export class PerfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!isPerfLogEnabled()) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const method = req?.method || 'UNKNOWN';
    const url = req?.originalUrl || req?.url || '';
    const startedAt = nowMs();

    return next.handle().pipe(
      finalize(() => {
        logPerf(`${method} ${url} total=${elapsedMs(startedAt)}ms`);
      }),
    );
  }
}
