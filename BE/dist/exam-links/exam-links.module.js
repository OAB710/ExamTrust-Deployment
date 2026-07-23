"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamLinksModule = void 0;
const common_1 = require("@nestjs/common");
const exam_links_service_1 = require("./exam-links.service");
const exam_links_controller_1 = require("./exam-links.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const access_policy_service_1 = require("../common/services/access-policy.service");
let ExamLinksModule = class ExamLinksModule {
};
exports.ExamLinksModule = ExamLinksModule;
exports.ExamLinksModule = ExamLinksModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [exam_links_controller_1.ExamLinksController],
        providers: [exam_links_service_1.ExamLinksService, access_policy_service_1.AccessPolicyService],
    })
], ExamLinksModule);
//# sourceMappingURL=exam-links.module.js.map