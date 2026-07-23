"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyMiddleware = void 0;
const common_1 = require("@nestjs/common");
let IdempotencyMiddleware = class IdempotencyMiddleware {
    constructor() {
        this.store = new Map();
    }
    use(req, res, next) {
        const idempotencyKey = req.headers['idempotency-key'];
        if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !idempotencyKey) {
            return next();
        }
        const stored = this.store.get(idempotencyKey);
        if (stored && stored.expiresAt > Date.now()) {
            return res.status(stored.value.statusCode).json(stored.value.body);
        }
        if (stored && stored.expiresAt <= Date.now()) {
            this.store.delete(idempotencyKey);
        }
        const originalSend = res.send.bind(res);
        const middleware = this;
        res.send = function (body) {
            const TTL = 5 * 60 * 1000;
            if (res.statusCode < 400) {
                const storedBody = typeof body === 'string' ? JSON.parse(body) : body;
                middleware.store.set(idempotencyKey, {
                    value: { statusCode: res.statusCode, body: storedBody },
                    expiresAt: Date.now() + TTL,
                });
            }
            return originalSend(body);
        };
        next();
    }
};
exports.IdempotencyMiddleware = IdempotencyMiddleware;
exports.IdempotencyMiddleware = IdempotencyMiddleware = __decorate([
    (0, common_1.Injectable)()
], IdempotencyMiddleware);
//# sourceMappingURL=idempotency.middleware.js.map