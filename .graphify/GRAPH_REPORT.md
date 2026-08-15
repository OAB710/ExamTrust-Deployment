# Graph Report - .  (2026-08-15)

## Corpus Check
- Large corpus: 563 files · ~515,046 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2774 nodes · 7458 edges · 153 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 1628 · MODIFIES: 1599 · contains: 1482 · imports_from: 993 · method: 674 · calls: 616 · ON_BRANCH: 206 · PARENT_OF: 158 · references: 79 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 563 · Candidates: 620
- Excluded: 4 untracked · 104972 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `ff263a0`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 151 edges
2. `SubmissionsService` - 83 edges
3. `Button` - 69 edges
4. `cn()` - 63 edges
5. `Card` - 54 edges
6. `CardContent` - 54 edges
7. `QuestionsService` - 51 edges
8. `DashboardLayout()` - 48 edges
9. `CardHeader` - 48 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `01349dc Merge pull request #18 from OAB710/main` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 16 → community 2_
- `01349dc Merge pull request #18 from OAB710/main` --PARENT_OF--> `8c0dd0a Phân tích học sinh chủ yếu chỉ chọn cái nào chỉ hiện đáp án trắc n0 thôi, phải đa dạng`  [EXTRACTED]
  git → git  _Bridges community 16 → community 6_
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 3 → community 2_
- `03ff58a Xóa mail serivce` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 23 → community 2_
- `03ff58a Xóa mail serivce` --PARENT_OF--> `4b5580c Sửa điểm -> trọng số`  [EXTRACTED]
  git → git  _Bridges community 23 → community 6_

## Communities

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (30): Switch, Props, answerTitles, FillBlankGuide(), QuestionAnswerEditor(), OptionRowProps, QuestionTopicDialog(), GeneratedQuestion (+22 more)

### Community 99 - "Community 99"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 151 - "Community 151"
Cohesion: 0.67
Nodes (1): prisma

### Community 152 - "Community 152"
Cohesion: 0.67
Nodes (1): prisma

### Community 153 - "Community 153"
Cohesion: 0.67
Nodes (1): prisma

### Community 154 - "Community 154"
Cohesion: 0.67
Nodes (1): prisma

### Community 67 - "Community 67"
Cohesion: 0.26
Nodes (6): prisma, TABLES, AuthPageShell(), 9a409bb Stop tracking CodeGraph daemon PID and Claude Code worktrees, d78391f Redesign login page, add student registration, sync brand mark, ff263a0 Merge pull request #20 from OAB710/main

### Community 155 - "Community 155"
Cohesion: 0.67
Nodes (1): prisma

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (22): question_topics, topics, AiWorkerModule, AuditModule, AuthModule, JwtAuthGuard, CacheModule, CoursesModule (+14 more)

### Community 156 - "Community 156"
Cohesion: 0.67
Nodes (1): prisma

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 125 - "Community 125"
Cohesion: 0.60
Nodes (4): prisma, hasColumn(), hasIndex(), main()

### Community 157 - "Community 157"
Cohesion: 0.67
Nodes (1): prisma

