"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsContractsModule = void 0;
const common_1 = require("@nestjs/common");
const question_drafts_controller_1 = require("./question-drafts.controller");
const ai_generation_jobs_controller_1 = require("./ai-generation-jobs.controller");
const questions_v2_service_1 = require("./questions-v2.service");
const ai_module_1 = require("../ai/ai.module");
const question_metadata_controller_1 = require("./question-metadata.controller");
let QuestionsContractsModule = class QuestionsContractsModule {
};
exports.QuestionsContractsModule = QuestionsContractsModule;
exports.QuestionsContractsModule = QuestionsContractsModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_module_1.AiModule],
        controllers: [question_drafts_controller_1.QuestionDraftsController, ai_generation_jobs_controller_1.AIGenerationJobsController, question_metadata_controller_1.QuestionMetadataController],
        providers: [questions_v2_service_1.QuestionsService],
    })
], QuestionsContractsModule);
//# sourceMappingURL=questions-v2-contracts.module.js.map