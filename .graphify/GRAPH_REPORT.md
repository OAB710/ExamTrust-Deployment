# Graph Report - .  (2026-08-22)

## Corpus Check
- Large corpus: 588 files · ~558,884 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2972 nodes · 8248 edges · 158 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1959 · imports: 1708 · contains: 1592 · imports_from: 1038 · method: 695 · calls: 671 · ON_BRANCH: 256 · PARENT_OF: 219 · references: 87 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 588 · Candidates: 650
- Excluded: 0 untracked · 105169 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `d5b9253`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 154 edges
2. `SubmissionsService` - 87 edges
3. `Button` - 71 edges
4. `cn()` - 65 edges
5. `Card` - 54 edges
6. `CardContent` - 54 edges
7. `QuestionsService` - 53 edges
8. `DashboardLayout()` - 48 edges
9. `CardHeader` - 48 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `007a277 Update ZaloBotFeature` --PARENT_OF--> `e97f65f Merge pull request #7 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 2 → community 21_
- `01349dc Merge pull request #18 from OAB710/main` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 1 → community 2_
- `01349dc Merge pull request #18 from OAB710/main` --PARENT_OF--> `8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng`  [EXTRACTED]
  git → git  _Bridges community 1 → community 16_
- `02b1de4 Pagination` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 126 → community 2_
- `02b1de4 Pagination` --PARENT_OF--> `4e55692 Merge pull request #23 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 126 → community 27_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (54): 01349dc Merge pull request #18 from OAB710/main, 2144bf4 Fix exam-media rendering, monitor accuracy bugs, and add key-error detection, 222b35a add, 26f1640 Fix lỗi mất mạng, 2dc9b52 add, 346165c Add DeepSeek and fix exam question workflows, 4e7be2f Fix exam-taking infinite loop and start-flow redirect bug; add AI/media improvements, 8fb8d15 trang anaylytics (+46 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (62): duc, main, 007a277 Update ZaloBotFeature, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0af6e6d BIG SEED DATA, 0c12096 Update page.tsx, 14c973c Add Cloudflare Workers deployment config for FE via OpenNext (+54 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (28): iso(), rangeFor(), Exam, Submission, User, AdminPageShellProps, copy, AuditLog (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (46): buildContextLines(), buildExamTrustPromptHeader(), ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, ExamTrustAiUseCase, formatNumber(), getOllamaGenerationOptions() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (53): DurationInput(), HOURS_12, MINUTES, parse24(), Period, TimePickerVi(), to12(), useQuestionTopics() (+45 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (10): 2d105be Convert FE from embedded repository to regular folder, prisma, { PrismaClient }, capabilityGroups, operatingPrinciples, mocks, Header(), courses (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (47): AdminStatCard(), AdminStatCardProps, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, buildToken(), CourseForm, CourseItem, defaultForm (+39 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (18): AuditModule, AuthModule, CacheModule, 0391dc3 mang project tu repo cu qua, CourseTerm, QualityReviewDecision, ReviewQualitySuggestionDto, LecturerAttentionItemDto (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (1): QuestionsService

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (25): exam_submissions, integrity_reviews, AdminDashboardController, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, SystemOverviewController, 328ec36 add (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (32): AdminPageShell(), EMPTY_FILTERS, EMPTY_PATTERNS, EMPTY_STATS, IntegrityCasesResponse, IntegrityPatterns, IntegrityStats, EMPTY_HISTORY_FILTERS (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (44): 27cae6b topic row, 3491b87 Them loc theo chu de trong ngan hang cau hoi va sua lich thi trung gio, 4b5580c Sửa điểm -> trọng số, 84885c0 Merge pull request #24 from OAB710/main, e1e0bfb Merge remote-tracking branch 'upstream/main', QuestionPreviewInfoCard(), QuestionPreviewSection(), QuestionBankCourse (+36 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (37): 525b2f6 Fix UI, fd78aa1 Doi thang diem 10, sua ma tran dap an, dong bo naming giam sat, doi AI provider truc tiep, BulkStudentImport(), BulkStudentImportProps, COLUMN_ALIASES, ImportResult, ImportState, ParsedRow (+29 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (26): 23cc713 Merge remote-tracking branch 'upstream/main', b27133b add, f2db362 Refactor VI + RCM Topic + AI Summarize, AuthUser, CreateCourseDto, CreateUserDto, BulkEnrollByEmailsDto, BulkEnrollmentDto (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (38): 0eb4886 Merge pull request #19 from OAB710/main, 3ced0c0 Fix FE/BE deploy build failures, 61bede6 Merge remote-tracking branch 'upstream/main', 71d6c3d Sync integrity event labels, fix exam-security and evidence-review UX bugs, 79e4973 Fix UI, 8b11e41 Fix webcam/screen proctoring evidence capture and exam-security UX, 9a409bb Stop tracking CodeGraph daemon PID and Claude Code worktrees, bf272a8 Update admin-dashboard.service.ts (+30 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (31): 8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng, AiImprovementDetail, AiImprovementStatus, AiImprovementSummary, AnalyticsCourseInfo, AttemptBreakdownItem, AttemptScope, AttemptStats (+23 more)

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (24): MetricCardProps, NavLink, NavLinkBaseProps, NavLinkCompatProps, cn(), AccordionContent, AccordionItem, AccordionTrigger (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (23): AuthPageShell(), d78391f Redesign login page, add student registration, sync brand mark, BackToDashboardButton(), BackToDashboardButtonProps, ButtonSize, ButtonVariant, demoAccounts, getSessionDevice() (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (25): da20a4e add, Course, EMPTY_FILTERS, gradientClasses, GroupedCourses, getFilterChips(), ListPageHeader(), ListPageHeaderProps (+17 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (24): 093b6ef Merge pull request #6 from OAB710/main, 2701bbc add, 36549ac AI GEN QUES, 3ce42b8 add, 9d34aad Merge branch 'main' into duc, ad2ef1d Add accounts-only seed script for resetting production data, c7c474f Merge remote-tracking branch 'upstream/main', e3af065 add (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (28): canonicalize(), canonicalStringify(), hashObject(), isPlainObject(), chooseStrategy(), generateExam(), hashJson(), hashStringToNumber() (+20 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (27): Unit, UNIT_LABELS, UNIT_SECONDS, ExamItem, ExamLinkItem, LINK_STATE_LABELS, LinkUsage, GeneratedQuestion (+19 more)

### Community 24 - "Community 24"
Cohesion: 0.05
Nodes (33): useIsMobile(), SheetContent, SheetContentProps, SheetDescription, SheetOverlay, SheetTitle, sheetVariants, Sidebar (+25 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (28): media_storage_usage, media_user_storage_usage, 6842351 BE Chat BOT, 766481b File 2 test, 8a02983 Migrate + FE, ba28c68 Merge pull request #17 from OAB710/main, cd3a2bb Fix: switching image/audio tab was deleting the just-uploaded attachment, ed263b5 Add question media attachments via Cloudflare R2 presigned uploads (+20 more)

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (29): metadata, Providers(), AuthProvider(), Action, ActionType, actionTypes, addToRemoveQueue(), dispatch() (+21 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (26): 4a024b2 Release v1.2.2: Sua bug doi AI provider khong dong bo sang ai-worker, 4e55692 Merge pull request #23 from OAB710/main, e7566a7 Dung lai toan bo seed data va sua 2 bug cham diem/ma tran dap an, COURSE_PLANS, CoursePlan, main(), prisma, main() (+18 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (22): answerTitles, FillBlankGuide(), OptionRowProps, Props, QuestionAnswerEditor(), GeneratedQuestion, Params, typeMap (+14 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (30): buildBeInfoText(), buildFeInfoText(), buildPublicInfoText(), buildR2InfoText(), buildSystemOverviewConclusions(), buildSystemOverviewText(), cfGraphQL(), formatBuildStatus() (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (2): AiService, OnModuleInit

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (3): OnModuleDestroy, OnModuleInit, SubmissionsService

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (9): 24e5343 add, b9a4c06 add, CoursesController, CoursesModule, EnrollmentsModule, ExamLinksModule, QueueModule, SubmissionsModule (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (19): 1098f63 add, 50768bd Merge pull request #11 from trungducnguyen4/duc, 958340a Update .gitignore, 95cd9ce add, d1945d7 add, RefreshedSession, RequestOptions, formatAnswerCell() (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (23): 1ff59cf add, 3acaef9 fix nhẹ, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, APICourse, buildToken(), Course, CourseExamPreview (+15 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (16): 9765fa3 Sua lenh bot Zalo, them nut lam moi + fix cuon trang khi doi trang, DataPagination(), DataPaginationProps, AnswerMatrix, EvidenceCapture, ExamOverview, ExamResultsList(), groupAnomaliesByStudent() (+8 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (21): themes, ThemeToggle(), AuthContext, AuthContextType, AuthState, useAuth(), adminNavItems, DashboardLayoutProps (+13 more)

### Community 38 - "Community 38"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (16): question_bank_preferences, users, 13dcbd7 add, 1afe093 add, c32c8d2 AI + UI + FIX, d5b9253 Merge pull request #26 from OAB710/main, CopyQuestionBankDto, CreateQuestionCrudDto (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.09
Nodes (17): 0aae96f add, AGGREGATE_ALERT_TYPES, EMPTY_STUDENT_FILTERS, EVIDENCE_SIGNAL_LABELS, EvidenceCapture, ExamMonitor(), ExamOverview, FastCompletion (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), COMPLETED_STATUSES, CourseExamAction, CourseExamForAction, CourseExamSubmission, ExamDisplayState, getCourseExamAction() (+12 more)

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (22): AUTO_GRADED_TYPES, buildQuestionTemplate(), buildSnapshotPayload(), buildSubmittedAnswer(), buildToken(), createExamSnapshot(), generateCourseCode(), isAutoGradable() (+14 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, NestInterceptor, PerfInterceptor, OnModuleDestroy, OnModuleInit, { PrismaClient }, PrismaService (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (12): 28c06f5 Merge pull request #1 from trungducnguyen4/main, f5fcba9 Merge pull request #5 from OAB710/main, f609787 feat(student): add exam schedule endpoint and student schedule page, CalendarView, ExamDetailsDialog(), FlexibleExamCard(), getEventTone(), getStatusLabel() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.11
Nodes (19): 3221af2 Merge pull request #2 from OAB710/main, 563dc34 Merge pull request #3 from trungducnguyen4/duc, f4c84b8 add, AddLogsDto, AutosaveAnswerDto, AutosaveExamDto, CreateScoreAdjustmentDto, ExtendSubmissionDeadlineDto (+11 more)

### Community 47 - "Community 47"
Cohesion: 0.16
Nodes (17): EXAM_PLANS, ExamPlan, main(), prisma, toExamStatus(), addMinutes(), makeRng(), seedFromString() (+9 more)

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (18): accessBadgeClass(), ExamDetail, MySubmission, statusBadgeClass(), StudentExamDetail(), formatBadgeText(), getStatusBadgeLabel(), getStatusBadgeTone() (+10 more)

### Community 49 - "Community 49"
Cohesion: 0.19
Nodes (1): AuthService

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (1): AuthController

### Community 51 - "Community 51"
Cohesion: 0.19
Nodes (11): e0e0f5b Fix Bug, fd68a4b Merge pull request #16 from OAB710/main, CourseOption, Exam, GRADING_STRATEGY_LABELS, formatDateTimeVi(), getScheduleLabel(), THEME_OPTIONS (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy, DefaultFlexible, ShuffleStrategy, StrictNoShuffle

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (3): buildEvidenceStorageKey(), OnModuleInit, ProctoringEvidenceService

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (14): ai_generation_records, course_topics, courses, exam_questions, question_course_scopes, question_drafts, question_tags, question_topics (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.16
Nodes (11): 03ff58a Xóa mail serivce, 268c1a2 Thời gian làm quá nhanh,Mẫu trả lời giống nhau bất thường, 3959b1e bản nháp, a9268e0 Merge remote-tracking branch 'upstream/main', AddQuestionsToExamDto, CreateExamDto, RescheduleExamDto, ShareExamDto (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 60 - "Community 60"
Cohesion: 0.16
Nodes (9): answerPatterns, examResult, feedbackHistory, recommendations, sectionScores, GradedQuestion, gradedQuestions, gradingHistory (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeader(), PageHeaderProps, EmptyStateProps, PageAction, ResponsiveColumn, StatusTone, ThemeMode (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (12): AIGenerateSectionDto, AIGenerationConstraintsDto, AISection, ApplyAICandidateDto, CreateQuestionDraftDto, DraftPublishMode, DraftValidationLevel, PublishQuestionDraftDto (+4 more)

### Community 64 - "Community 64"
Cohesion: 0.27
Nodes (11): formatAttemptLimitVi(), formatDateVi(), formatNumberVi(), formatPercentVi(), formatScoreVi(), getAttemptStatusLabel(), getExamStatusLabel(), getExamWindowLabel() (+3 more)

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (7): BATCH_SIZE, fetchBatch(), LegacyQuestion, main(), prisma, { PrismaClient }, processQuestion()

### Community 67 - "Community 67"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 68 - "Community 68"
Cohesion: 0.17
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 69 - "Community 69"
Cohesion: 0.45
Nodes (10): courses, enrollments, exam_questions, exam_submissions, exams, integrity_logs, proctoring_sessions, questions (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (1): CacheService

### Community 71 - "Community 71"
Cohesion: 0.49
Nodes (9): asObject(), findErrorText(), formatManualAnswer(), matchingSides(), parseValue(), stringList(), StructuredValue, text() (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.18
Nodes (2): AiSuggestion, DraftGrade

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (2): extractUploaderIdFromKey(), MediaService

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 76 - "Community 76"
Cohesion: 0.36
Nodes (9): anomaly_flags, exam_instances, exam_questions, exam_submissions, exams, focus_events, interaction_logs, question_versions (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.20
Nodes (3): AuditService, 0e4348a add, 1ea6b35 add

### Community 78 - "Community 78"
Cohesion: 0.24
Nodes (5): AiModule, AiStatusController, safeEqual(), 55714bf Add AI provider switch command and status endpoint for Zalo bot, c444bc6 Merge pull request #15 from OAB710/main

### Community 79 - "Community 79"
Cohesion: 0.24
Nodes (7): AttentionItemData, AttentionPriority, LecturerAttentionResponse, LecturerAttentionSummary, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 80 - "Community 80"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, getQueueStorageKey(), loadQueue(), persistQueue(), safeParseQueue(), useExamAutosave(), UseExamAutosaveOptions

### Community 81 - "Community 81"
Cohesion: 0.36
Nodes (9): course_topics, courses, exist, question_tags, question_topics, questions, tags, topics (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (1): QueueService

### Community 83 - "Community 83"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 85 - "Community 85"
Cohesion: 0.20
Nodes (4): ButtonProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 86 - "Community 86"
Cohesion: 0.20
Nodes (8): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubContent, ContextMenuSubTrigger

### Community 87 - "Community 87"
Cohesion: 0.20
Nodes (1): UsersController

### Community 88 - "Community 88"
Cohesion: 0.22
Nodes (1): UsersService

### Community 89 - "Community 89"
Cohesion: 0.39
Nodes (8): ai_generation_records, exam_submission_regrade_logs, exam_submissions, question_statistics, question_versions, questions, submission_answers, users

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AiJobsService, AISectionValue, AiTaskType, CreateAiJobParams

### Community 91 - "Community 91"
Cohesion: 0.28
Nodes (8): ContextHelp(), ContextHelpProps, HelpBody(), HelpButton, HelpContent, isHelpContent(), useTouchHelpMode(), TooltipContent

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 93 - "Community 93"
Cohesion: 0.47
Nodes (8): loginRequest(), main(), percentile(), runConcurrent(), runSequential(), safeJson(), summarize(), timedRequest()

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (5): CLIENT_RENDERING_RULES, OrderingLayer, ReferenceBinding, RenderingContract, StructuralLayer

### Community 96 - "Community 96"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 97 - "Community 97"
Cohesion: 0.43
Nodes (7): clearPendingProctoringStreams(), hasPendingScreenStream(), isLive(), setPendingScreenStream(), setPendingWebcamStream(), takePendingScreenStream(), takePendingWebcamStream()

### Community 98 - "Community 98"
Cohesion: 0.25
Nodes (6): exceptions, ignoredDirectories, include, limit, oversized, root

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (5): Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 101 - "Community 101"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 102 - "Community 102"
Cohesion: 0.67
Nodes (6): course_topics, courses, question_course_scopes, question_topics, questions, topics

### Community 103 - "Community 103"
Cohesion: 0.48
Nodes (6): exam_question_snapshots, exam_snapshots, exams, question_snapshots, question_versions, questions

### Community 104 - "Community 104"
Cohesion: 0.38
Nodes (1): AdminDashboardService

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 106 - "Community 106"
Cohesion: 0.38
Nodes (7): buildComparisonSnapshot(), getCourseLabel(), hasFieldChanged(), normalizeCorrectAnswerIds(), normalizeEditableOptions(), normalizeStringList(), safeJsonValue()

### Community 107 - "Community 107"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 108 - "Community 108"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (4): AuthState, DisplayRole, User, UserRole

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (4): CommandDialogProps, CommandInput, CommandSeparator, DialogProps

### Community 111 - "Community 111"
Cohesion: 0.33
Nodes (5): anomaly_flags, exam_instances, focus_events, interaction_logs, tab_switch_events

### Community 112 - "Community 112"
Cohesion: 0.53
Nodes (1): AiController

### Community 113 - "Community 113"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 115 - "Community 115"
Cohesion: 0.47
Nodes (5): elapsedMs(), enabledValues, isPerfLogEnabled(), logPerf(), nowMs()

### Community 116 - "Community 116"
Cohesion: 0.33
Nodes (1): MediaController

### Community 117 - "Community 117"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 118 - "Community 118"
Cohesion: 0.73
Nodes (5): pickId(), pollAiJob(), request(), requireOk(), run()

### Community 121 - "Community 121"
Cohesion: 0.33
Nodes (5): Exam, ExamHistoryItem, ExamResult, ExamStatus, UpcomingExam

### Community 122 - "Community 122"
Cohesion: 0.60
Nodes (5): ipToLong(), isIpInAnyCidr(), isIpInCidr(), isValidIpOrCidr(), normalizeIp()

### Community 123 - "Community 123"
Cohesion: 0.70
Nodes (4): ai_generation_records, question_drafts, question_versions, questions

### Community 124 - "Community 124"
Cohesion: 0.70
Nodes (4): ai_generation_records, exam_quality_review_items, questions, users

### Community 125 - "Community 125"
Cohesion: 0.70
Nodes (4): exam_instances, exam_submissions, proctoring_evidence_captures, users

### Community 126 - "Community 126"
Cohesion: 0.40
Nodes (3): 02b1de4 Pagination, dd35c5a Sua bug diem sai lech va bo sung xu ly mat mang khi lam bai, HealthController

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (4): 7b4322c add, f604860 add, bootstrap(), parseCsvList()

### Community 128 - "Community 128"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (2): CanActivate, RateLimitGuard

### Community 130 - "Community 130"
Cohesion: 0.40
Nodes (2): CanActivate, RolesGuard

### Community 132 - "Community 132"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 133 - "Community 133"
Cohesion: 0.40
Nodes (3): IdempotencyMiddleware, IdempotencyStore, NestMiddleware

### Community 134 - "Community 134"
Cohesion: 0.60
Nodes (4): hasColumn(), hasIndex(), main(), prisma

### Community 135 - "Community 135"
Cohesion: 0.60
Nodes (4): deleteAllUnderPrefix(), main(), parseArgs(), PREFIXES_BY_TARGET

### Community 136 - "Community 136"
Cohesion: 0.83
Nodes (3): exam_link_usages, exam_links, exams

### Community 137 - "Community 137"
Cohesion: 1.00
Nodes (3): integrity_review_audits, integrity_reviews, users

### Community 138 - "Community 138"
Cohesion: 0.83
Nodes (3): exam_submissions, score_adjustments, users

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): AuditController

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (2): PaginatedResult, PaginationDto

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (3): CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto

### Community 143 - "Community 143"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 144 - "Community 144"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 147 - "Community 147"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 148 - "Community 148"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 149 - "Community 149"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 150 - "Community 150"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 152 - "Community 152"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 153 - "Community 153"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 154 - "Community 154"
Cohesion: 1.00
Nodes (2): courses, topics

### Community 155 - "Community 155"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 156 - "Community 156"
Cohesion: 1.33
Nodes (2): auth_sessions, users

### Community 157 - "Community 157"
Cohesion: 1.00
Nodes (2): ai_generation_records, anomaly_flags

### Community 158 - "Community 158"
Cohesion: 0.67
Nodes (1): prisma

### Community 159 - "Community 159"
Cohesion: 0.67
Nodes (1): prisma

### Community 160 - "Community 160"
Cohesion: 0.67
Nodes (1): prisma

### Community 161 - "Community 161"
Cohesion: 0.67
Nodes (1): prisma

### Community 162 - "Community 162"
Cohesion: 0.67
Nodes (1): prisma

### Community 163 - "Community 163"
Cohesion: 0.67
Nodes (1): prisma

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (1): prisma

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (1): prisma

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (1): prisma

### Community 168 - "Community 168"
Cohesion: 0.67
Nodes (1): prisma

## Knowledge Gaps
- **660 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+655 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `AiSuggestion`, `DraftGrade`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `extractUploaderIdFromKey()`, `MediaService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (2 nodes): `CanActivate`, `RateLimitGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (2 nodes): `CanActivate`, `RolesGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (2 nodes): `PaginatedResult`, `PaginationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (2 nodes): `courses`, `topics`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `auth_sessions`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (2 nodes): `ai_generation_records`, `anomaly_flags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 161`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 33`, `Community 131`, `Community 114`, `Community 145`, `Community 146`, `Community 170`, `Community 132`, `Community 171`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 31` to `Community 15`, `Community 169`, `Community 119`, `Community 94`, `Community 66`, `Community 74`, `Community 84`, `Community 120`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 9` to `Community 21`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _660 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.030388779527559057 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.052947052947052944 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06583850931677018 - nodes in this community are weakly interconnected._