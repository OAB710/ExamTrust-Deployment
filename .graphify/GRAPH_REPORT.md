# Graph Report - .  (2026-08-23)

## Corpus Check
- Large corpus: 594 files · ~573,361 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 3033 nodes · 8403 edges · 157 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 2023 · imports: 1722 · contains: 1640 · imports_from: 1047 · method: 695 · calls: 675 · ON_BRANCH: 263 · PARENT_OF: 228 · references: 87 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 594 · Candidates: 658
- Excluded: 0 untracked · 105332 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `649b41d`
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
- `01349dc Merge pull request #18 from OAB710/main` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 7 → community 1_
- `01349dc Merge pull request #18 from OAB710/main` --PARENT_OF--> `8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng`  [EXTRACTED]
  git → git  _Bridges community 7 → community 42_
- `02b1de4 Pagination` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 12 → community 1_
- `02b1de4 Pagination` --PARENT_OF--> `4e55692 Merge pull request #23 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 12 → community 14_
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 9 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (100): AI_SECTIONS, AiJobsService, AISectionValue, AiTaskType, CreateAiJobParams, duc, main, 007a277 Update ZaloBotFeature (+92 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (46): da20a4e add, Course, EMPTY_FILTERS, gradientClasses, GroupedCourses, unwrapPaginatedData(), CourseTerm, DateRangeValue (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (11): 2d105be Convert FE from embedded repository to regular folder, prisma, { PrismaClient }, roleToPath, capabilityGroups, operatingPrinciples, mocks, Header() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (31): iso(), rangeFor(), Exam, Submission, User, AdminPageShellProps, copy, AuditLog (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (52): AdminPageShell(), EMPTY_FILTERS, EMPTY_PATTERNS, EMPTY_STATS, IntegrityCasesResponse, IntegrityPatterns, IntegrityStats, 1ff59cf add (+44 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (48): buildContextLines(), buildExamTrustPromptHeader(), ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, ExamTrustAiUseCase, formatNumber(), getOllamaGenerationOptions() (+40 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): 01349dc Merge pull request #18 from OAB710/main, 093b6ef Merge pull request #6 from OAB710/main, 2144bf4 Fix exam-media rendering, monitor accuracy bugs, and add key-error detection, 26f1640 Fix lỗi mất mạng, 2dc9b52 add, 36549ac AI GEN QUES, 4e7be2f Fix exam-taking infinite loop and start-flow redirect bug; add AI/media improvements, 8fb8d15 trang anaylytics (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (54): DurationInput(), HOURS_12, MINUTES, parse24(), Period, TimePickerVi(), to12(), useQuestionTopics() (+46 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (19): AuditModule, AuthModule, CacheModule, 0391dc3 mang project tu repo cu qua, CourseTerm, QualityReviewDecision, ReviewQualitySuggestionDto, LecturerAttentionItemDto (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (47): AdminStatCard(), AdminStatCardProps, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, buildToken(), CourseForm, CourseItem, defaultForm (+39 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (41): metadata, Providers(), AuthContext, AuthContextType, AuthProvider(), AuthState, Action, ActionType (+33 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (35): 02b1de4 Pagination, 0aae96f add, 72d5704 add, 9765fa3 Sua lenh bot Zalo, them nut lam moi + fix cuon trang khi doi trang, dd35c5a Sua bug diem sai lech va bo sung xu ly mat mang khi lam bai, DataPagination(), DataPaginationProps, AGGREGATE_ALERT_TYPES (+27 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (1): QuestionsService

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (45): 27cae6b topic row, 3491b87 Them loc theo chu de trong ngan hang cau hoi va sua lich thi trung gio, 4b5580c Sửa điểm -> trọng số, 4e55692 Merge pull request #23 from OAB710/main, 84885c0 Merge pull request #24 from OAB710/main, e1e0bfb Merge remote-tracking branch 'upstream/main', QuestionPreviewInfoCard(), QuestionPreviewSection() (+37 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (30): MetricCardProps, NavLink, NavLinkBaseProps, NavLinkCompatProps, useIsMobile(), cn(), FilterPanelProps, AccordionContent (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (39): 0eb4886 Merge pull request #19 from OAB710/main, 3c83f45 Detect Another Screen, 5405c6f sửa text, 61bede6 Merge remote-tracking branch 'upstream/main', 71d6c3d Sync integrity event labels, fix exam-security and evidence-review UX bugs, 79e4973 Fix UI, 8b11e41 Fix webcam/screen proctoring evidence capture and exam-security UX, 9c7cf58 Merge remote-tracking branch 'upstream/main' (+31 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (22): exam_submissions, integrity_reviews, AdminDashboardController, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, SystemOverviewController, 328ec36 add (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (26): 23cc713 Merge remote-tracking branch 'upstream/main', b27133b add, f2db362 Refactor VI + RCM Topic + AI Summarize, AuthUser, CreateCourseDto, CreateUserDto, BulkEnrollByEmailsDto, BulkEnrollmentDto (+18 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (30): question_bank_preferences, users, 13dcbd7 add, 1afe093 add, 2701bbc add, 3ce42b8 add, ad2ef1d Add accounts-only seed script for resetting production data, c32c8d2 AI + UI + FIX (+22 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (26): AiModule, AiStatusController, safeEqual(), 222b35a add, 346165c Add DeepSeek and fix exam question workflows, 55714bf Add AI provider switch command and status endpoint for Zalo bot, 97c3ce7 Update schema.prisma, c444bc6 Merge pull request #15 from OAB710/main (+18 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (28): canonicalize(), canonicalStringify(), hashObject(), isPlainObject(), chooseStrategy(), generateExam(), hashJson(), hashStringToNumber() (+20 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (19): AuthPageShell(), d78391f Redesign login page, add student registration, sync brand mark, BackToDashboardButton(), BackToDashboardButtonProps, ButtonSize, ButtonVariant, demoAccounts, getSessionDevice() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (25): Unit, UNIT_LABELS, UNIT_SECONDS, ExamItem, ExamLinkItem, LINK_STATE_LABELS, LinkUsage, GeneratedQuestion (+17 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (32): SheetContent, SheetContentProps, SheetDescription, SheetOverlay, SheetTitle, sheetVariants, Sidebar, SidebarContent (+24 more)

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (23): 649b41d chỉnh question-analytic , k phải bài thi, fd78aa1 Doi thang diem 10, sua ma tran dap an, dong bo naming giam sat, doi AI provider truc tiep, completedSubmissionStatuses, Course, CourseExam, CourseExamSummary, Enrollment, ExamSubmission (+15 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (23): answerTitles, FillBlankGuide(), OptionRowProps, Props, QuestionAnswerEditor(), GeneratedQuestion, Params, typeMap (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (23): 03ff58a Xóa mail serivce, 1098f63 add, 34443bf add, 50768bd Merge pull request #11 from trungducnguyen4/duc, 67f04b6 add, 958340a Update .gitignore, 95cd9ce add, d1945d7 add (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (30): buildBeInfoText(), buildFeInfoText(), buildPublicInfoText(), buildR2InfoText(), buildSystemOverviewConclusions(), buildSystemOverviewText(), cfGraphQL(), formatBuildStatus() (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (20): media_storage_usage, media_user_storage_usage, 6842351 BE Chat BOT, ba28c68 Merge pull request #17 from OAB710/main, ed263b5 Add question media attachments via Cloudflare R2 presigned uploads, ConfirmMediaUploadDto, CreatePresignedUploadDto, ReleaseMediaUploadDto (+12 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (2): AiService, OnModuleInit

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (3): OnModuleDestroy, OnModuleInit, SubmissionsService

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (9): 24e5343 add, b9a4c06 add, CoursesController, CoursesModule, EnrollmentsModule, ExamLinksModule, QueueModule, SubmissionsModule (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (13): AiImprovementDetail, AttemptScope, ComparisonFieldKey, EditableOption, ExamOption, formatTerm(), getDifficultyLabel(), getScopeForGradingStrategy() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.10
Nodes (18): ContextHelp(), ContextHelpProps, HelpBody(), HelpButton, HelpContent, isHelpContent(), useTouchHelpMode(), CheckStatus (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), COMPLETED_STATUSES, CourseExamAction, CourseExamForAction, CourseExamSubmission, ExamDisplayState, getCourseExamAction() (+12 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (22): AUTO_GRADED_TYPES, buildQuestionTemplate(), buildSnapshotPayload(), buildSubmittedAnswer(), buildToken(), createExamSnapshot(), generateCourseCode(), isAutoGradable() (+14 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, NestInterceptor, PerfInterceptor, OnModuleDestroy, OnModuleInit, { PrismaClient }, PrismaService (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (18): themes, ThemeToggle(), useAuth(), adminNavItems, DashboardLayoutProps, lecturerNavItems, NavItem, studentNavItems (+10 more)

### Community 42 - "Community 42"
Cohesion: 0.10
Nodes (18): 8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng, AiImprovementStatus, AiImprovementSummary, AnalyticsCourseInfo, AttemptBreakdownItem, AttemptStats, COMPARISON_FIELDS, CourseTerm (+10 more)

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (17): EXAM_PLANS, ExamPlan, main(), prisma, toExamStatus(), addMinutes(), makeRng(), seedFromString() (+9 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (1): AuthService

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (8): hash64(), LogSpec, main(), now, prisma, Profile, PROFILES, STUDENT_ID_PATTERN()

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (1): AuthController

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy, DefaultFlexible, ShuffleStrategy, StrictNoShuffle

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (3): buildEvidenceStorageKey(), OnModuleInit, ProctoringEvidenceService

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (9): CalendarView, ExamDetailsDialog(), FlexibleExamCard(), getEventTone(), getStatusLabel(), HOURS, LaidOutEvent, ScheduleExamItem (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (9): e0e0f5b Fix Bug, fd68a4b Merge pull request #16 from OAB710/main, CourseOption, Exam, GRADING_STRATEGY_LABELS, THEME_OPTIONS, THEME_PROVIDER_OPTIONS, ActiveFilterChips() (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (14): ai_generation_records, course_topics, courses, exam_questions, question_course_scopes, question_drafts, question_tags, question_topics (+6 more)

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (11): 4a024b2 Release v1.2.2: Sua bug doi AI provider khong dong bo sang ai-worker, e7566a7 Dung lai toan bo seed data va sua 2 bug cham diem/ma tran dap an, COURSE_TOPIC_LABELS, DupQuestion, EXACT_PAIRS, main(), prisma, SEMANTIC_PAIRS (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (6): ButtonProps, buttonVariants, CalendarProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.19
Nodes (13): formatBadgeText(), getStatusBadgeLabel(), getStatusBadgeTone(), LegacyStatusBadgeVariant, normalizeStatusKey(), renderBadgeContent(), STATUS_BADGE_MAP, StatusBadgeDomain (+5 more)

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (9): 736dcdd seed data thêm, main(), prisma, TARGET_EXAM_KEYS, main(), main(), prisma, TOPICS (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeader(), PageHeaderProps, EmptyStateProps, PageAction, ResponsiveColumn, StatusTone, ThemeMode (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (12): AIGenerateSectionDto, AIGenerationConstraintsDto, AISection, ApplyAICandidateDto, CreateQuestionDraftDto, DraftPublishMode, DraftValidationLevel, PublishQuestionDraftDto (+4 more)

### Community 64 - "Community 64"
Cohesion: 0.28
Nodes (11): formatDateTimeVi(), formatDateVi(), formatPercentVi(), formatScoreVi(), getAttemptStatusLabel(), getExamStatusLabel(), getExamWindowLabel(), getScheduleLabel() (+3 more)

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
Cohesion: 0.20
Nodes (9): 268c1a2 Thời gian làm quá nhanh,Mẫu trả lời giống nhau bất thường, 3959b1e bản nháp, a9268e0 Merge remote-tracking branch 'upstream/main', AddQuestionsToExamDto, CreateExamDto, RescheduleExamDto, ShareExamDto, UpdateExamDto (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.49
Nodes (9): asObject(), findErrorText(), formatManualAnswer(), matchingSides(), parseValue(), stringList(), StructuredValue, text() (+1 more)

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (2): extractUploaderIdFromKey(), MediaService

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (9): COURSE_PLANS, CoursePlan, main(), prisma, daysAgo(), LECTURER_DEPARTMENTS, LECTURER_FULL_NAMES, main() (+1 more)

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (9): anomaly_flags, exam_instances, exam_questions, exam_submissions, exams, focus_events, interaction_logs, question_versions (+1 more)

### Community 78 - "Community 78"
Cohesion: 0.24
Nodes (7): AttentionItemData, AttentionPriority, LecturerAttentionResponse, LecturerAttentionSummary, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, getQueueStorageKey(), loadQueue(), persistQueue(), safeParseQueue(), useExamAutosave(), UseExamAutosaveOptions

### Community 80 - "Community 80"
Cohesion: 0.20
Nodes (2): AiSuggestion, DraftGrade

### Community 81 - "Community 81"
Cohesion: 0.36
Nodes (9): course_topics, courses, exist, question_tags, question_topics, questions, tags, topics (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (8): COLLUDE_INDICES, COLLUSION_QUESTION_INDICES, isColluder(), main(), prisma, QUESTION_SPECS, QuestionSpec, STUDENT_ID_PATTERN()

### Community 83 - "Community 83"
Cohesion: 0.24
Nodes (1): QueueService

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

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
Nodes (8): 14d871b Release v1.1.2: Fix JSON path filter loi tren MySQL production (seed-duplicate-demo), f3b14a5 Release v1.1.3: Sua dung JSON path filter + fix hash64 vuot cot + Reset DB status tren Zalo, main(), prisma, Q, SEMANTIC, SINGLETON, TEXT_TEXT

### Community 91 - "Community 91"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (8): formatAttemptLimitVi(), formatDurationVi(), formatNumberVi(), accessBadgeClass(), ExamDetail, MySubmission, statusBadgeClass(), StudentExamDetail()

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
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 101 - "Community 101"
Cohesion: 0.67
Nodes (6): course_topics, courses, question_course_scopes, question_topics, questions, topics

### Community 102 - "Community 102"
Cohesion: 0.48
Nodes (6): exam_question_snapshots, exam_snapshots, exams, question_snapshots, question_versions, questions

### Community 103 - "Community 103"
Cohesion: 0.38
Nodes (1): AdminDashboardService

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 105 - "Community 105"
Cohesion: 0.38
Nodes (7): buildComparisonSnapshot(), getCourseLabel(), hasFieldChanged(), normalizeCorrectAnswerIds(), normalizeEditableOptions(), normalizeStringList(), safeJsonValue()

### Community 106 - "Community 106"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 107 - "Community 107"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 108 - "Community 108"
Cohesion: 0.29
Nodes (4): CommandDialogProps, CommandInput, CommandSeparator, DialogProps

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (5): anomaly_flags, exam_instances, focus_events, interaction_logs, tab_switch_events

### Community 111 - "Community 111"
Cohesion: 0.53
Nodes (1): AiController

### Community 112 - "Community 112"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (1): MediaController

### Community 115 - "Community 115"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 116 - "Community 116"
Cohesion: 0.73
Nodes (5): pickId(), pollAiJob(), request(), requireOk(), run()

### Community 119 - "Community 119"
Cohesion: 0.33
Nodes (5): Exam, ExamHistoryItem, ExamResult, ExamStatus, UpcomingExam

### Community 120 - "Community 120"
Cohesion: 0.60
Nodes (5): ipToLong(), isIpInAnyCidr(), isIpInCidr(), isValidIpOrCidr(), normalizeIp()

### Community 121 - "Community 121"
Cohesion: 0.70
Nodes (4): ai_generation_records, question_drafts, question_versions, questions

### Community 122 - "Community 122"
Cohesion: 0.70
Nodes (4): ai_generation_records, exam_quality_review_items, questions, users

### Community 123 - "Community 123"
Cohesion: 0.70
Nodes (4): exam_instances, exam_submissions, proctoring_evidence_captures, users

### Community 124 - "Community 124"
Cohesion: 0.40
Nodes (1): AuditService

### Community 125 - "Community 125"
Cohesion: 0.50
Nodes (4): 7b4322c add, f604860 add, bootstrap(), parseCsvList()

### Community 126 - "Community 126"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (2): CanActivate, RateLimitGuard

### Community 128 - "Community 128"
Cohesion: 0.40
Nodes (2): CanActivate, RolesGuard

### Community 130 - "Community 130"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 131 - "Community 131"
Cohesion: 0.40
Nodes (3): IdempotencyMiddleware, IdempotencyStore, NestMiddleware

### Community 132 - "Community 132"
Cohesion: 0.60
Nodes (4): hasColumn(), hasIndex(), main(), prisma

### Community 133 - "Community 133"
Cohesion: 0.60
Nodes (4): deleteAllUnderPrefix(), main(), parseArgs(), PREFIXES_BY_TARGET

### Community 134 - "Community 134"
Cohesion: 0.83
Nodes (3): exam_link_usages, exam_links, exams

### Community 135 - "Community 135"
Cohesion: 1.00
Nodes (3): integrity_review_audits, integrity_reviews, users

### Community 136 - "Community 136"
Cohesion: 0.83
Nodes (3): exam_submissions, score_adjustments, users

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (1): AuditController

### Community 138 - "Community 138"
Cohesion: 0.83
Nodes (3): 28c06f5 Merge pull request #1 from trungducnguyen4/main, f5fcba9 Merge pull request #5 from OAB710/main, f609787 feat(student): add exam schedule endpoint and student schedule page

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (2): PaginatedResult, PaginationDto

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (3): CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 143 - "Community 143"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 146 - "Community 146"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 147 - "Community 147"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 148 - "Community 148"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 149 - "Community 149"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 150 - "Community 150"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 152 - "Community 152"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 153 - "Community 153"
Cohesion: 1.00
Nodes (2): courses, topics

### Community 154 - "Community 154"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 155 - "Community 155"
Cohesion: 1.33
Nodes (2): auth_sessions, users

### Community 156 - "Community 156"
Cohesion: 1.00
Nodes (2): ai_generation_records, anomaly_flags

### Community 157 - "Community 157"
Cohesion: 0.67
Nodes (1): prisma

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

## Knowledge Gaps
- **684 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+679 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `extractUploaderIdFromKey()`, `MediaService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `AiSuggestion`, `DraftGrade`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `CanActivate`, `RateLimitGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `CanActivate`, `RolesGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (2 nodes): `PaginatedResult`, `PaginationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (2 nodes): `courses`, `topics`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (2 nodes): `auth_sessions`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `ai_generation_records`, `anomaly_flags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `prisma`
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

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 28`, `Community 129`, `Community 113`, `Community 144`, `Community 145`, `Community 168`, `Community 130`, `Community 169`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 32` to `Community 16`, `Community 167`, `Community 117`, `Community 94`, `Community 66`, `Community 75`, `Community 85`, `Community 118`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 13` to `Community 19`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _684 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.030388779527559057 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03570874087874554 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.053554040895813046 - nodes in this community are weakly interconnected._