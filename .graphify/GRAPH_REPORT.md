# Graph Report - .  (2026-08-16)

## Corpus Check
- Large corpus: 575 files · ~526,759 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2841 nodes · 7676 edges · 163 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: MODIFIES: 1694 · imports: 1641 · contains: 1521 · imports_from: 1003 · method: 680 · calls: 632 · ON_BRANCH: 220 · PARENT_OF: 175 · references: 87 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 575 · Candidates: 637
- Excluded: 0 untracked · 105103 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `a50c3a6`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 151 edges
2. `SubmissionsService` - 83 edges
3. `Button` - 69 edges
4. `cn()` - 65 edges
5. `Card` - 54 edges
6. `CardContent` - 54 edges
7. `QuestionsService` - 52 edges
8. `DashboardLayout()` - 48 edges
9. `CardHeader` - 48 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `01349dc Merge pull request #18 from OAB710/main` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 8 → community 2_
- `01349dc Merge pull request #18 from OAB710/main` --PARENT_OF--> `8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng`  [EXTRACTED]
  git → git  _Bridges community 8 → community 21_
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 6 → community 2_
- `03ff58a Xóa mail serivce` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 52 → community 2_
- `0716f8a Zalo Web Hook` --PARENT_OF--> `3221af2 Merge pull request #2 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 2 → community 41_

## Communities

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (61): prisma, AiStatusController, AiModule, 007a277 Update ZaloBotFeature, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0c12096 Update page.tsx, 14c973c Add Cloudflare Workers deployment config for FE via OpenNext (+53 more)

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (19): prisma, question_topics, topics, AiWorkerModule, AuditModule, AuthModule, JwtAuthGuard, CacheModule (+11 more)

### Community 161 - "Community 161"
Cohesion: 0.67
Nodes (1): prisma

### Community 162 - "Community 162"
Cohesion: 0.67
Nodes (1): prisma

### Community 163 - "Community 163"
Cohesion: 0.67
Nodes (1): prisma

### Community 147 - "Community 147"
Cohesion: 0.50
Nodes (2): prisma, TABLES

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (1): prisma

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (1): prisma

### Community 148 - "Community 148"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 133 - "Community 133"
Cohesion: 0.60
Nodes (4): prisma, hasColumn(), hasIndex(), main()

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (1): prisma

### Community 167 - "Community 167"
Cohesion: 0.67
Nodes (1): prisma

### Community 103 - "Community 103"
Cohesion: 0.67
Nodes (6): topics, questions, question_topics, course_topics, courses, question_course_scopes

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (14): questions, exam_questions, question_versions, submission_answers, tags, question_tags, topics, question_topics (+6 more)

### Community 67 - "Community 67"
Cohesion: 0.45
Nodes (10): courses, users, enrollments, exams, questions, exam_questions, exam_submissions, submission_answers (+2 more)

### Community 135 - "Community 135"
Cohesion: 0.83
Nodes (3): exam_links, exams, exam_link_usages

### Community 155 - "Community 155"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 156 - "Community 156"
Cohesion: 1.00
Nodes (2): topics, courses

### Community 111 - "Community 111"
Cohesion: 0.33
Nodes (5): exam_instances, interaction_logs, tab_switch_events, focus_events, anomaly_flags

### Community 104 - "Community 104"
Cohesion: 0.48
Nodes (6): question_versions, questions, question_snapshots, exam_snapshots, exams, exam_question_snapshots

### Community 75 - "Community 75"
Cohesion: 0.36
Nodes (9): exam_questions, question_versions, exam_instances, exams, exam_submissions, interaction_logs, tab_switch_events, focus_events (+1 more)

### Community 123 - "Community 123"
Cohesion: 0.70
Nodes (4): question_drafts, questions, ai_generation_records, question_versions

### Community 157 - "Community 157"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 87 - "Community 87"
Cohesion: 0.39
Nodes (8): question_statistics, question_versions, questions, exam_submission_regrade_logs, ai_generation_records, users, exam_submissions, submission_answers

### Community 124 - "Community 124"
Cohesion: 0.70
Nodes (4): exam_quality_review_items, ai_generation_records, questions, users

### Community 76 - "Community 76"
Cohesion: 0.20
Nodes (3): AuditService, 0e4348a add, 1ea6b35 add

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (9): CoursesController, CoursesModule, EnrollmentsModule, ExamLinksModule, QueueModule, SubmissionsModule, UsersModule, 24e5343 add (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (27): integrity_reviews, exam_submissions, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, SystemOverviewController, AppModule, RiskFlagDecision (+19 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (19): prisma, Fact, CourseBank, banks, Question, formatPoints(), parseOptionTexts(), OptionDisplay (+11 more)

### Community 136 - "Community 136"
Cohesion: 1.00
Nodes (3): integrity_reviews, integrity_review_audits, users

### Community 158 - "Community 158"
Cohesion: 1.33
Nodes (2): users, auth_sessions

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (26): LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto, DeleteProfileDto, JwtStrategy, LimitConfig, POLICIES (+18 more)

### Community 137 - "Community 137"
Cohesion: 0.83
Nodes (3): score_adjustments, exam_submissions, users

### Community 125 - "Community 125"
Cohesion: 0.70
Nodes (4): proctoring_evidence_captures, exam_submissions, exam_instances, users

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (17): AUTO_GRADED_TYPES, CopyQuestionBankDto, CreateQuestionCrudDto, UpdateQuestionCrudDto, GradingProcessor, ExamQuestion, ExamData, getOptionEntries() (+9 more)

### Community 159 - "Community 159"
Cohesion: 1.00
Nodes (2): question_bank_preferences, users

### Community 160 - "Community 160"
Cohesion: 1.00
Nodes (2): anomaly_flags, ai_generation_records

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (29): media_storage_usage, media_user_storage_usage, CreatePresignedUploadDto, ConfirmMediaUploadDto, ReleaseMediaUploadDto, MediaAttachmentType, MEDIA_ALLOWED_MIME_TYPES, MEDIA_EXTENSION_BY_MIME (+21 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (23): INTEGRITY_EVENT_LABELS, getIntegrityEventLabel(), IntegrityEventCategory, getIntegrityEventCategory(), getIntegrityEventSeverity(), VN_FONT_DIR, VN_FONT_REGULAR, VN_FONT_BOLD (+15 more)

### Community 79 - "Community 79"
Cohesion: 0.36
Nodes (9): with, tags, question_tags, questions, question_topics, topics, course_topics, courses (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (16): prisma, students, QUESTION_LIMITS, assertQuestionContentLength(), assertExplanationLength(), assertOptionsLength(), assertLineContent(), AuthUser (+8 more)

### Community 117 - "Community 117"
Cohesion: 0.33
Nodes (4): prisma, ChoiceQuestion, TopicSeed, topics

### Community 168 - "Community 168"
Cohesion: 0.67
Nodes (1): prisma

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (17): prisma, students, lecturers, seedQuestions, main(), realisticCourseSections, ChoiceQuestion, questions (+9 more)

### Community 149 - "Community 149"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 150 - "Community 150"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 169 - "Community 169"
Cohesion: 0.67
Nodes (1): prisma

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (7): prisma, BATCH_SIZE, LegacyQuestion, fetchBatch(), processQuestion(), main(), { PrismaClient }

### Community 134 - "Community 134"
Cohesion: 0.60
Nodes (4): PREFIXES_BY_TARGET, parseArgs(), deleteAllUnderPrefix(), main()

### Community 119 - "Community 119"
Cohesion: 0.73
Nodes (5): request(), requireOk(), pickId(), pollAiJob(), run()

### Community 94 - "Community 94"
Cohesion: 0.47
Nodes (8): percentile(), summarize(), timedRequest(), safeJson(), loginRequest(), runSequential(), runConcurrent(), main()

### Community 170 - "Community 170"
Cohesion: 0.67
Nodes (1): prisma

### Community 138 - "Community 138"
Cohesion: 0.50
Nodes (1): AdminDashboardController

### Community 105 - "Community 105"
Cohesion: 0.38
Nodes (1): AdminDashboardService

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AISectionValue, AiTaskType, CreateAiJobParams, AiJobsService

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (44): ExamTrustAiUseCase, ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, OllamaGenerationOptions, formatNumber(), stringifyValue(), buildContextLines() (+36 more)

### Community 112 - "Community 112"
Cohesion: 0.53
Nodes (1): AiController

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (2): AiService, OnModuleInit

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): AuditController

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (1): AuthController

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, PerfInterceptor, NestInterceptor, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs() (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (1): AuthService

### Community 128 - "Community 128"
Cohesion: 0.40
Nodes (2): RolesGuard, CanActivate

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (1): CacheService

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (2): PaginationDto, PaginatedResult

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (2): RateLimitGuard, CanActivate

### Community 132 - "Community 132"
Cohesion: 0.40
Nodes (3): IdempotencyStore, IdempotencyMiddleware, NestMiddleware

### Community 126 - "Community 126"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 109 - "Community 109"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 122 - "Community 122"
Cohesion: 0.60
Nodes (5): normalizeIp(), ipToLong(), isIpInCidr(), isIpInAnyCidr(), isValidIpOrCidr()

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 97 - "Community 97"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 90 - "Community 90"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 56 - "Community 56"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (11): CreateExamDto, UpdateExamDto, RescheduleExamDto, AddQuestionsToExamDto, UpdateExamQuestionDto, ExamsModule, 03ff58a Xóa mail serivce, 268c1a2 Thời gian làm quá nhanh,Mẫu trả lời giống nhau bất thường (+3 more)

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 143 - "Community 143"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 144 - "Community 144"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 171 - "Community 171"
Cohesion: 1.00
Nodes (2): parseCsvList(), bootstrap()

### Community 116 - "Community 116"
Cohesion: 0.33
Nodes (1): MediaController

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (2): extractUploaderIdFromKey(), MediaService

### Community 153 - "Community 153"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 60 - "Community 60"
Cohesion: 0.15
Nodes (12): QuestionDraftMode, QuestionDraftStepKey, AISection, DraftValidationLevel, DraftPublishMode, CreateQuestionDraftDto, SaveDraftStepDto, AIGenerationConstraintsDto (+4 more)

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (3): ListTopicsQueryDto, CreateTopicDto, SetCourseTopicsDto

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 118 - "Community 118"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (31): ExamSecurityModal(), QuestionRenderer(), DuringReviewFeedback, PendingIntegrityEvent, QType, BaseQ, SingleChoiceQ, MultiChoiceQ (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 108 - "Community 108"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 152 - "Community 152"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 80 - "Community 80"
Cohesion: 0.24
Nodes (1): QueueService

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (19): StartExamDto, RequestEvidenceCaptureDto, FinalizeEvidenceCaptureDto, ReviewEvidenceCaptureDto, SubmitAnswerDto, SubmitExamDto, AutosaveAnswerDto, AutosaveExamDto (+11 more)

### Community 81 - "Community 81"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (9): KNOWN_SIGNAL_SLUGS, buildEvidenceStorageKey(), EventCaptureLimits, WebcamEvidencePolicy, SCHEDULED_CAPTURE_PERCENTAGES, DEFAULT_EVENT_CAPTURE_LIMITS, DEFAULT_POLICY, ProctoringEvidenceService (+1 more)

### Community 154 - "Community 154"
Cohesion: 0.50
Nodes (1): SubmissionsEventsService

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (3): SubmissionsService, OnModuleInit, OnModuleDestroy

### Community 85 - "Community 85"
Cohesion: 0.20
Nodes (1): UsersController

### Community 86 - "Community 86"
Cohesion: 0.22
Nodes (1): UsersService

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (12): { PrismaClient }, prisma, Header(), roleToPath, capabilityGroups, mocks, mocks, mocks (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (28): TabsList, TabsTrigger, TabsContent, IntegrityStats, IntegrityPatterns, IntegrityCasesResponse, EMPTY_STATS, EMPTY_PATTERNS (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (36): ActiveFilterChipsProps, ActiveFilterChips(), FilterPanelProps, FilterPanel(), TextFilterOperator, ListFilterOption, TextFilterValue, NumberRangeValue (+28 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (2): DraftGrade, AiSuggestion

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (20): ListPageHeaderProps, ListPageHeader(), SearchBarProps, SearchBar(), SortOrder, SortOption, SortButtonProps, SortButton() (+12 more)

### Community 68 - "Community 68"
Cohesion: 0.22
Nodes (6): metadata, Providers(), ToasterProps, Toaster(), Toaster(), AuthProvider()

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (26): CourseTerm, AnalyticsCourseInfo, ExamOption, sortExamsForAnalytics(), pickDefaultAnalyticsExamId(), AiImprovementStatus, AiImprovementSummary, AiImprovementDetail (+18 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (14): Command, CommandList, CommandEmpty, CommandGroup, CommandItem, PopoverContent, mocks, STEPS (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.24
Nodes (7): AuthPageShell(), demoAccounts, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs(), logPerf()

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (34): violationLabels, ExamSecurityModalProps, LiveClock(), themes, ThemeToggle(), NavItem, studentNavItems, lecturerNavItems (+26 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (30): NavLinkBaseProps, NavLinkCompatProps, NavLink, MetricCardProps, AccordionItem, AccordionTrigger, AccordionContent, AvatarImage (+22 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (41): AdminPageShellProps, AdminPageShell(), AdminStatCardProps, AdminStatCard(), ConfirmActionDialogProps, ConfirmActionDialog(), AlertDialogOverlay, AlertDialogContent (+33 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (14): IntegrityCaseDetailProps, IntegrityTimelineEvent, EvidenceCapture, EVIDENCE_SIGNAL_LABELS, getEvidenceEventLabel(), IntegrityCaseDetail(), Checkbox, Progress (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (32): ButtonVariant, ButtonSize, BackToDashboardButtonProps, BackToDashboardButton(), DashboardLayout(), Card, CardHeader, CardTitle (+24 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (19): ParsedRow, ValidationError, ValidatedData, ImportState, ImportResult, BulkStudentImportProps, COLUMN_ALIASES, BulkStudentImport() (+11 more)

### Community 89 - "Community 89"
Cohesion: 0.28
Nodes (8): HelpContent, ContextHelpProps, isHelpContent(), HelpBody(), HelpButton, useTouchHelpMode(), ContextHelp(), TooltipContent

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (51): DataPaginationProps, DataPagination(), Table, TableHeader, TableBody, TableFooter, TableRow, TableHead (+43 more)

### Community 113 - "Community 113"
Cohesion: 0.33
Nodes (5): Unit, UNIT_SECONDS, UNIT_LABELS, DurationInput(), cdca2b5 Schedule Capture

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeaderProps, PageHeader(), ThemeMode, StatusTone, UiStatus, PageAction, EmptyStateProps (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.32
Nodes (6): Period, HOURS_12, MINUTES, parse24(), to12(), TimePickerVi()

### Community 50 - "Community 50"
Cohesion: 0.26
Nodes (7): alertVariants, Alert, AlertTitle, AlertDescription, Input, labelVariants, Label

### Community 83 - "Community 83"
Cohesion: 0.20
Nodes (4): ButtonProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (12): CarouselApi, UseCarouselParameters, CarouselOptions, CarouselPlugin, CarouselProps, CarouselContextProps, CarouselContext, Carousel (+4 more)

### Community 73 - "Community 73"
Cohesion: 0.18
Nodes (7): THEMES, ChartConfig, ChartContextProps, ChartContext, ChartContainer, ChartTooltipContent, ChartLegendContent

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (4): CommandDialogProps, DialogProps, CommandInput, CommandSeparator

### Community 84 - "Community 84"
Cohesion: 0.20
Nodes (8): ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator

### Community 101 - "Community 101"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerOverlay, DrawerContent, DrawerHeader(), DrawerFooter(), DrawerTitle, DrawerDescription

### Community 65 - "Community 65"
Cohesion: 0.17
Nodes (9): FormFieldContextValue, FormFieldContext, FormItemContextValue, FormItemContext, FormItem, FormLabel, FormControl, FormDescription (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (10): Menubar, MenubarTrigger, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuList, navigationMenuTriggerStyle, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (23): SelectTrigger, SelectScrollUpButton, SelectScrollDownButton, SelectContent, SelectLabel, SelectItem, SelectSeparator, Slider (+15 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (33): SheetOverlay, sheetVariants, SheetContentProps, SheetContent, SheetTitle, SheetDescription, SidebarContext, SidebarProvider (+25 more)

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (18): statusBadgeVariants, StatusBadgeTone, LegacyStatusBadgeVariant, StatusBadgeDomain, StatusBadgeMapEntry, STATUS_BADGE_MAP, normalizeStatusKey(), toTitleCase() (+10 more)

### Community 74 - "Community 74"
Cohesion: 0.27
Nodes (9): ToastViewport, toastVariants, Toast, ToastAction, ToastClose, ToastTitle, ToastDescription, ToastProps (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (14): ToasterToast, actionTypes, genId(), ActionType, Action, State, toastTimeouts, addToRemoveQueue() (+6 more)

### Community 70 - "Community 70"
Cohesion: 0.22
Nodes (7): AuthContextType, AuthState, AuthContext, UserRole, DisplayRole, User, AuthState

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (28): isPlainObject(), canonicalize(), canonicalStringify(), hashObject(), Snapshot, hashJson(), chooseStrategy(), generateExam() (+20 more)

### Community 96 - "Community 96"
Cohesion: 0.29
Nodes (5): StructuralLayer, OrderingLayer, ReferenceBinding, RenderingContract, CLIENT_RENDERING_RULES

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ShuffleStrategy, StrictNoShuffle, DefaultFlexible, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (43): QuestionDuplicateRelation, DuplicatePair, duplicateRelationLabel, duplicateRelationGuidance, safeParseJson(), normalizeOptions(), normalizeCorrectAnswer(), formatDateSafe() (+35 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (22): Props, answerTitles, FillBlankGuide(), QuestionAnswerEditor(), OptionRowProps, GeneratedQuestion, Params, typeMap (+14 more)

### Community 77 - "Community 77"
Cohesion: 0.24
Nodes (7): AttentionPriority, LecturerAttentionSummary, LecturerAttentionResponse, AttentionItemData, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (19): Step, ExamForm, ReviewPhaseKey, ReviewPhaseConfig, createDefaultReviewSettingsDraft(), buildReviewSettingsPayload(), reviewPhaseSummary(), CourseOption (+11 more)

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (5): pad2(), toDateInputValue(), toTimeInputValue(), getDefaultExamWindow(), createDefaultForm()

### Community 107 - "Community 107"
Cohesion: 0.38
Nodes (7): getCourseLabel(), safeJsonValue(), normalizeEditableOptions(), normalizeCorrectAnswerIds(), hasFieldChanged(), normalizeStringList(), buildComparisonSnapshot()

### Community 91 - "Community 91"
Cohesion: 0.50
Nodes (7): StructuredValue, asObject(), parseValue(), text(), stringList(), matchingSides(), formatManualAnswer()

### Community 93 - "Community 93"
Cohesion: 0.22
Nodes (8): MediaAttachmentType, MediaAttachment, MEDIA_ALLOWED_MIME_TYPES, MEDIA_ACCEPT, MEDIA_MAX_BYTES, validateMediaFile(), uploadMediaFile(), releaseMediaUpload()

### Community 64 - "Community 64"
Cohesion: 0.24
Nodes (8): CalendarView, ScheduleExamItem, HOURS, getEventTone(), getStatusLabel(), toDate(), FlexibleExamCard(), ExamDetailsDialog()

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), UpcomingExam, ExamHistoryItem, StudentCourse, safeLabel(), formatLatestActivityVi(), CourseExamSubmission (+12 more)

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, UseExamAutosaveOptions, getQueueStorageKey(), safeParseQueue(), persistQueue(), loadQueue(), useExamAutosave()

### Community 131 - "Community 131"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 98 - "Community 98"
Cohesion: 0.43
Nodes (7): isLive(), setPendingWebcamStream(), takePendingWebcamStream(), setPendingScreenStream(), takePendingScreenStream(), hasPendingScreenStream(), clearPendingProctoringStreams()

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (12): STATUS_LABELS, normalize(), getUiStatus(), getExamStatusLabel(), getAttemptStatusLabel(), getExamWindowLabel(), formatNumberVi(), formatDurationVi() (+4 more)

### Community 121 - "Community 121"
Cohesion: 0.33
Nodes (5): ExamStatus, Exam, ExamResult, UpcomingExam, ExamHistoryItem

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (6): root, limit, include, ignoredDirectories, exceptions, oversized

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (26): safeEqual(), normalizeCommand(), githubHeaders, getLastRunAgeMs(), triggerDeploy(), getLatestWorkflowRun(), formatBuildStatus(), setFeSubdomainEnabled() (+18 more)

## Knowledge Gaps
- **641 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+636 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 161`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 162`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 163`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `prisma`, `TABLES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 164`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 165`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 166`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 167`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (2 nodes): `topics`, `courses`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (2 nodes): `users`, `auth_sessions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (2 nodes): `question_bank_preferences`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (2 nodes): `anomaly_flags`, `ai_generation_records`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 168`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 169`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 170`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `AdminDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `RolesGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (2 nodes): `PaginationDto`, `PaginatedResult`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `RateLimitGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 171`** (2 nodes): `parseCsvList()`, `bootstrap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `extractUploaderIdFromKey()`, `MediaService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `SubmissionsEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (2 nodes): `DraftGrade`, `AiSuggestion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 8`, `Community 130`, `Community 115`, `Community 145`, `Community 146`, `Community 173`, `Community 131`, `Community 174`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 26` to `Community 30`, `Community 172`, `Community 120`, `Community 100`, `Community 62`, `Community 72`, `Community 82`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 12` to `Community 38`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _641 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06416275430359937 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 29` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._