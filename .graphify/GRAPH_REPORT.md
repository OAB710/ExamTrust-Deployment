# Graph Report - .  (2026-08-23)

## Corpus Check
- Large corpus: 593 files · ~570,932 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 3027 nodes · 8387 edges · 157 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 2019 · imports: 1718 · contains: 1636 · imports_from: 1045 · method: 695 · calls: 675 · ON_BRANCH: 262 · PARENT_OF: 227 · references: 87 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 593 · Candidates: 657
- Excluded: 1 untracked · 105274 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `736dcdd`
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
  git → git  _Bridges community 4 → community 1_
- `02b1de4 Pagination` --PARENT_OF--> `4e55692 Merge pull request #23 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 4 → community 14_
- `02b1de4 Pagination` --PARENT_OF--> `dd35c5a Sua bug diem sai lech va bo sung xu ly mat mang khi lam bai`  [EXTRACTED]
  git → git  _Bridges community 4 → community 9_

## Communities

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (48): ExamTrustAiUseCase, ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, OllamaGenerationOptions, formatNumber(), stringifyValue(), buildContextLines() (+40 more)

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 10 - "Community 10"
Cohesion: 0.03
Nodes (19): prisma, question_topics, topics, AiWorkerModule, AuditModule, AuthModule, JwtAuthGuard, CacheModule (+11 more)

### Community 157 - "Community 157"
Cohesion: 0.67
Nodes (1): prisma

### Community 158 - "Community 158"
Cohesion: 0.67
Nodes (1): prisma

### Community 159 - "Community 159"
Cohesion: 0.67
Nodes (1): prisma

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (39): prisma, TABLES, INTEGRITY_EVENT_LABELS, getIntegrityEventLabel(), IntegrityEventCategory, getIntegrityEventCategory(), getIntegrityEventSeverity(), SubmissionsEventsService (+31 more)

### Community 160 - "Community 160"
Cohesion: 0.67
Nodes (1): prisma

### Community 161 - "Community 161"
Cohesion: 0.67
Nodes (1): prisma

### Community 146 - "Community 146"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 132 - "Community 132"
Cohesion: 0.60
Nodes (4): prisma, hasColumn(), hasIndex(), main()

### Community 162 - "Community 162"
Cohesion: 0.67
Nodes (1): prisma

### Community 163 - "Community 163"
Cohesion: 0.67
Nodes (1): prisma

### Community 101 - "Community 101"
Cohesion: 0.67
Nodes (6): topics, questions, question_topics, course_topics, courses, question_course_scopes

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (14): questions, exam_questions, question_versions, submission_answers, tags, question_tags, topics, question_topics (+6 more)

### Community 69 - "Community 69"
Cohesion: 0.45
Nodes (10): courses, users, enrollments, exams, questions, exam_questions, exam_submissions, submission_answers (+2 more)

### Community 134 - "Community 134"
Cohesion: 0.83
Nodes (3): exam_links, exams, exam_link_usages

### Community 152 - "Community 152"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (99): prisma, VersionSpec, QuestionSpec, QUESTIONS, EXAMS, AI_SECTIONS, AISectionValue, AiTaskType (+91 more)

### Community 153 - "Community 153"
Cohesion: 1.00
Nodes (2): topics, courses

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (5): exam_instances, interaction_logs, tab_switch_events, focus_events, anomaly_flags

### Community 102 - "Community 102"
Cohesion: 0.48
Nodes (6): question_versions, questions, question_snapshots, exam_snapshots, exams, exam_question_snapshots

### Community 77 - "Community 77"
Cohesion: 0.36
Nodes (9): exam_questions, question_versions, exam_instances, exams, exam_submissions, interaction_logs, tab_switch_events, focus_events (+1 more)

### Community 121 - "Community 121"
Cohesion: 0.70
Nodes (4): question_drafts, questions, ai_generation_records, question_versions

### Community 154 - "Community 154"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 89 - "Community 89"
Cohesion: 0.39
Nodes (8): question_statistics, question_versions, questions, exam_submission_regrade_logs, ai_generation_records, users, exam_submissions, submission_answers

### Community 122 - "Community 122"
Cohesion: 0.70
Nodes (4): exam_quality_review_items, ai_generation_records, questions, users

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (9): CoursesController, CoursesModule, EnrollmentsModule, ExamLinksModule, QueueModule, SubmissionsModule, UsersModule, 24e5343 add (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (22): integrity_reviews, exam_submissions, AdminDashboardController, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, SystemOverviewController, AppModule (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (23): ExamsModule, Question, STRUCTURED_ANSWER_TYPES, formatAnswerCell(), formatPoints(), OptionDisplay, parseStoredValue(), optionDisplays() (+15 more)

### Community 135 - "Community 135"
Cohesion: 1.00
Nodes (3): integrity_reviews, integrity_review_audits, users

### Community 155 - "Community 155"
Cohesion: 1.33
Nodes (2): users, auth_sessions

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (26): LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto, DeleteProfileDto, JwtStrategy, LimitConfig, POLICIES (+18 more)

### Community 136 - "Community 136"
Cohesion: 0.83
Nodes (3): score_adjustments, exam_submissions, users

### Community 123 - "Community 123"
Cohesion: 0.70
Nodes (4): proctoring_evidence_captures, exam_submissions, exam_instances, users

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (30): question_bank_preferences, users, CopyQuestionBankDto, PreviewCopyQuestionBankDto, CreateQuestionCrudDto, UpdateQuestionCrudDto, QUESTION_LIMITS, assertQuestionContentLength() (+22 more)

### Community 156 - "Community 156"
Cohesion: 1.00
Nodes (2): anomaly_flags, ai_generation_records

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (20): media_storage_usage, media_user_storage_usage, CreatePresignedUploadDto, ConfirmMediaUploadDto, ReleaseMediaUploadDto, MediaAttachmentType, MEDIA_ALLOWED_MIME_TYPES, MEDIA_EXTENSION_BY_MIME (+12 more)

### Community 81 - "Community 81"
Cohesion: 0.36
Nodes (9): with, tags, question_tags, questions, question_topics, topics, course_topics, courses (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (8): prisma, STUDENT_ID_PATTERN(), COLLUDE_INDICES, isColluder(), COLLUSION_QUESTION_INDICES, QuestionSpec, QUESTION_SPECS, main()

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (1): prisma

### Community 74 - "Community 74"
Cohesion: 0.22
Nodes (9): prisma, CoursePlan, COURSE_PLANS, main(), daysAgo(), prisma, LECTURER_FULL_NAMES, LECTURER_DEPARTMENTS (+1 more)

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (8): prisma, Q, TEXT_TEXT, SEMANTIC, SINGLETON, main(), 14d871b Release v1.1.2: Fix JSON path filter loi tren MySQL production (seed-duplicate-demo), f3b14a5 Release v1.1.3: Sua dung JSON path filter + fix hash64 vuot cot + Reset DB status tren Zalo

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (17): prisma, ExamPlan, EXAM_PLANS, toExamStatus(), main(), addMinutes(), makeRng(), seedFromString() (+9 more)

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (10): prisma, TARGET_EXAM_KEYS, main(), main(), main(), prisma, TopicSeed, TOPICS (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (22): TODAY, pick(), randInt(), toAsciiUpper(), buildToken(), generateCourseCode(), AUTO_GRADED_TYPES, isAutoGradable() (+14 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (8): prisma, STUDENT_ID_PATTERN(), hash64(), LogSpec, Profile, now, PROFILES, main()

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (11): prisma, DupQuestion, EXACT_PAIRS, SEMANTIC_PAIRS, main(), COURSE_TOPIC_LABELS, prisma, topicCode() (+3 more)

### Community 147 - "Community 147"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 148 - "Community 148"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (1): prisma

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (7): prisma, BATCH_SIZE, LegacyQuestion, fetchBatch(), processQuestion(), main(), { PrismaClient }

### Community 133 - "Community 133"
Cohesion: 0.60
Nodes (4): PREFIXES_BY_TARGET, parseArgs(), deleteAllUnderPrefix(), main()

### Community 116 - "Community 116"
Cohesion: 0.73
Nodes (5): request(), requireOk(), pickId(), pollAiJob(), run()

### Community 93 - "Community 93"
Cohesion: 0.47
Nodes (8): percentile(), summarize(), timedRequest(), safeJson(), loginRequest(), runSequential(), runConcurrent(), main()

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (1): prisma

### Community 103 - "Community 103"
Cohesion: 0.38
Nodes (1): AdminDashboardService

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (26): safeEqual(), AiStatusController, AiModule, QType, BaseQ, SingleChoiceQ, MultiChoiceQ, TrueFalseQ (+18 more)

### Community 111 - "Community 111"
Cohesion: 0.53
Nodes (1): AiController

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (2): AiService, OnModuleInit

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (1): AuditController

### Community 124 - "Community 124"
Cohesion: 0.40
Nodes (1): AuditService

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (1): AuthController

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, PerfInterceptor, NestInterceptor, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs() (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (1): AuthService

### Community 128 - "Community 128"
Cohesion: 0.40
Nodes (2): RolesGuard, CanActivate

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (1): CacheService

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (2): PaginationDto, PaginatedResult

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (2): RateLimitGuard, CanActivate

### Community 131 - "Community 131"
Cohesion: 0.40
Nodes (3): IdempotencyStore, IdempotencyMiddleware, NestMiddleware

### Community 126 - "Community 126"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 107 - "Community 107"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 120 - "Community 120"
Cohesion: 0.60
Nodes (5): normalizeIp(), ipToLong(), isIpInCidr(), isIpInAnyCidr(), isValidIpOrCidr()

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 96 - "Community 96"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 91 - "Community 91"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 58 - "Community 58"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (9): CreateExamDto, UpdateExamDto, RescheduleExamDto, AddQuestionsToExamDto, UpdateExamQuestionDto, 268c1a2 Thời gian làm quá nhanh,Mẫu trả lời giống nhau bất thường, 3959b1e bản nháp, a9268e0 Merge remote-tracking branch 'upstream/main' (+1 more)

### Community 112 - "Community 112"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 138 - "Community 138"
Cohesion: 0.83
Nodes (3): 28c06f5 Merge pull request #1 from trungducnguyen4/main, f5fcba9 Merge pull request #5 from OAB710/main, f609787 feat(student): add exam schedule endpoint and student schedule page

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): AUTO_GRADED_TYPES, GradingProcessor, ExamSecurityModalProps, ExamSecurityModal(), LiveClock(), ExamQuestion, ExamData, getOptionEntries() (+33 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (40): HealthController, ActiveFilterChipsProps, ActiveFilterChips(), TextareaProps, Textarea, Exam, CourseOption, GRADING_STRATEGY_LABELS (+32 more)

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 143 - "Community 143"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 125 - "Community 125"
Cohesion: 0.50
Nodes (4): parseCsvList(), bootstrap(), 7b4322c add, f604860 add

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (1): MediaController

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (2): extractUploaderIdFromKey(), MediaService

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 63 - "Community 63"
Cohesion: 0.15
Nodes (12): QuestionDraftMode, QuestionDraftStepKey, AISection, DraftValidationLevel, DraftPublishMode, CreateQuestionDraftDto, SaveDraftStepDto, AIGenerationConstraintsDto (+4 more)

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (3): ListTopicsQueryDto, CreateTopicDto, SetCourseTopicsDto

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 115 - "Community 115"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (1): QuestionsService

### Community 106 - "Community 106"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 149 - "Community 149"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 150 - "Community 150"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 83 - "Community 83"
Cohesion: 0.24
Nodes (1): QueueService

### Community 84 - "Community 84"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (3): buildEvidenceStorageKey(), ProctoringEvidenceService, OnModuleInit

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (3): SubmissionsService, OnModuleInit, OnModuleDestroy

### Community 87 - "Community 87"
Cohesion: 0.20
Nodes (1): UsersController

### Community 88 - "Community 88"
Cohesion: 0.22
Nodes (1): UsersService

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (11): { PrismaClient }, prisma, Header(), roleToPath, capabilityGroups, mocks, mocks, courses (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (48): AdminPageShell(), ParsedRow, ValidationError, ValidatedData, ImportState, ImportResult, BulkStudentImportProps, COLUMN_ALIASES (+40 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (46): AdminStatCardProps, AdminStatCard(), IntegrityCaseDetailProps, IntegrityTimelineEvent, EvidenceCapture, getEvidenceEventLabel(), IntegrityCaseDetail(), ConfirmActionDialogProps (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (42): DataPaginationProps, DataPagination(), FilterPanel(), ListPageHeaderProps, ListPageHeader(), SearchBarProps, SearchBar(), SortOrder (+34 more)

### Community 12 - "Community 12"
Cohesion: 0.05
Nodes (41): metadata, Providers(), ToasterProps, Toaster(), ToastViewport, toastVariants, Toast, ToastAction (+33 more)

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (13): ExamOption, AiImprovementDetail, EditableOption, QuestionCourseInfo, ComparisonFieldKey, QUESTION_TYPE_LABELS, getDifficultyLabel(), ISSUE_LABELS (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (54): DurationInput(), Period, HOURS_12, MINUTES, parse24(), to12(), TimePickerVi(), Command (+46 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (19): AuthPageShell(), ButtonVariant, ButtonSize, BackToDashboardButtonProps, BackToDashboardButton(), alertVariants, Alert, AlertTitle (+11 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (9): CalendarView, ScheduleExamItem, HOURS, getEventTone(), getStatusLabel(), toDate(), LaidOutEvent, FlexibleExamCard() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (30): NavLinkBaseProps, NavLinkCompatProps, NavLink, MetricCardProps, FilterPanelProps, AccordionItem, AccordionTrigger, AccordionContent (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (31): AdminPageShellProps, HelpedTitle(), DashboardLayout(), Card, CardHeader, CardTitle, CardDescription, CardContent (+23 more)

### Community 37 - "Community 37"
Cohesion: 0.10
Nodes (18): HelpContent, ContextHelpProps, isHelpContent(), HelpBody(), HelpButton, useTouchHelpMode(), ContextHelp(), Separator (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (25): Unit, UNIT_SECONDS, UNIT_LABELS, Input, Progress, SelectTrigger, SelectScrollUpButton, SelectScrollDownButton (+17 more)

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeaderProps, PageHeader(), ThemeMode, StatusTone, UiStatus, PageAction, EmptyStateProps (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (18): themes, ThemeToggle(), NavItem, studentNavItems, lecturerNavItems, adminNavItems, DashboardLayoutProps, Avatar (+10 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (8): TextFilterOperator, ListFilterOption, TextFilterValue, NumberRangeValue, DateRangeValue, FilterValue, FilterValues, FilterChip

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (5): Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (6): buttonVariants, ButtonProps, CalendarProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (12): CarouselApi, UseCarouselParameters, CarouselOptions, CarouselPlugin, CarouselProps, CarouselContextProps, CarouselContext, Carousel (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (7): THEMES, ChartConfig, ChartContextProps, ChartContext, ChartContainer, ChartTooltipContent, ChartLegendContent

### Community 108 - "Community 108"
Cohesion: 0.29
Nodes (4): CommandDialogProps, DialogProps, CommandInput, CommandSeparator

### Community 86 - "Community 86"
Cohesion: 0.20
Nodes (8): ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator

### Community 67 - "Community 67"
Cohesion: 0.17
Nodes (9): FormFieldContextValue, FormFieldContext, FormItemContextValue, FormItemContext, FormItem, FormLabel, FormControl, FormDescription (+1 more)

### Community 68 - "Community 68"
Cohesion: 0.17
Nodes (10): Menubar, MenubarTrigger, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem (+2 more)

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuList, navigationMenuTriggerStyle, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (32): SheetOverlay, sheetVariants, SheetContentProps, SheetContent, SheetTitle, SheetDescription, SidebarContext, SidebarProvider (+24 more)

### Community 61 - "Community 61"
Cohesion: 0.19
Nodes (13): statusBadgeVariants, StatusBadgeTone, LegacyStatusBadgeVariant, StatusBadgeDomain, StatusBadgeMapEntry, STATUS_BADGE_MAP, normalizeStatusKey(), toTitleCase() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (23): Switch, Props, answerTitles, FillBlankGuide(), QuestionAnswerEditor(), OptionRowProps, GeneratedQuestion, Params (+15 more)

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (5): ToggleGroupContext, ToggleGroup, ToggleGroupItem, toggleVariants, Toggle

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (28): isPlainObject(), canonicalize(), canonicalStringify(), hashObject(), Snapshot, hashJson(), chooseStrategy(), generateExam() (+20 more)

### Community 95 - "Community 95"
Cohesion: 0.29
Nodes (5): StructuralLayer, OrderingLayer, ReferenceBinding, RenderingContract, CLIENT_RENDERING_RULES

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ShuffleStrategy, StrictNoShuffle, DefaultFlexible, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (23): Course, APICourse, CourseExamPreview, courseGradientClasses, StudentSearchResult, EnrollResult, ImportedStudent, toAsciiUpper() (+15 more)

### Community 80 - "Community 80"
Cohesion: 0.20
Nodes (2): DraftGrade, AiSuggestion

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (45): QuestionDuplicateRelation, DuplicatePair, duplicateRelationLabel, duplicateRelationGuidance, safeParseJson(), normalizeOptions(), normalizeCorrectAnswer(), formatDateSafe() (+37 more)

### Community 78 - "Community 78"
Cohesion: 0.24
Nodes (7): AttentionPriority, LecturerAttentionSummary, LecturerAttentionResponse, AttentionItemData, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 42 - "Community 42"
Cohesion: 0.10
Nodes (18): CourseTerm, AnalyticsCourseInfo, sortExamsForAnalytics(), pickDefaultAnalyticsExamId(), AiImprovementStatus, AiImprovementSummary, PreviewQuestion, QuestionComparisonSnapshot (+10 more)

### Community 105 - "Community 105"
Cohesion: 0.38
Nodes (7): getCourseLabel(), safeJsonValue(), normalizeEditableOptions(), normalizeCorrectAnswerIds(), hasFieldChanged(), normalizeStringList(), buildComparisonSnapshot()

### Community 72 - "Community 72"
Cohesion: 0.49
Nodes (9): StructuredValue, asObject(), parseValue(), text(), stringList(), matchingSides(), trueFalseText(), findErrorText() (+1 more)

### Community 92 - "Community 92"
Cohesion: 0.33
Nodes (8): ExamDetail, MySubmission, statusBadgeClass(), accessBadgeClass(), StudentExamDetail(), formatNumberVi(), formatDurationVi(), formatAttemptLimitVi()

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), UpcomingExam, ExamHistoryItem, StudentCourse, safeLabel(), formatLatestActivityVi(), CourseExamSubmission (+12 more)

### Community 79 - "Community 79"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, UseExamAutosaveOptions, getQueueStorageKey(), safeParseQueue(), persistQueue(), loadQueue(), useExamAutosave()

### Community 130 - "Community 130"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 97 - "Community 97"
Cohesion: 0.43
Nodes (7): isLive(), setPendingWebcamStream(), takePendingWebcamStream(), setPendingScreenStream(), takePendingScreenStream(), hasPendingScreenStream(), clearPendingProctoringStreams()

### Community 64 - "Community 64"
Cohesion: 0.28
Nodes (11): STATUS_LABELS, normalize(), getUiStatus(), getExamStatusLabel(), getAttemptStatusLabel(), getExamWindowLabel(), getScheduleLabel(), formatDateVi() (+3 more)

### Community 119 - "Community 119"
Cohesion: 0.33
Nodes (5): ExamStatus, Exam, ExamResult, UpcomingExam, ExamHistoryItem

### Community 98 - "Community 98"
Cohesion: 0.25
Nodes (6): root, limit, include, ignoredDirectories, exceptions, oversized

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (30): safeEqual(), normalizeCommand(), githubHeaders, getLastRunAgeMs(), triggerDeploy(), getLatestWorkflowRun(), formatBuildStatus(), setFeSubdomainEnabled() (+22 more)

## Knowledge Gaps
- **683 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+678 more)
  These have ≤1 connection - possible missing edges or undocumented components.
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
- **Thin community `Community 146`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (2 nodes): `topics`, `courses`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (2 nodes): `users`, `auth_sessions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `anomaly_flags`, `ai_generation_records`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `RolesGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (2 nodes): `PaginationDto`, `PaginatedResult`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `RateLimitGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `extractUploaderIdFromKey()`, `MediaService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `DraftGrade`, `AiSuggestion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 27`, `Community 129`, `Community 113`, `Community 144`, `Community 145`, `Community 168`, `Community 130`, `Community 169`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 31` to `Community 16`, `Community 167`, `Community 117`, `Community 94`, `Community 66`, `Community 75`, `Community 85`, `Community 118`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 13` to `Community 19`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _683 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.05501165501165501 - nodes in this community are weakly interconnected._
- **Should `Community 10` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 16` be split into smaller, more focused modules?**
  _Cohesion score 0.05697278911564626 - nodes in this community are weakly interconnected._