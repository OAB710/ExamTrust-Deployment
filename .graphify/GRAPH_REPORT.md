# Graph Report - .  (2026-08-14)

## Corpus Check
- Large corpus: 538 files · ~456,384 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2703 nodes · 6965 edges · 144 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 1595 · contains: 1454 · MODIFIES: 1275 · imports_from: 970 · method: 674 · calls: 610 · ON_BRANCH: 170 · PARENT_OF: 115 · references: 79 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: all (source: default-auto)
- Included files: 538 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 1 sensitive · 0 missing committed
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 151 edges
2. `SubmissionsService` - 83 edges
3. `Button` - 67 edges
4. `cn()` - 62 edges
5. `Card` - 54 edges
6. `CardContent` - 54 edges
7. `QuestionsService` - 51 edges
8. `DashboardLayout()` - 48 edges
9. `CardHeader` - 48 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `formatDateTimeVi()` --calls--> `formatDateVi()`  [EXTRACTED]
  FE/src/lib/presentation.ts → FE/src/lib/presentation.ts  _Bridges community 22 → community 31_
- `007a277 Update ZaloBotFeature` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 41 → community 5_
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 1 → community 5_
- `0716f8a Zalo Web Hook` --PARENT_OF--> `3221af2 Merge pull request #2 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 5 → community 32_
- `1098f63 add` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 33 → community 5_

## Communities

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (50): Switch, Props, answerTitles, FillBlankGuide(), QuestionAnswerEditor(), OptionRowProps, QuestionTopicDialog(), GeneratedQuestion (+42 more)

### Community 96 - "Community 96"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (37): prisma, prisma, prisma, prisma, prisma, question_topics, topics, prisma (+29 more)

### Community 134 - "Community 134"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 122 - "Community 122"
Cohesion: 0.60
Nodes (4): prisma, hasColumn(), hasIndex(), main()

### Community 144 - "Community 144"
Cohesion: 0.67
Nodes (1): prisma

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (14): questions, exam_questions, question_versions, submission_answers, tags, question_tags, topics, question_topics (+6 more)

### Community 67 - "Community 67"
Cohesion: 0.45
Nodes (10): courses, users, enrollments, exams, questions, exam_questions, exam_submissions, submission_answers (+2 more)

### Community 123 - "Community 123"
Cohesion: 0.83
Nodes (3): exam_links, exams, exam_link_usages

### Community 141 - "Community 141"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (5): exam_instances, interaction_logs, tab_switch_events, focus_events, anomaly_flags

### Community 94 - "Community 94"
Cohesion: 0.48
Nodes (6): question_versions, questions, question_snapshots, exam_snapshots, exams, exam_question_snapshots

### Community 71 - "Community 71"
Cohesion: 0.36
Nodes (9): exam_questions, question_versions, exam_instances, exams, exam_submissions, interaction_logs, tab_switch_events, focus_events (+1 more)

### Community 112 - "Community 112"
Cohesion: 0.70
Nodes (4): question_drafts, questions, ai_generation_records, question_versions

### Community 82 - "Community 82"
Cohesion: 0.39
Nodes (8): question_statistics, question_versions, questions, exam_submission_regrade_logs, ai_generation_records, users, exam_submissions, submission_answers

### Community 113 - "Community 113"
Cohesion: 0.70
Nodes (4): exam_quality_review_items, ai_generation_records, questions, users

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (48): prisma, roleToPath, demoAccounts, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0aae96f add, 0c12096 Update page.tsx, 0e4348a add (+40 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (16): integrity_reviews, exam_submissions, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, AppModule, nextConfig, iso() (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (26): GenerateQuestionDto, GenerateExamQuestionsDto, SuggestSimilarTopicsDto, CreateQuestionAiImprovementDto, UpdateQuestionAiImprovementDraftDto, ApproveQuestionAiImprovementDto, RejectQuestionAiImprovementDto, VN_FONT_DIR (+18 more)

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (12): integrity_reviews, integrity_review_audits, users, prisma, Fact, CourseBank, banks, RiskFlagDecision (+4 more)

### Community 142 - "Community 142"
Cohesion: 1.33
Nodes (2): users, auth_sessions

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (36): LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto, DeleteProfileDto, LimitConfig, POLICIES, AuthUser (+28 more)

### Community 124 - "Community 124"
Cohesion: 0.83
Nodes (3): score_adjustments, exam_submissions, users

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (28): proctoring_evidence_captures, exam_submissions, exam_instances, users, StartExamDto, RequestEvidenceCaptureDto, FinalizeEvidenceCaptureDto, ReviewEvidenceCaptureDto (+20 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (5): question_bank_preferences, users, DuplicateQuestionCheckDto, UpdateDuplicatePreferenceDto, 1afe093 add

### Community 143 - "Community 143"
Cohesion: 1.00
Nodes (2): anomaly_flags, ai_generation_records

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (18): ExamOverview, MonitoringGroup, SubmissionTimeline, EvidenceCapture, RiskFlag, AnswerMatrix, toLocalDateTimeInput(), groupAnomaliesByStudent() (+10 more)

### Community 151 - "Community 151"
Cohesion: 1.00
Nodes (1): media_storage_usage

### Community 152 - "Community 152"
Cohesion: 1.00
Nodes (1): media_user_storage_usage

### Community 74 - "Community 74"
Cohesion: 0.36
Nodes (9): with, tags, question_tags, questions, question_topics, topics, course_topics, courses (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (18): prisma, students, Question, formatPoints(), parseOptionTexts(), OptionDisplay, parseStoredValue(), optionDisplays() (+10 more)

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (4): prisma, ChoiceQuestion, TopicSeed, topics

### Community 145 - "Community 145"
Cohesion: 0.67
Nodes (1): prisma

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (15): prisma, realisticCourseSections, ChoiceQuestion, questions, students, shuffle(), ensureQuestion(), ensureTopic() (+7 more)

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 136 - "Community 136"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 146 - "Community 146"
Cohesion: 0.67
Nodes (1): prisma

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (7): prisma, BATCH_SIZE, LegacyQuestion, fetchBatch(), processQuestion(), main(), { PrismaClient }

### Community 108 - "Community 108"
Cohesion: 0.73
Nodes (5): request(), requireOk(), pickId(), pollAiJob(), run()

### Community 86 - "Community 86"
Cohesion: 0.47
Nodes (8): percentile(), summarize(), timedRequest(), safeJson(), loginRequest(), runSequential(), runConcurrent(), main()

### Community 147 - "Community 147"
Cohesion: 0.67
Nodes (1): prisma

### Community 125 - "Community 125"
Cohesion: 0.50
Nodes (1): AdminDashboardController

### Community 103 - "Community 103"
Cohesion: 0.47
Nodes (1): AdminDashboardService

### Community 83 - "Community 83"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AISectionValue, AiTaskType, CreateAiJobParams, AiJobsService

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (15): ExamTrustAiUseCase, ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, OllamaGenerationOptions, formatNumber(), stringifyValue(), buildContextLines() (+7 more)

### Community 95 - "Community 95"
Cohesion: 0.43
Nodes (1): AiController

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (2): AiService, OnModuleInit

### Community 114 - "Community 114"
Cohesion: 0.40
Nodes (1): AuditService

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (1): AuthController

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, PerfInterceptor, NestInterceptor, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs() (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (1): AuthService

### Community 117 - "Community 117"
Cohesion: 0.40
Nodes (2): RolesGuard, CanActivate

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (1): JwtStrategy

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (1): CacheService

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (2): PaginationDto, PaginatedResult

### Community 116 - "Community 116"
Cohesion: 0.50
Nodes (2): RateLimitGuard, CanActivate

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (3): IdempotencyStore, IdempotencyMiddleware, NestMiddleware

### Community 115 - "Community 115"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 100 - "Community 100"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 111 - "Community 111"
Cohesion: 0.60
Nodes (5): normalizeIp(), ipToLong(), isIpInCidr(), isIpInAnyCidr(), isValidIpOrCidr()

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (1): CoursesController

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 54 - "Community 54"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 89 - "Community 89"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 126 - "Community 126"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 97 - "Community 97"
Cohesion: 0.29
Nodes (6): CreateExamDto, UpdateExamDto, RescheduleExamDto, AddQuestionsToExamDto, UpdateExamQuestionDto, ShareExamDto

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (15): AUTO_GRADED_TYPES, CopyQuestionBankDto, CreateQuestionCrudDto, UpdateQuestionCrudDto, GradingProcessor, 007a277 Update ZaloBotFeature, 093b6ef Merge pull request #6 from OAB710/main, 28c06f5 Merge pull request #1 from trungducnguyen4/main (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 131 - "Community 131"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 148 - "Community 148"
Cohesion: 1.00
Nodes (2): parseCsvList(), bootstrap()

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (3): CreatePresignedUploadDto, ConfirmMediaUploadDto, ReleaseMediaUploadDto

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (4): MediaAttachmentType, MEDIA_ALLOWED_MIME_TYPES, MEDIA_EXTENSION_BY_MIME, MEDIA_MAX_BYTES

### Community 98 - "Community 98"
Cohesion: 0.29
Nodes (1): MediaController

### Community 155 - "Community 155"
Cohesion: 1.00
Nodes (1): MediaModule

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (3): AuthUser, extractUploaderIdFromKey(), MediaService

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 60 - "Community 60"
Cohesion: 0.15
Nodes (12): QuestionDraftMode, QuestionDraftStepKey, AISection, DraftValidationLevel, DraftPublishMode, CreateQuestionDraftDto, SaveDraftStepDto, AIGenerationConstraintsDto (+4 more)

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (3): ListTopicsQueryDto, CreateTopicDto, SetCourseTopicsDto

### Community 38 - "Community 38"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 107 - "Community 107"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (20): QUESTION_LIMITS, assertQuestionContentLength(), assertExplanationLength(), assertOptionsLength(), assertLineContent(), AuthUser, QuestionAccessRow, DraftRow (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 99 - "Community 99"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 138 - "Community 138"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (1): QueueService

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (3): buildEvidenceStorageKey(), ProctoringEvidenceService, OnModuleInit

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (1): SubmissionsEventsService

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (3): SubmissionsService, OnModuleInit, OnModuleDestroy

### Community 80 - "Community 80"
Cohesion: 0.20
Nodes (1): UsersController

### Community 81 - "Community 81"
Cohesion: 0.22
Nodes (1): UsersService

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (8): { PrismaClient }, prisma, mocks, mocks, mocks, courses, mocks, 2d105be Convert FE from embedded repository to regular folder

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): DataPaginationProps, DataPagination(), ActiveFilterChipsProps, ActiveFilterChips(), FilterPanel(), ListPageHeaderProps, ListPageHeader(), SearchBarProps (+33 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (16): DashboardLayout(), Card, CardHeader, CardDescription, CardContent, CardFooter, StatusBadge, AuditLog (+8 more)

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (4): ExamQuestion, ExamData, getOptionEntries(), getCorrectAnswerText()

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): metadata, Providers(), ToasterProps, Toaster(), ToastViewport, toastVariants, Toast, ToastAction (+33 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (32): CourseTerm, AnalyticsCourseInfo, ExamOption, sortExamsForAnalytics(), pickDefaultAnalyticsExamId(), AiImprovementStatus, AiImprovementSummary, AiImprovementDetail (+24 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (37): Command, CommandList, CommandEmpty, CommandGroup, CommandItem, PopoverContent, mocks, Step (+29 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (16): HelpContent, ContextHelpProps, isHelpContent(), HelpBody(), HelpButton, useTouchHelpMode(), ContextHelp(), HelpedTitle() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (21): themes, ThemeToggle(), NavItem, studentNavItems, lecturerNavItems, adminNavItems, DashboardLayoutProps, Header() (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (27): ExamSecurityModal(), QuestionRenderer(), DuringReviewFeedback, PendingIntegrityEvent, QType, BaseQ, SingleChoiceQ, MultiChoiceQ (+19 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (20): CalendarView, ScheduleExamItem, HOURS, getEventTone(), getStatusLabel(), toDate(), FlexibleExamCard(), ExamDetailsDialog() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (30): NavLinkBaseProps, NavLinkCompatProps, NavLink, MetricCardProps, AccordionItem, AccordionTrigger, AccordionContent, AvatarImage (+22 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (25): AdminPageShellProps, AdminPageShell(), FilterPanelProps, Input, labelVariants, Label, SelectTrigger, SelectScrollUpButton (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (37): AdminStatCardProps, AdminStatCard(), ConfirmActionDialogProps, ConfirmActionDialog(), AlertDialogOverlay, AlertDialogContent, AlertDialogHeader(), AlertDialogFooter() (+29 more)

### Community 58 - "Community 58"
Cohesion: 0.18
Nodes (9): IntegrityCaseDetailProps, IntegrityTimelineEvent, EvidenceCapture, IntegrityCaseDetail(), Checkbox, FlaggedSubmission, IntegrityReason, GeneratedQuestion (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (24): ButtonVariant, ButtonSize, BackToDashboardButtonProps, BackToDashboardButton(), alertVariants, Alert, AlertTitle, AlertDescription (+16 more)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeaderProps, PageHeader(), ThemeMode, StatusTone, UiStatus, PageAction, EmptyStateProps (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (15): TextFilterOperator, ListFilterOption, TextFilterValue, NumberRangeValue, DateRangeValue, FilterValue, FilterValues, FilterDefinition (+7 more)

### Community 78 - "Community 78"
Cohesion: 0.20
Nodes (4): ButtonProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 57 - "Community 57"
Cohesion: 0.14
Nodes (12): CarouselApi, UseCarouselParameters, CarouselOptions, CarouselPlugin, CarouselProps, CarouselContextProps, CarouselContext, Carousel (+4 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (7): THEMES, ChartConfig, ChartContextProps, ChartContext, ChartContainer, ChartTooltipContent, ChartLegendContent

### Community 101 - "Community 101"
Cohesion: 0.29
Nodes (4): CommandDialogProps, DialogProps, CommandInput, CommandSeparator

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (8): ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator

### Community 92 - "Community 92"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerOverlay, DrawerContent, DrawerHeader(), DrawerFooter(), DrawerTitle, DrawerDescription

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (17): DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, TabsList, TabsTrigger, TabsContent (+9 more)

### Community 65 - "Community 65"
Cohesion: 0.17
Nodes (9): FormFieldContextValue, FormFieldContext, FormItemContextValue, FormItemContext, FormItem, FormLabel, FormControl, FormDescription (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (10): Menubar, MenubarTrigger, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem (+2 more)

### Community 93 - "Community 93"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuList, navigationMenuTriggerStyle, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (33): SheetOverlay, sheetVariants, SheetContentProps, SheetContent, SheetTitle, SheetDescription, SidebarContext, SidebarProvider (+25 more)

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (18): statusBadgeVariants, StatusBadgeTone, LegacyStatusBadgeVariant, StatusBadgeDomain, StatusBadgeMapEntry, STATUS_BADGE_MAP, normalizeStatusKey(), toTitleCase() (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (29): Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption (+21 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (28): isPlainObject(), canonicalize(), canonicalStringify(), hashObject(), Snapshot, hashJson(), chooseStrategy(), generateExam() (+20 more)

### Community 88 - "Community 88"
Cohesion: 0.29
Nodes (5): StructuralLayer, OrderingLayer, ReferenceBinding, RenderingContract, CLIENT_RENDERING_RULES

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ShuffleStrategy, StrictNoShuffle, DefaultFlexible, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (24): Course, APICourse, CourseExamPreview, courseGradientClasses, StudentSearchResult, EnrollResult, ImportedStudent, toAsciiUpper() (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (35): safeParseJson(), normalizeOptions(), normalizeCorrectAnswer(), formatDateSafe(), NO_OPTIONS_TYPES, parseMatchingPairs(), parseOrderingItems(), parseMatchingAnswers() (+27 more)

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (7): AttentionPriority, LecturerAttentionSummary, LecturerAttentionResponse, AttentionItemData, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (7): StructuredValue, asObject(), parseValue(), text(), stringList(), matchingSides(), formatManualAnswer()

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), UpcomingExam, ExamHistoryItem, StudentCourse, safeLabel(), formatLatestActivityVi(), CourseExamSubmission (+12 more)

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, UseExamAutosaveOptions, getQueueStorageKey(), safeParseQueue(), persistQueue(), loadQueue(), useExamAutosave()

### Community 119 - "Community 119"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (5): ExamStatus, Exam, ExamResult, UpcomingExam, ExamHistoryItem

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (6): root, limit, include, ignoredDirectories, exceptions, oversized

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (23): safeEqual(), normalizeCommand(), githubHeaders, getLastRunAgeMs(), triggerDeploy(), getLatestWorkflowRun(), formatBuildStatus(), setFeSubdomainEnabled() (+15 more)

## Knowledge Gaps
- **618 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+613 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 134`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (2 nodes): `users`, `auth_sessions`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (2 nodes): `anomaly_flags`, `ai_generation_records`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `media_storage_usage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `media_user_storage_usage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `AdminDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `RolesGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `JwtStrategy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `PaginationDto`, `PaginatedResult`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (2 nodes): `RateLimitGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `CoursesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `parseCsvList()`, `bootstrap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `MediaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `SubmissionsEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 32`, `Community 118`, `Community 105`, `Community 132`, `Community 133`, `Community 153`, `Community 119`, `Community 154`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 25` to `Community 26`, `Community 150`, `Community 109`, `Community 91`, `Community 63`, `Community 69`, `Community 77`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 9` to `Community 28`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _618 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.053830227743271224 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.01922731356693621 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.07879428873611846 - nodes in this community are weakly interconnected._