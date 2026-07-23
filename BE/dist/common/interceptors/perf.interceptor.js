"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const perf_log_1 = require("../utils/perf-log");
let PerfInterceptor = class PerfInterceptor {
    intercept(context, next) {
        if (!(0, perf_log_1.isPerfLogEnabled)()) {
            return next.handle();
        }
        const req = context.switchToHttp().getRequest();
        const method = req?.method || 'UNKNOWN';
        const url = req?.originalUrl || req?.url || '';
        const startedAt = (0, perf_log_1.nowMs)();
        return next.handle().pipe((0, operators_1.finalize)(() => {
            (0, perf_log_1.logPerf)(`${method} ${url} total=${(0, perf_log_1.elapsedMs)(startedAt)}ms`);
        }));
    }
};
exports.PerfInterceptor = PerfInterceptor;
exports.PerfInterceptor = PerfInterceptor = __decorate([
    (0, common_1.Injectable)()
], PerfInterceptor);
//# sourceMappingURL=perf.interceptor.js.map