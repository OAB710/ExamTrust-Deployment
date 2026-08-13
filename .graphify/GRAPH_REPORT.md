# Graph Report - .  (2026-08-13)

## Corpus Check
- Large corpus: 538 files · ~449,404 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2695 nodes · 6950 edges · 147 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 1595 · contains: 1448 · MODIFIES: 1277 · imports_from: 970 · method: 671 · calls: 602 · ON_BRANCH: 170 · PARENT_OF: 115 · references: 79 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: all (source: default-auto)
- Included files: 538 · Candidates: recursive
- Excluded: 0 untracked · 0 ignored · 1 sensitive · 0 missing committed
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 151 edges
2. `SubmissionsService` - 79 edges
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
  FE/src/lib/presentation.ts → FE/src/lib/presentation.ts  _Bridges community 26 → community 30_
- `007a277 Update ZaloBotFeature` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 39 → community 5_
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 1 → community 5_
- `0716f8a Zalo Web Hook` --PARENT_OF--> `3221af2 Merge pull request #2 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 5 → community 31_
- `1098f63 add` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 32 → community 5_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (38): courses, topics, courses, exam_snapshots, AuditController, AuditModule, AuthModule, CacheModule (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): da20a4e add, DataPagination(), DataPaginationProps, Course, EMPTY_FILTERS, gradientClasses, GroupedCourses, CourseOption (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (39): 13dcbd7 add, 222b35a add, 23cc713 Merge remote-tracking branch 'upstream/main', 97c3ce7 Update schema.prisma, b27133b add, f2db362 Refactor VI + RCM Topic + AI Summarize, BulkStudentImport(), BulkStudentImportProps (+31 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (50): b8349a8 refactor code căng, answerTitles, FillBlankGuide(), OptionRowProps, Props, QuestionAnswerEditor(), QuestionTopicDialog(), GeneratedQuestion (+42 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (48): duc, main, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0aae96f add, 0c12096 Update page.tsx, 0e4348a add, 14c973c Add Cloudflare Workers deployment config for FE via OpenNext (+40 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (8): 2d105be Convert FE from embedded repository to regular folder, prisma, { PrismaClient }, mocks, mocks, courses, mocks, mocks

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): metadata, Providers(), AuthContext, AuthContextType, AuthProvider(), AuthState, Action, ActionType (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (30): MetricCardProps, NavLink, NavLinkBaseProps, NavLinkCompatProps, cn(), AccordionContent, AccordionItem, AccordionTrigger (+22 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (37): AdminStatCard(), AdminStatCardProps, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, buildToken(), CourseForm, CourseItem, defaultForm (+29 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (32): AiImprovementDetail, AiImprovementStatus, AiImprovementSummary, AnalyticsCourseInfo, buildComparisonSnapshot(), COMPARISON_FIELDS, ComparisonFieldKey, CourseTerm (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (24): BackToDashboardButton(), BackToDashboardButtonProps, ButtonSize, ButtonVariant, CheckStatus, defaultExamInfo, ExamStep, SystemCheck (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (37): BankQuestionOption, BankTopic, buildReviewSettingsPayload(), CourseOption, createDefaultForm(), createDefaultReviewSettingsDraft(), DIFFICULTY_LABEL_VI, difficultyLabelFromValue() (+29 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (16): AuditLog, DevopsStatus, Props, DashboardLayout(), AiSuggestion, DraftGrade, QuestionHistoryRow, QuestionMetric (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (27): ExamSecurityModal(), ExamSecurityState, useExamSecurity(), AnswerMap, BaseQ, FillBlankQ, FindErrorQ, isAnswered() (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (35): QuestionPreviewInfoCard(), QuestionPreviewSection(), QuestionBankCourse, useQuestionBankData(), Params, useQuestionBankRouteState(), courseFilterDefinitions, difficultyOptions (+27 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (28): canonicalize(), canonicalStringify(), hashObject(), isPlainObject(), chooseStrategy(), generateExam(), hashJson(), hashStringToNumber() (+20 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (16): exam_submissions, integrity_reviews, iso(), rangeFor(), Exam, Submission, User, copy (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (34): 1ff59cf add, 3acaef9 fix nhẹ, f40ccdb to vietnamese, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, APICourse, buildToken(), Course (+26 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (33): useIsMobile(), SheetContent, SheetContentProps, SheetDescription, SheetOverlay, SheetTitle, sheetVariants, Sidebar (+25 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (26): aliases, EditableStudentImport(), Field, fields, ImportRow, labels, AGGREGATE_ALERT_TYPES, EMPTY_STUDENT_FILTERS (+18 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (21): themes, ThemeToggle(), useAuth(), capabilityGroups, operatingPrinciples, getSessionDevice(), groupSessionsByDevice(), Session (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (26): 1e57c6d Merge pull request #10 from trungducnguyen4/duc, 27f2728 Merge pull request #9 from trungducnguyen4/duc, 34443bf add, 5e60238 add, 67f04b6 add, GenerateExamQuestionsDto, GenerateQuestionDto, SuggestSimilarTopicsDto (+18 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (3): OnModuleDestroy, OnModuleInit, SubmissionsService

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (18): AdminPageShell(), AdminPageShellProps, EMPTY_FILTERS, Exam, formatDateTimeVi(), getScheduleLabel(), FilterPanelProps, Input (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (20): 2701bbc add, 3ce42b8 add, c7c474f Merge remote-tracking branch 'upstream/main', e3af065 add, ExamSecurityModalProps, violationLabels, emptyCounts, UseExamSecurityOptions (+12 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (2): AiService, OnModuleInit

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (20): formatAttemptLimitVi(), formatDateVi(), formatDurationVi(), formatNumberVi(), formatPercentVi(), formatScoreVi(), getAttemptStatusLabel(), getExamStatusLabel() (+12 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (18): 3221af2 Merge pull request #2 from OAB710/main, 328ec36 add, 563dc34 Merge pull request #3 from trungducnguyen4/duc, 57697d2 Merge remote-tracking branch 'upstream/main', c4f7ae9 Delete daemon.pid, f4c84b8 add, AnswerMatrix, EvidenceCapture (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (18): 1098f63 add, ad2ef1d Add accounts-only seed script for resetting production data, e0e0f5b Fix Bug, fd68a4b Merge pull request #16 from OAB710/main, THEME_OPTIONS, THEME_PROVIDER_OPTIONS, prisma, students (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (15): EMPTY_FILTERS, EMPTY_PATTERNS, EMPTY_STATS, IntegrityCasesResponse, IntegrityPatterns, IntegrityStats, DateRangeValue, FilterChip (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.10
Nodes (16): AttentionSection(), PRIORITY_STYLES, ContextHelp(), ContextHelpProps, HelpBody(), HelpButton, HelpContent, HelpedTitle() (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), COMPLETED_STATUSES, CourseExamAction, CourseExamForAction, CourseExamSubmission, ExamDisplayState, getCourseExamAction() (+12 more)

### Community 36 - "Community 36"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (23): buildBeInfoText(), buildFeInfoText(), buildPublicInfoText(), buildR2InfoText(), cfGraphQL(), formatBuildStatus(), formatBytesGB(), getAiStatus() (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (14): SessionMeta, TokenUser, NestInterceptor, PerfInterceptor, OnModuleDestroy, OnModuleInit, { PrismaClient }, PrismaService (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (15): 007a277 Update ZaloBotFeature, 093b6ef Merge pull request #6 from OAB710/main, 28c06f5 Merge pull request #1 from trungducnguyen4/main, 36549ac AI GEN QUES, 6714c32 Merge branch 'main' of https://github.com/OAB710/ExamTrust-Deployment, 9d34aad Merge branch 'main' into duc, ba15256 feat(zalo-webhook): add BE deployment and FE info, improve observability, e97f65f Merge pull request #7 from OAB710/main (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (14): completedSubmissionStatuses, Course, CourseExam, CourseExamSummary, Enrollment, ExamSubmission, Student, StudentCoursePerformance (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.15
Nodes (15): AiModule, buildContextLines(), buildExamTrustPromptHeader(), ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, ExamTrustAiUseCase, formatNumber() (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (18): accessBadgeClass(), ExamDetail, MySubmission, statusBadgeClass(), StudentExamDetail(), formatBadgeText(), getStatusBadgeLabel(), getStatusBadgeTone() (+10 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (1): AuthService

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (1): AuthController

### Community 46 - "Community 46"
Cohesion: 0.23
Nodes (8): StrategyRegistry, ListeningTimecodeStrategy, MatchingHeadingStrategy, OrderedReasoningStrategy, SharedOptionPoolStrategy, DefaultFlexible, ShuffleStrategy, StrictNoShuffle

### Community 47 - "Community 47"
Cohesion: 0.12
Nodes (16): AddLogsDto, AutosaveAnswerDto, AutosaveExamDto, CreateScoreAdjustmentDto, ExtendSubmissionDeadlineDto, FinalizeEvidenceCaptureDto, GradeAnswerDto, ReopenSubmissionDto (+8 more)

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (12): integrity_review_audits, integrity_reviews, users, 50768bd Merge pull request #11 from trungducnguyen4/duc, 95cd9ce add, ReviewAnomalyFlagDto, ReviewIntegrityCaseDto, RiskFlagDecision (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (15): ChoiceQuestion, ensureAnswer(), ensureExam(), ensureExamInstance(), ensureExamQuestion(), ensureExamSnapshot(), ensureQuestion(), ensureSubmission() (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.29
Nodes (14): ai_generation_records, course_topics, courses, exam_questions, question_course_scopes, question_drafts, question_tags, question_topics (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 53 - "Community 53"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 54 - "Community 54"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (4): ExamData, ExamQuestion, getCorrectAnswerText(), getOptionEntries()

### Community 56 - "Community 56"
Cohesion: 0.19
Nodes (2): OnModuleInit, ProctoringEvidenceService

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (9): EvidenceCapture, IntegrityCaseDetail(), IntegrityCaseDetailProps, IntegrityTimelineEvent, FlaggedSubmission, IntegrityReason, GeneratedQuestion, Step (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeader(), PageHeaderProps, EmptyStateProps, PageAction, ResponsiveColumn, StatusTone, ThemeMode (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.15
Nodes (12): AIGenerateSectionDto, AIGenerationConstraintsDto, AISection, ApplyAICandidateDto, CreateQuestionDraftDto, DraftPublishMode, DraftValidationLevel, PublishQuestionDraftDto (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (3): AuthUser, extractUploaderIdFromKey(), MediaService

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (7): BATCH_SIZE, fetchBatch(), LegacyQuestion, main(), prisma, { PrismaClient }, processQuestion()

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (1): CoursesController

### Community 65 - "Community 65"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 67 - "Community 67"
Cohesion: 0.45
Nodes (10): courses, enrollments, exam_questions, exam_submissions, exams, integrity_logs, proctoring_sessions, questions (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.20
Nodes (1): CacheService

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 71 - "Community 71"
Cohesion: 0.36
Nodes (9): anomaly_flags, exam_instances, exam_questions, exam_submissions, exams, focus_events, interaction_logs, question_versions (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (7): AttentionItemData, AttentionPriority, LecturerAttentionResponse, LecturerAttentionSummary, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, getQueueStorageKey(), loadQueue(), persistQueue(), safeParseQueue(), useExamAutosave(), UseExamAutosaveOptions

### Community 74 - "Community 74"
Cohesion: 0.36
Nodes (9): course_topics, courses, exist, question_tags, question_topics, questions, tags, topics (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (1): QueueService

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 77 - "Community 77"
Cohesion: 0.20
Nodes (4): ButtonProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 78 - "Community 78"
Cohesion: 0.20
Nodes (8): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubContent, ContextMenuSubTrigger

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (1): UsersController

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (1): UsersService

### Community 81 - "Community 81"
Cohesion: 0.39
Nodes (8): ai_generation_records, exam_submission_regrade_logs, exam_submissions, question_statistics, question_versions, questions, submission_answers, users

### Community 82 - "Community 82"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AiJobsService, AISectionValue, AiTaskType, CreateAiJobParams

### Community 83 - "Community 83"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (7): asObject(), formatManualAnswer(), matchingSides(), parseValue(), stringList(), StructuredValue, text()

### Community 85 - "Community 85"
Cohesion: 0.47
Nodes (8): loginRequest(), main(), percentile(), runConcurrent(), runSequential(), safeJson(), summarize(), timedRequest()

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (5): question_bank_preferences, users, 1afe093 add, DuplicateQuestionCheckDto, UpdateDuplicatePreferenceDto

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (5): CLIENT_RENDERING_RULES, OrderingLayer, ReferenceBinding, RenderingContract, StructuralLayer

### Community 88 - "Community 88"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 89 - "Community 89"
Cohesion: 0.25
Nodes (6): exceptions, ignoredDirectories, include, limit, oversized, root

### Community 91 - "Community 91"
Cohesion: 0.25
Nodes (7): Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 92 - "Community 92"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 93 - "Community 93"
Cohesion: 0.48
Nodes (6): exam_question_snapshots, exam_snapshots, exams, question_snapshots, question_versions, questions

### Community 94 - "Community 94"
Cohesion: 0.43
Nodes (1): AiController

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (4): _extract_json(), generate(), local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l, Try to pull the first valid JSON object out of model output.

### Community 96 - "Community 96"
Cohesion: 0.29
Nodes (6): AddQuestionsToExamDto, CreateExamDto, RescheduleExamDto, ShareExamDto, UpdateExamDto, UpdateExamQuestionDto

### Community 97 - "Community 97"
Cohesion: 0.29
Nodes (1): MediaController

### Community 98 - "Community 98"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 99 - "Community 99"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 100 - "Community 100"
Cohesion: 0.29
Nodes (4): CommandDialogProps, CommandInput, CommandSeparator, DialogProps

### Community 101 - "Community 101"
Cohesion: 0.33
Nodes (5): anomaly_flags, exam_instances, focus_events, interaction_logs, tab_switch_events

### Community 102 - "Community 102"
Cohesion: 0.47
Nodes (1): AdminDashboardService

### Community 103 - "Community 103"
Cohesion: 0.33
Nodes (1): ExamQualityReviewService

### Community 105 - "Community 105"
Cohesion: 0.33
Nodes (4): ChoiceQuestion, prisma, topics, TopicSeed

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (1): QuestionMetadataController

### Community 107 - "Community 107"
Cohesion: 0.73
Nodes (5): pickId(), pollAiJob(), request(), requireOk(), run()

### Community 110 - "Community 110"
Cohesion: 0.33
Nodes (5): Exam, ExamHistoryItem, ExamResult, ExamStatus, UpcomingExam

### Community 111 - "Community 111"
Cohesion: 0.60
Nodes (5): ipToLong(), isIpInAnyCidr(), isIpInCidr(), isValidIpOrCidr(), normalizeIp()

### Community 112 - "Community 112"
Cohesion: 0.70
Nodes (4): ai_generation_records, question_drafts, question_versions, questions

### Community 113 - "Community 113"
Cohesion: 0.70
Nodes (4): ai_generation_records, exam_quality_review_items, questions, users

### Community 114 - "Community 114"
Cohesion: 0.70
Nodes (4): exam_instances, exam_submissions, proctoring_evidence_captures, users

### Community 115 - "Community 115"
Cohesion: 0.40
Nodes (1): AuditService

### Community 116 - "Community 116"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 117 - "Community 117"
Cohesion: 0.50
Nodes (2): CanActivate, RateLimitGuard

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (2): CanActivate, RolesGuard

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 121 - "Community 121"
Cohesion: 0.40
Nodes (4): MEDIA_ALLOWED_MIME_TYPES, MEDIA_EXTENSION_BY_MIME, MEDIA_MAX_BYTES, MediaAttachmentType

### Community 122 - "Community 122"
Cohesion: 0.40
Nodes (3): IdempotencyMiddleware, IdempotencyStore, NestMiddleware

### Community 123 - "Community 123"
Cohesion: 0.60
Nodes (4): hasColumn(), hasIndex(), main(), prisma

### Community 124 - "Community 124"
Cohesion: 0.83
Nodes (3): exam_link_usages, exam_links, exams

### Community 125 - "Community 125"
Cohesion: 0.83
Nodes (3): exam_submissions, score_adjustments, users

### Community 126 - "Community 126"
Cohesion: 0.50
Nodes (1): AdminDashboardController

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (3): ConfirmMediaUploadDto, CreatePresignedUploadDto, ReleaseMediaUploadDto

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (2): PaginatedResult, PaginationDto

### Community 130 - "Community 130"
Cohesion: 0.50
Nodes (3): CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto

### Community 131 - "Community 131"
Cohesion: 0.50
Nodes (1): LecturerDashboardController

### Community 132 - "Community 132"
Cohesion: 0.50
Nodes (1): LecturerDashboardService

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (1): MailerService

### Community 136 - "Community 136"
Cohesion: 0.50
Nodes (2): prisma, REQUIRED_COLUMNS

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 138 - "Community 138"
Cohesion: 0.50
Nodes (2): backendEnvPath, prisma

### Community 139 - "Community 139"
Cohesion: 0.50
Nodes (1): EventsProcessor

### Community 140 - "Community 140"
Cohesion: 0.50
Nodes (1): IntegrityLogsProcessor

### Community 141 - "Community 141"
Cohesion: 0.50
Nodes (1): AIGenerationJobsController

### Community 142 - "Community 142"
Cohesion: 0.50
Nodes (1): SubmissionsEventsService

### Community 143 - "Community 143"
Cohesion: 1.00
Nodes (2): notifications, users

### Community 144 - "Community 144"
Cohesion: 1.33
Nodes (2): auth_sessions, users

### Community 145 - "Community 145"
Cohesion: 1.00
Nodes (2): ai_generation_records, anomaly_flags

### Community 146 - "Community 146"
Cohesion: 0.67
Nodes (1): prisma

### Community 147 - "Community 147"
Cohesion: 0.67
Nodes (1): prisma

### Community 148 - "Community 148"
Cohesion: 0.67
Nodes (1): prisma

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (1): prisma

### Community 150 - "Community 150"
Cohesion: 0.67
Nodes (1): prisma

### Community 151 - "Community 151"
Cohesion: 1.00
Nodes (2): bootstrap(), parseCsvList()

### Community 152 - "Community 152"
Cohesion: 0.67
Nodes (1): JwtStrategy

### Community 154 - "Community 154"
Cohesion: 1.00
Nodes (1): media_storage_usage

### Community 155 - "Community 155"
Cohesion: 1.00
Nodes (1): media_user_storage_usage

### Community 158 - "Community 158"
Cohesion: 1.00
Nodes (1): MediaModule

## Knowledge Gaps
- **614 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+609 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `OnModuleInit`, `ProctoringEvidenceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `CoursesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `MediaController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `CanActivate`, `RateLimitGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `CanActivate`, `RolesGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `AdminDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (2 nodes): `PaginatedResult`, `PaginationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `LecturerDashboardController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `LecturerDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `MailerService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (2 nodes): `prisma`, `REQUIRED_COLUMNS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (2 nodes): `backendEnvPath`, `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `EventsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `IntegrityLogsProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `AIGenerationJobsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `SubmissionsEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (2 nodes): `notifications`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (2 nodes): `auth_sessions`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (2 nodes): `ai_generation_records`, `anomaly_flags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (2 nodes): `bootstrap()`, `parseCsvList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `JwtStrategy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `media_storage_usage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `media_user_storage_usage`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `MediaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 31`, `Community 119`, `Community 104`, `Community 133`, `Community 134`, `Community 156`, `Community 120`, `Community 157`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 25` to `Community 24`, `Community 153`, `Community 108`, `Community 90`, `Community 69`, `Community 57`, `Community 109`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 9` to `Community 27`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _614 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0312258064516129 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.019044260271557045 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06278538812785388 - nodes in this community are weakly interconnected._