### Community 158 - "Community 158"
Cohesion: 0.67
Nodes (1): prisma

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (14): questions, exam_questions, question_versions, submission_answers, tags, question_tags, topics, question_topics (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.45
Nodes (10): courses, users, enrollments, exams, questions, exam_questions, exam_submissions, submission_answers (+2 more)

### Community 126 - "Community 126"
Cohesion: 0.83
Nodes (3): exam_links, exams, exam_link_usages

### Community 143 - "Community 143"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 144 - "Community 144"
Cohesion: 1.00
Nodes (2): topics, courses

### Community 103 - "Community 103"
Cohesion: 0.33
Nodes (5): exam_instances, interaction_logs, tab_switch_events, focus_events, anomaly_flags

### Community 98 - "Community 98"
Cohesion: 0.48
Nodes (6): question_versions, questions, question_snapshots, exam_snapshots, exams, exam_question_snapshots

### Community 79 - "Community 79"
Cohesion: 0.36
Nodes (9): exam_questions, question_versions, exam_instances, exams, exam_submissions, interaction_logs, tab_switch_events, focus_events (+1 more)

### Community 115 - "Community 115"
Cohesion: 0.70
Nodes (4): question_drafts, questions, ai_generation_records, question_versions

### Community 145 - "Community 145"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 87 - "Community 87"
Cohesion: 0.39
Nodes (8): question_statistics, question_versions, questions, exam_submission_regrade_logs, ai_generation_records, users, exam_submissions, submission_answers

### Community 116 - "Community 116"
Cohesion: 0.70
Nodes (4): exam_quality_review_items, ai_generation_records, questions, users

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (58): prisma, AiModule, demoAccounts, 007a277 Update ZaloBotFeature, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0aae96f add, 0c12096 Update page.tsx (+50 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (42): LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto, DeleteProfileDto, LimitConfig, POLICIES, AuthUser (+34 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (22): integrity_reviews, exam_submissions, AdminDashboardController, AdminDashboardModule, COMPLETED, ZALO_BOT_COMMANDS, AppModule, RiskFlagDecision (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (31): ExamTrustAiUseCase, ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, OllamaGenerationOptions, formatNumber(), stringifyValue(), buildContextLines() (+23 more)

### Community 127 - "Community 127"
Cohesion: 1.00
Nodes (3): integrity_reviews, integrity_review_audits, users

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (8): users, auth_sessions, score_adjustments, exam_submissions, users, parseCsvList(), bootstrap(), b27133b add

### Community 117 - "Community 117"
Cohesion: 0.70
Nodes (4): proctoring_evidence_captures, exam_submissions, exam_instances, users

### Community 17 - "Community 17"
Cohesion: 0.06
Nodes (32): prisma, students, QUESTION_LIMITS, assertQuestionContentLength(), assertExplanationLength(), assertOptionsLength(), assertLineContent(), AuthUser (+24 more)

### Community 146 - "Community 146"
Cohesion: 1.00
Nodes (2): question_bank_preferences, users

### Community 147 - "Community 147"
Cohesion: 1.00
Nodes (2): anomaly_flags, ai_generation_records

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (19): prisma, Fact, CourseBank, banks, Question, formatPoints(), parseOptionTexts(), OptionDisplay (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (19): media_storage_usage, media_user_storage_usage, CreatePresignedUploadDto, ConfirmMediaUploadDto, ReleaseMediaUploadDto, MediaAttachmentType, MEDIA_ALLOWED_MIME_TYPES, MEDIA_EXTENSION_BY_MIME (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.08
Nodes (30): INTEGRITY_EVENT_LABELS, getIntegrityEventLabel(), IntegrityEventCategory, getIntegrityEventCategory(), getIntegrityEventSeverity(), VN_FONT_DIR, VN_FONT_REGULAR, VN_FONT_BOLD (+22 more)

### Community 80 - "Community 80"
Cohesion: 0.36
Nodes (9): with, tags, question_tags, questions, question_topics, topics, course_topics, courses (+1 more)

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (4): prisma, ChoiceQuestion, TopicSeed, topics

### Community 159 - "Community 159"
Cohesion: 0.67
Nodes (1): prisma

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (17): prisma, students, lecturers, seedQuestions, main(), realisticCourseSections, ChoiceQuestion, questions (+9 more)

### Community 136 - "Community 136"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 160 - "Community 160"
Cohesion: 0.67
Nodes (1): prisma

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (7): prisma, BATCH_SIZE, LegacyQuestion, fetchBatch(), processQuestion(), main(), { PrismaClient }

### Community 111 - "Community 111"
Cohesion: 0.73
Nodes (5): request(), requireOk(), pickId(), pollAiJob(), run()

### Community 91 - "Community 91"
Cohesion: 0.47
Nodes (8): percentile(), summarize(), timedRequest(), safeJson(), loginRequest(), runSequential(), runConcurrent(), main()

### Community 161 - "Community 161"
Cohesion: 0.67
Nodes (1): prisma

### Community 104 - "Community 104"
Cohesion: 0.47
Nodes (1): AdminDashboardService

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AISectionValue, AiTaskType, CreateAiJobParams, AiJobsService

### Community 148 - "Community 148"
Cohesion: 0.67
Nodes (1): AiStatusController

### Community 105 - "Community 105"
Cohesion: 0.53
Nodes (1): AiController

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (2): AiService, OnModuleInit

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (1): AuditController

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (1): AuditService

### Community 42 - "Community 42"
Cohesion: 0.16
Nodes (1): AuthController

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, PerfInterceptor, NestInterceptor, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs() (+6 more)

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (1): AuthService

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (2): RolesGuard, CanActivate

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (1): JwtStrategy

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (1): CacheService

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (2): PaginationDto, PaginatedResult

### Community 120 - "Community 120"
Cohesion: 0.50
Nodes (2): RateLimitGuard, CanActivate

### Community 124 - "Community 124"
Cohesion: 0.40
Nodes (3): IdempotencyStore, IdempotencyMiddleware, NestMiddleware

### Community 119 - "Community 119"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 101 - "Community 101"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 114 - "Community 114"
Cohesion: 0.60
Nodes (5): normalizeIp(), ipToLong(), isIpInCidr(), isIpInAnyCidr(), isValidIpOrCidr()

### Community 68 - "Community 68"
Cohesion: 0.17
Nodes (1): CoursesController

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 93 - "Community 93"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 89 - "Community 89"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (45): CreateExamDto, UpdateExamDto, RescheduleExamDto, AddQuestionsToExamDto, UpdateExamQuestionDto, ExamsModule, LecturerDashboardService, CourseTerm (+37 more)

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (11): AUTO_GRADED_TYPES, CopyQuestionBankDto, CreateQuestionCrudDto, UpdateQuestionCrudDto, GradingProcessor, 093b6ef Merge pull request #6 from OAB710/main, 28c06f5 Merge pull request #1 from trungducnguyen4/main, 36549ac AI GEN QUES (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (2): LecturerAttentionItemDto, LecturerAttentionResponseDto

### Community 132 - "Community 132"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 108 - "Community 108"
Cohesion: 0.33
Nodes (1): MediaController

### Community 75 - "Community 75"
Cohesion: 0.29
Nodes (2): extractUploaderIdFromKey(), MediaService

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 62 - "Community 62"
Cohesion: 0.15
Nodes (12): QuestionDraftMode, QuestionDraftStepKey, AISection, DraftValidationLevel, DraftPublishMode, CreateQuestionDraftDto, SaveDraftStepDto, AIGenerationConstraintsDto (+4 more)

### Community 150 - "Community 150"
Cohesion: 0.67
Nodes (2): DuplicateQuestionCheckDto, UpdateDuplicatePreferenceDto

### Community 131 - "Community 131"
Cohesion: 0.50
Nodes (3): ListTopicsQueryDto, CreateTopicDto, SetCourseTopicsDto

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 100 - "Community 100"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 138 - "Community 138"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 81 - "Community 81"
Cohesion: 0.24
Nodes (1): QueueService

### Community 48 - "Community 48"
Cohesion: 0.12
Nodes (16): StartExamDto, RequestEvidenceCaptureDto, FinalizeEvidenceCaptureDto, ReviewEvidenceCaptureDto, SubmitAnswerDto, SubmitExamDto, AutosaveAnswerDto, AutosaveExamDto (+8 more)

### Community 82 - "Community 82"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 52 - "Community 52"
Cohesion: 0.16
Nodes (3): buildEvidenceStorageKey(), ProctoringEvidenceService, OnModuleInit

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (1): SubmissionsEventsService

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (3): SubmissionsService, OnModuleInit, OnModuleDestroy

### Community 85 - "Community 85"
Cohesion: 0.20
Nodes (1): UsersController

### Community 86 - "Community 86"
Cohesion: 0.22
Nodes (1): UsersService

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (8): { PrismaClient }, prisma, mocks, mocks, mocks, courses, mocks, 2d105be Convert FE from embedded repository to regular folder

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (40): DataPaginationProps, DataPagination(), ActiveFilterChipsProps, ActiveFilterChips(), FilterPanel(), ListPageHeaderProps, ListPageHeader(), SearchBarProps (+32 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (11): Alert, AlertDescription, CardDescription, Input, labelVariants, Label, ExamQuestion, ExamData (+3 more)

### Community 73 - "Community 73"
Cohesion: 0.22
Nodes (6): metadata, Providers(), ToasterProps, Toaster(), Toaster(), AuthProvider()

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (45): Command, CommandList, CommandEmpty, CommandGroup, CommandItem, PopoverContent, mocks, Step (+37 more)

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (4): Header(), roleToPath, capabilityGroups, operatingPrinciples

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (35): ExamSecurityModal(), LiveClock(), QuestionRenderer(), DuringReviewFeedback, PendingIntegrityEvent, QType, BaseQ, SingleChoiceQ (+27 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (30): NavLinkBaseProps, NavLinkCompatProps, NavLink, MetricCardProps, AccordionItem, AccordionTrigger, AccordionContent, alertVariants (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (42): AdminPageShellProps, AdminPageShell(), AdminStatCardProps, AdminStatCard(), ConfirmActionDialogProps, ConfirmActionDialog(), AlertDialogOverlay, AlertDialogContent (+34 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (33): IntegrityCaseDetailProps, IntegrityTimelineEvent, EvidenceCapture, EVIDENCE_SIGNAL_LABELS, getEvidenceEventLabel(), IntegrityCaseDetail(), Card, CardHeader (+25 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (17): ButtonVariant, ButtonSize, BackToDashboardButtonProps, BackToDashboardButton(), NavItem, studentNavItems, lecturerNavItems, adminNavItems (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (32): HelpContent, ContextHelpProps, isHelpContent(), HelpBody(), HelpButton, useTouchHelpMode(), ContextHelp(), HelpedTitle() (+24 more)

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeaderProps, PageHeader(), ThemeMode, StatusTone, UiStatus, PageAction, EmptyStateProps (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (12): violationLabels, ExamSecurityModalProps, ViolationType, FirstViolationNotice, ViolationLog, UseExamSecurityOptions, UseExamSecurityResult, emptyCounts (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (20): themes, ThemeToggle(), DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (42): FilterPanelProps, FilterValues, FilterDefinition, safeParseJson(), normalizeOptions(), normalizeCorrectAnswer(), formatDateSafe(), NO_OPTIONS_TYPES (+34 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (8): TextFilterOperator, ListFilterOption, TextFilterValue, NumberRangeValue, DateRangeValue, FilterValue, FilterChip, getFilterChips()

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (11): Button, iso(), rangeFor(), Exam, CourseSummary, QuestionItem, QuestionBankSummary, questionTypeLabels (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (6): buttonVariants, ButtonProps, CalendarProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (12): CarouselApi, UseCarouselParameters, CarouselOptions, CarouselPlugin, CarouselProps, CarouselContextProps, CarouselContext, Carousel (+4 more)

### Community 77 - "Community 77"
Cohesion: 0.18
Nodes (7): THEMES, ChartConfig, ChartContextProps, ChartContext, ChartContainer, ChartTooltipContent, ChartLegendContent

### Community 102 - "Community 102"
Cohesion: 0.29
Nodes (4): CommandDialogProps, DialogProps, CommandInput, CommandSeparator

### Community 84 - "Community 84"
Cohesion: 0.20
Nodes (8): ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator

### Community 49 - "Community 49"
Cohesion: 0.13
Nodes (11): DialogTitle, ExamOverview, MonitoringGroup, SubmissionTimeline, EvidenceCapture, RiskFlag, AnswerMatrix, toLocalDateTimeInput() (+3 more)

### Community 96 - "Community 96"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerOverlay, DrawerContent, DrawerHeader(), DrawerFooter(), DrawerTitle, DrawerDescription

### Community 70 - "Community 70"
Cohesion: 0.17
Nodes (9): FormFieldContextValue, FormFieldContext, FormItemContextValue, FormItemContext, FormItem, FormLabel, FormControl, FormDescription (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.17
Nodes (10): Menubar, MenubarTrigger, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem (+2 more)

### Community 97 - "Community 97"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuList, navigationMenuTriggerStyle, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (33): SheetOverlay, sheetVariants, SheetContentProps, SheetContent, SheetTitle, SheetDescription, SidebarContext, SidebarProvider (+25 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (18): statusBadgeVariants, StatusBadgeTone, LegacyStatusBadgeVariant, StatusBadgeDomain, StatusBadgeMapEntry, STATUS_BADGE_MAP, normalizeStatusKey(), toTitleCase() (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (40): Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption (+32 more)

### Community 78 - "Community 78"
Cohesion: 0.27
Nodes (9): ToastViewport, toastVariants, Toast, ToastAction, ToastClose, ToastTitle, ToastDescription, ToastProps (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (14): ToasterToast, actionTypes, genId(), ActionType, Action, State, toastTimeouts, addToRemoveQueue() (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (12): AuthContextType, AuthState, AuthContext, enabledValues, isPerfLogEnabled(), nowMs(), elapsedMs(), logPerf() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (28): isPlainObject(), canonicalize(), canonicalStringify(), hashObject(), Snapshot, hashJson(), chooseStrategy(), generateExam() (+20 more)

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (5): StructuralLayer, OrderingLayer, ReferenceBinding, RenderingContract, CLIENT_RENDERING_RULES

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ShuffleStrategy, StrictNoShuffle, DefaultFlexible, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (20): Student, Enrollment, Course, CourseExamSummary, StudentExamPerformance, StudentCoursePerformance, CourseExam, ExamSubmission (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (10): DraftGrade, AiSuggestion, AttentionPriority, LecturerAttentionSummary, LecturerAttentionResponse, AttentionItemData, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER (+2 more)

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (7): StructuredValue, asObject(), parseValue(), text(), stringList(), matchingSides(), formatManualAnswer()

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (8): CalendarView, ScheduleExamItem, HOURS, getEventTone(), getStatusLabel(), toDate(), FlexibleExamCard(), ExamDetailsDialog()

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), UpcomingExam, ExamHistoryItem, StudentCourse, safeLabel(), formatLatestActivityVi(), CourseExamSubmission (+12 more)

### Community 123 - "Community 123"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (12): STATUS_LABELS, normalize(), getUiStatus(), getExamStatusLabel(), getAttemptStatusLabel(), getExamWindowLabel(), formatNumberVi(), formatDurationVi() (+4 more)

### Community 113 - "Community 113"
Cohesion: 0.33
Nodes (5): ExamStatus, Exam, ExamResult, UpcomingExam, ExamHistoryItem

### Community 94 - "Community 94"
Cohesion: 0.25
Nodes (6): root, limit, include, ignoredDirectories, exceptions, oversized

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (23): safeEqual(), normalizeCommand(), githubHeaders, getLastRunAgeMs(), triggerDeploy(), getLatestWorkflowRun(), formatBuildStatus(), setFeSubdomainEnabled() (+15 more)

## Knowledge Gaps
- **627 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+622 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 151`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (2 nodes): `topics`, `courses`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (2 nodes): `question_bank_preferences`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `anomaly_flags`, `ai_generation_records`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 160`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 161`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `AiStatusController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 105`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (2 nodes): `RolesGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `JwtStrategy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (2 nodes): `PaginationDto`, `PaginatedResult`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (2 nodes): `RateLimitGuard`, `CanActivate`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `CoursesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (2 nodes): `LecturerAttentionItemDto`, `LecturerAttentionResponseDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `extractUploaderIdFromKey()`, `MediaService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (2 nodes): `DuplicateQuestionCheckDto`, `UpdateDuplicatePreferenceDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `SubmissionsEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 40`, `Community 122`, `Community 107`, `Community 133`, `Community 134`, `Community 163`, `Community 123`, `Community 164`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 24` to `Community 23`, `Community 162`, `Community 112`, `Community 95`, `Community 64`, `Community 76`, `Community 83`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 13` to `Community 17`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _627 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 18` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.029411764705882353 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07502131287297528 - nodes in this community are weakly interconnected._