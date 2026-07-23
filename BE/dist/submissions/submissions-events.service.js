"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsEventsService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let SubmissionsEventsService = class SubmissionsEventsService {
    constructor() {
        this.examStreams = new Map();
    }
    streamExam(examId) {
        if (!this.examStreams.has(examId)) {
            this.examStreams.set(examId, new rxjs_1.Subject());
        }
        return this.examStreams.get(examId).asObservable();
    }
    emitIntegrityEvent(examId, payload) {
        if (!this.examStreams.has(examId)) {
            this.examStreams.set(examId, new rxjs_1.Subject());
        }
        const stream = this.examStreams.get(examId);
        stream.next({
            type: 'integrity',
            data: payload,
        });
    }
};
exports.SubmissionsEventsService = SubmissionsEventsService;
exports.SubmissionsEventsService = SubmissionsEventsService = __decorate([
    (0, common_1.Injectable)()
], SubmissionsEventsService);
//# sourceMappingURL=submissions-events.service.js.map