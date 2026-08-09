# Graph Report - .  (2026-08-09)

## Corpus Check
- Large corpus: 530 files · ~453,426 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2550 nodes · 6427 edges · 155 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 1517 · contains: 1376 · MODIFIES: 1055 · imports_from: 944 · method: 625 · calls: 551 · ON_BRANCH: 158 · PARENT_OF: 99 · references: 79 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 530 · Candidates: 586
- Excluded: 0 untracked · 99705 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `2701bbc`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 142 edges
2. `SubmissionsService` - 66 edges
3. `Button` - 66 edges
4. `cn()` - 63 edges
5. `Card` - 54 edges
6. `CardContent` - 54 edges
7. `QuestionsService` - 50 edges
8. `DashboardLayout()` - 48 edges
9. `CardHeader` - 48 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 3 → community 4_
- `093b6ef Merge pull request #6 from OAB710/main` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 31 → community 4_
- `0aae96f add` --PARENT_OF--> `0e4348a add`  [EXTRACTED]
  git → git  _Bridges community 4 → community 47_
- `13dcbd7 add` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 9 → community 4_
- `16c91ec add` --PARENT_OF--> `b8349a8 refactor code căng`  [EXTRACTED]
  git → git  _Bridges community 4 → community 33_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (59): BackendRole, BackendStatus, EMPTY_CREATE_FORM, EMPTY_EDIT_FORM, EMPTY_FILTERS, USER_FILTERS, UserForm, UserRow (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (51): iso(), rangeFor(), Exam, Submission, User, AdminStatCard(), AdminStatCardProps, BackToDashboardButton() (+43 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (28): AuditModule, AuthModule, CacheModule, 0391dc3 mang project tu repo cu qua, CoursesModule, CourseTerm, CreateCourseDto, CreateUserDto (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (54): AiModule, duc, main, 007a277 Update ZaloBotFeature, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0aae96f add, 0c12096 Update page.tsx (+46 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (42): AuditLog, BulkStudentImport(), BulkStudentImportProps, COLUMN_ALIASES, ImportResult, ImportState, ParsedRow, ValidatedData (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (7): 2d105be Convert FE from embedded repository to regular folder, prisma, { PrismaClient }, mocks, mocks, courses, mocks

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (36): AdminPageShell(), AdminPageShellProps, EMPTY_FILTERS, Exam, REVIEW_COPY, SEVERITY_COPY, Suggestion, ExamItem (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (36): canonicalize(), canonicalStringify(), hashObject(), isPlainObject(), chooseStrategy(), generateExam(), hashJson(), hashStringToNumber() (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (27): AI_SECTIONS, AISectionValue, AiTaskType, CreateAiJobParams, 13dcbd7 add, 222b35a add, 2701bbc add, 67f04b6 add (+19 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (32): ExamSecurityModal(), ExamSecurityModalProps, violationLabels, emptyCounts, useExamSecurity(), UseExamSecurityOptions, UseExamSecurityResult, ViolationLog (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (37): { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, buildToken(), CourseForm, CourseItem, defaultForm, EMPTY_FILTERS, EnrollResult (+29 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (26): ContextHelp(), ContextHelpProps, HelpBody(), HelpButton, HelpContent, isHelpContent(), useTouchHelpMode(), MetricCardProps (+18 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (28): ExamData, ExamQuestion, getCorrectAnswerText(), getOptionEntries(), EvidenceCapture, ExamOverview, RiskFlag, SubmissionTimeline (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (30): AiImprovementDetail, AiImprovementStatus, AiImprovementSummary, AnalyticsCourseInfo, buildComparisonSnapshot(), COMPARISON_FIELDS, ComparisonFieldKey, CourseTerm (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (35): BankQuestionOption, BankTopic, buildReviewSettingsPayload(), CourseOption, createDefaultForm(), createDefaultReviewSettingsDraft(), DIFFICULTY_LABEL_VI, difficultyLabelFromValue() (+27 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (33): useIsMobile(), SheetContent, SheetContentProps, SheetDescription, SheetOverlay, SheetTitle, sheetVariants, Sidebar (+25 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (14): exam_submissions, integrity_reviews, copy, AdminDashboardController, AdminDashboardModule, COMPLETED, a4ea817 Merge pull request #4 from trungducnguyen4/duc, f4e10e9 add (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (22): buildContextLines(), buildExamTrustPromptHeader(), ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, ExamTrustAiUseCase, formatNumber(), getOllamaGenerationOptions() (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (3): OnModuleDestroy, OnModuleInit, SubmissionsService

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (22): IntegrityCaseDetail(), IntegrityCaseDetailProps, IntegrityTimelineEvent, EMPTY_FILTERS, EMPTY_PATTERNS, EMPTY_STATS, FlaggedSubmission, IntegrityCasesResponse (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (15): AttentionSection(), PRIORITY_STYLES, AttentionItemData, AttentionPriority, LecturerAttentionResponse, LecturerAttentionSummary, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (17): answerTitles, FillBlankGuide(), OptionRowProps, Props, QuestionAnswerEditor(), QuestionTopicDialog(), backendTypeByEditorType, BuildPayloadParams (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (21): QuestionBankCourse, useQuestionBankData(), Params, useQuestionBankRouteState(), courseFilterDefinitions, difficultyOptions, EMPTY_COURSE_FILTERS, EMPTY_QUESTION_FILTERS (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (2): AiService, OnModuleInit

### Community 28 - "Community 28"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, NestInterceptor, PerfInterceptor, OnModuleDestroy, OnModuleInit, { PrismaClient }, PrismaService (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (19): completedStatuses, useStudentDashboardData(), COMPLETED_STATUSES, CourseExamAction, CourseExamForAction, CourseExamSubmission, ExamDisplayState, getCourseExamAction() (+11 more)

### Community 31 - "Community 31"
Cohesion: 0.16
Nodes (12): 093b6ef Merge pull request #6 from OAB710/main, 28c06f5 Merge pull request #1 from trungducnguyen4/main, 36549ac AI GEN QUES, 9d34aad Merge branch 'main' into duc, f5fcba9 Merge pull request #5 from OAB710/main, f609787 feat(student): add exam schedule endpoint and student schedule page, CopyQuestionBankDto, CreateQuestionCrudDto (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (12): b8349a8 refactor code căng, EditorQuestionType, useQuestionAnswerState(), useQuestionPersistence(), Params, TopicSuggestion, useQuestionTopics(), CorrectAnswerPayload (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.24
Nodes (19): buildBeInfoText(), buildFeInfoText(), buildPublicInfoText(), cfGraphQL(), formatBuildStatus(), getAiStatus(), getFeSubdomainEnabled(), getLastRunAgeMs() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (1): AuthService

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (16): integrity_review_audits, integrity_reviews, users, 50768bd Merge pull request #11 from trungducnguyen4/duc, 95cd9ce add, AUTO_GRADED_TYPES, AutosaveAnswerMeta, DuringReviewFeedback (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (1): AuthController

### Community 38 - "Community 38"
Cohesion: 0.13
Nodes (16): 563dc34 Merge pull request #3 from trungducnguyen4/duc, f4c84b8 add, AddLogsDto, AutosaveAnswerDto, AutosaveExamDto, CreateScoreAdjustmentDto, FinalizeEvidenceCaptureDto, GradeAnswerDto (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (12): AuthContext, AuthContextType, AuthState, elapsedMs(), enabledValues, isPerfLogEnabled(), logPerf(), nowMs() (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (12): themes, ThemeToggle(), Avatar, AvatarFallback, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (14): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.23
Nodes (14): formatAttemptLimitVi(), formatDateTimeVi(), formatDateVi(), formatDurationVi(), formatNumberVi(), formatPercentVi(), formatScoreVi(), getAttemptStatusLabel() (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (15): ChoiceQuestion, ensureAnswer(), ensureExam(), ensureExamInstance(), ensureExamQuestion(), ensureExamSnapshot(), ensureQuestion(), ensureSubmission() (+7 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (8): metadata, Providers(), AuthProvider(), THEME_OPTIONS, THEME_PROVIDER_OPTIONS, Toaster(), ToasterProps, Toaster()

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (14): ai_generation_records, course_topics, courses, exam_questions, question_course_scopes, question_drafts, question_tags, question_topics (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (6): 0e4348a add, 1ea6b35 add, b9a4c06 add, AuthUser, AuthUser, SubmissionsModule

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 50 - "Community 50"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 51 - "Community 51"
Cohesion: 0.19
Nodes (2): OnModuleInit, ProctoringEvidenceService

### Community 52 - "Community 52"
Cohesion: 0.14
Nodes (6): ButtonProps, buttonVariants, CalendarProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeader(), PageHeaderProps, EmptyStateProps, PageAction, ResponsiveColumn, StatusTone, ThemeMode (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (12): AIGenerateSectionDto, AIGenerationConstraintsDto, AISection, ApplyAICandidateDto, CreateQuestionDraftDto, DraftPublishMode, DraftValidationLevel, PublishQuestionDraftDto (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (7): BATCH_SIZE, fetchBatch(), LegacyQuestion, main(), prisma, { PrismaClient }, processQuestion()

### Community 57 - "Community 57"
Cohesion: 0.23
Nodes (3): ExamRiskAssessmentService, RequestUser, REUSABLE_JOB_STATUSES

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (1): CoursesController

### Community 59 - "Community 59"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.17
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.45
Nodes (10): courses, enrollments, exam_questions, exam_submissions, exams, integrity_logs, proctoring_sessions, questions (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.20
Nodes (1): CacheService

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (9): ConfirmActionDialogProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.24
Nodes (9): GeneratedQuestion, Params, typeMap, useQuestionAiGeneration(), DEFAULT_QUESTION_OPTIONS, findMostSimilarQuestion(), normalizeQuestionText(), questionTextSimilarity() (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 66 - "Community 66"
Cohesion: 0.27
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 67 - "Community 67"
Cohesion: 0.20
Nodes (1): UsersService

### Community 68 - "Community 68"
Cohesion: 0.36
Nodes (9): anomaly_flags, exam_instances, exam_questions, exam_submissions, exams, focus_events, interaction_logs, question_versions (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, getQueueStorageKey(), loadQueue(), persistQueue(), safeParseQueue(), useExamAutosave(), UseExamAutosaveOptions

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (9): course_topics, courses, exist, question_tags, question_topics, questions, tags, topics (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (1): QueueService

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (8): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubContent, ContextMenuSubTrigger

### Community 73 - "Community 73"
Cohesion: 0.20
Nodes (1): UsersController

### Community 74 - "Community 74"
Cohesion: 0.39
Nodes (8): ai_generation_records, exam_submission_regrade_logs, exam_submissions, question_statistics, question_versions, questions, submission_answers, users

### Community 75 - "Community 75"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (7): asObject(), formatManualAnswer(), matchingSides(), parseValue(), stringList(), StructuredValue, text()

### Community 77 - "Community 77"
Cohesion: 0.47
Nodes (8): loginRequest(), main(), percentile(), runConcurrent(), runSequential(), safeJson(), summarize(), timedRequest()

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (5): CLIENT_RENDERING_RULES, OrderingLayer, ReferenceBinding, RenderingContract, StructuralLayer

### Community 79 - "Community 79"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 80 - "Community 80"
Cohesion: 0.25
Nodes (2): ExamQualityReviewService, RequestUser

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (3): capabilityGroups, operatingPrinciples, Header()

### Community 82 - "Community 82"
Cohesion: 0.29
Nodes (4): CanActivate, LimitConfig, POLICIES, RateLimitGuard

### Community 83 - "Community 83"
Cohesion: 0.21
Nodes (6): banks, CourseBank, Fact, prisma, getStatusBadgeTone(), normalizeStatusKey()

### Community 84 - "Community 84"
Cohesion: 0.25
Nodes (6): exceptions, ignoredDirectories, include, limit, oversized, root

### Community 86 - "Community 86"
Cohesion: 0.25
Nodes (5): Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage

### Community 87 - "Community 87"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 89 - "Community 89"
Cohesion: 0.48
Nodes (6): exam_question_snapshots, exam_snapshots, exams, question_snapshots, question_versions, questions

### Community 90 - "Community 90"
Cohesion: 0.43
Nodes (1): AiController

### Community 91 - "Community 91"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (6): BulkEnrollByEmailsDto, BulkEnrollmentDto, BulkImportStudentRow, BulkImportStudentsDto, CreateEnrollmentDto, UpdateEnrollmentStatusDto

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (6): AddQuestionsToExamDto, CreateExamDto, RescheduleExamDto, ShareExamDto, UpdateExamDto, UpdateExamQuestionDto

### Community 94 - "Community 94"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 95 - "Community 95"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 99 - "Community 99"
Cohesion: 0.29
Nodes (4): CommandDialogProps, CommandInput, CommandSeparator, DialogProps

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 101 - "Community 101"
Cohesion: 0.33
Nodes (5): anomaly_flags, exam_instances, focus_events, interaction_logs, tab_switch_events

### Community 103 - "Community 103"
Cohesion: 0.33
Nodes (4): ChoiceQuestion, prisma, topics, TopicSeed

### Community 104 - "Community 104"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 105 - "Community 105"
Cohesion: 0.73
Nodes (5): pickId(), pollAiJob(), request(), requireOk(), run()

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (5): Exam, ExamHistoryItem, ExamResult, ExamStatus, UpcomingExam

### Community 107 - "Community 107"
Cohesion: 0.60
Nodes (5): ipToLong(), isIpInAnyCidr(), isIpInCidr(), isValidIpOrCidr(), normalizeIp()

### Community 108 - "Community 108"
Cohesion: 0.70
Nodes (4): ai_generation_records, question_drafts, question_versions, questions

### Community 109 - "Community 109"
Cohesion: 0.70
Nodes (4): ai_generation_records, exam_quality_review_items, questions, users

### Community 110 - "Community 110"
Cohesion: 0.70
Nodes (4): exam_instances, exam_submissions, proctoring_evidence_captures, users

### Community 111 - "Community 111"
Cohesion: 0.60
Nodes (1): AdminDashboardService

### Community 112 - "Community 112"
Cohesion: 0.40
Nodes (1): AuditService

### Community 113 - "Community 113"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 114 - "Community 114"
Cohesion: 0.40
Nodes (2): CanActivate, RolesGuard

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 117 - "Community 117"
Cohesion: 0.40
Nodes (3): IdempotencyMiddleware, IdempotencyStore, NestMiddleware

### Community 118 - "Community 118"
Cohesion: 0.60
Nodes (4): hasColumn(), hasIndex(), main(), prisma

### Community 119 - "Community 119"
Cohesion: 0.50
Nodes (5): ExamDetailsDialog(), FlexibleExamCard(), getEventTone(), getStatusLabel(), toDate()

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 122 - "Community 122"
Cohesion: 0.83
Nodes (3): exam_link_usages, exam_links, exams

### Community 123 - "Community 123"
Cohesion: 0.83
Nodes (3): exam_submissions, score_adjustments, users

### Community 124 - "Community 124"
Cohesion: 0.67
Nodes (1): AiJobsService

### Community 125 - "Community 125"
Cohesion: 0.50
Nodes (1): AuditController

### Community 126 - "Community 126"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (2): PaginatedResult, PaginationDto

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (3): CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (3): ChangePasswordDto, DeleteProfileDto, UpdateProfileDto

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 131 - "Community 131"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 134 - "Community 134"
Cohesion: 0.50
Nodes (1): MailerService

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 136 - "Community 136"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 138 - "Community 138"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (1): SubmissionsEventsService

### Community 143 - "Community 143"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 144 - "Community 144"
Cohesion: 1.00
Nodes (2): courses, topics

### Community 145 - "Community 145"
Cohesion: 1.00
Nodes (2): courses, exam_snapshots

### Community 146 - "Community 146"
Cohesion: 1.33
Nodes (2): auth_sessions, users

### Community 147 - "Community 147"
Cohesion: 1.00
Nodes (2): question_bank_preferences, users

### Community 148 - "Community 148"
Cohesion: 1.00
Nodes (2): ai_generation_records, anomaly_flags

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (1): AiStatusController

### Community 150 - "Community 150"
Cohesion: 0.67
Nodes (2): QualityReviewDecision, ReviewQualitySuggestionDto

### Community 151 - "Community 151"
Cohesion: 0.67
Nodes (2): LecturerAttentionItemDto, LecturerAttentionResponseDto

### Community 152 - "Community 152"
Cohesion: 0.67
Nodes (2): DuplicateQuestionCheckDto, UpdateDuplicatePreferenceDto

### Community 153 - "Community 153"
Cohesion: 0.67
Nodes (1): prisma

### Community 154 - "Community 154"
Cohesion: 0.67
Nodes (1): prisma

### Community 155 - "Community 155"
Cohesion: 0.67
Nodes (1): prisma

### Community 156 - "Community 156"
Cohesion: 0.67
Nodes (1): prisma

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
Cohesion: 1.00
Nodes (1): mocks

## Knowledge Gaps
- **578 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+573 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `OnModuleInit`, `ProctoringEvidenceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `CoursesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (2 nodes): `ExamQualityReviewService`, `RequestUser`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (2 nodes): `CanActivate`, `RolesGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `AiJobsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `AuditController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (2 nodes): `PaginatedResult`, `PaginationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `MailerService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `SubmissionsEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (2 nodes): `courses`, `topics`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (2 nodes): `courses`, `exam_snapshots`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (2 nodes): `auth_sessions`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (2 nodes): `question_bank_preferences`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `ai_generation_records`, `anomaly_flags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `AiStatusController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (2 nodes): `QualityReviewDecision`, `ReviewQualitySuggestionDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (2 nodes): `LecturerAttentionItemDto`, `LecturerAttentionResponseDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (2 nodes): `DuplicateQuestionCheckDto`, `UpdateDuplicatePreferenceDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `prisma`
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
- **Thin community `Community 164`** (1 nodes): `mocks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 14`, `Community 115`, `Community 102`, `Community 132`, `Community 133`, `Community 165`, `Community 116`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 22` to `Community 36`, `Community 96`, `Community 97`, `Community 85`, `Community 98`, `Community 142`, `Community 120`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 10` to `Community 9`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _578 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03288425322323627 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04950495049504951 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0692785475394171 - nodes in this community are weakly interconnected._