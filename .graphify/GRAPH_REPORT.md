# Graph Report - .  (2026-08-11)

## Corpus Check
- Large corpus: 532 files · ~462,039 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 2593 nodes · 6766 edges · 146 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: imports: 1549 · contains: 1391 · MODIFIES: 1277 · imports_from: 951 · method: 640 · calls: 571 · ON_BRANCH: 170 · PARENT_OF: 115 · references: 79 · inherits: 11 · implements: 10 · rationale_for: 2


## Input Scope
- Requested: auto
- Resolved: committed (source: default-auto)
- Included files: 532 · Candidates: 587
- Excluded: 4 untracked · 99581 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Built from Git commit: `1098f63`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `ApiClient` - 147 edges
2. `SubmissionsService` - 72 edges
3. `Button` - 65 edges
4. `cn()` - 62 edges
5. `Card` - 53 edges
6. `CardContent` - 53 edges
7. `QuestionsService` - 50 edges
8. `DashboardLayout()` - 47 edges
9. `CardHeader` - 47 edges
10. `CardTitle` - 46 edges

## Surprising Connections (you probably didn't know these)
- `0391dc3 mang project tu repo cu qua` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 1 → community 3_
- `0716f8a Zalo Web Hook` --PARENT_OF--> `3221af2 Merge pull request #2 from OAB710/main`  [EXTRACTED]
  git → git  _Bridges community 3 → community 21_
- `1098f63 add` --ON_BRANCH--> `main`  [EXTRACTED]
  git → git  _Bridges community 30 → community 3_
- `13dcbd7 add` --ON_BRANCH--> `duc`  [EXTRACTED]
  git → git  _Bridges community 9 → community 3_
- `16c91ec add` --PARENT_OF--> `b8349a8 refactor code căng`  [EXTRACTED]
  git → git  _Bridges community 3 → community 5_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (1): ApiClient

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (35): courses, topics, courses, exam_snapshots, AuditController, AuditModule, AuthModule, CacheModule (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (8): 2d105be Convert FE from embedded repository to regular folder, prisma, { PrismaClient }, mocks, mocks, courses, mocks, mocks

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (53): AiModule, duc, main, 007a277 Update ZaloBotFeature, 06d86ad Apply gitignore and remove generated files from tracking, 0716f8a Zalo Web Hook, 0aae96f add, 0c12096 Update page.tsx (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (36): canonicalize(), canonicalStringify(), hashObject(), isPlainObject(), chooseStrategy(), generateExam(), hashJson(), hashStringToNumber() (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (39): b8349a8 refactor code căng, answerTitles, FillBlankGuide(), OptionRowProps, Props, QuestionAnswerEditor(), GeneratedQuestion, Params (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (31): da20a4e add, DataPagination(), DataPaginationProps, Course, EMPTY_FILTERS, gradientClasses, GroupedCourses, formatDurationVi() (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): metadata, Providers(), AuthContext, AuthContextType, AuthProvider(), AuthState, Action, ActionType (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (29): AuditLog, Props, ExamItem, ExamLinkItem, LINK_STATE_LABELS, LinkUsage, GeneratedQuestion, Step (+21 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (25): 13dcbd7 add, 23cc713 Merge remote-tracking branch 'upstream/main', b27133b add, f2db362 Refactor VI + RCM Topic + AI Summarize, AuthUser, CreateCourseDto, CreateUserDto, LoginDto (+17 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (1): QuestionsService

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (18): exam_submissions, integrity_reviews, iso(), rangeFor(), copy, AdminDashboardController, AdminDashboardModule, COMPLETED (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (24): MetricCardProps, NavLink, NavLinkBaseProps, NavLinkCompatProps, cn(), AccordionContent, AccordionItem, AccordionTrigger (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (37): QuestionTopicDialog(), BankQuestionOption, BankTopic, buildReviewSettingsPayload(), CourseOption, createDefaultForm(), createDefaultReviewSettingsDraft(), DIFFICULTY_LABEL_VI (+29 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (1): SubmissionsController

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (30): AiImprovementDetail, AiImprovementStatus, AiImprovementSummary, AnalyticsCourseInfo, buildComparisonSnapshot(), COMPARISON_FIELDS, ComparisonFieldKey, CourseTerm (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (15): AuthService, SessionMeta, TokenUser, NestInterceptor, PerfInterceptor, OnModuleDestroy, OnModuleInit, { PrismaClient } (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (27): ExamSecurityModal(), ExamSecurityState, useExamSecurity(), AnswerMap, BaseQ, FillBlankQ, FindErrorQ, isAnswered() (+19 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (30): IntegrityCaseDetail(), EMPTY_FILTERS, EMPTY_PATTERNS, EMPTY_STATS, FlaggedSubmission, IntegrityCasesResponse, IntegrityPatterns, IntegrityReason (+22 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (22): Exam, Submission, User, BackToDashboardButton(), BackToDashboardButtonProps, ButtonSize, ButtonVariant, QuestionHistoryRow (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (30): QuestionPreviewInfoCard(), QuestionPreviewSection(), QuestionBankCourse, useQuestionBankData(), Params, useQuestionBankRouteState(), courseFilterDefinitions, difficultyOptions (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (20): 093b6ef Merge pull request #6 from OAB710/main, 0e4348a add, 1ea6b35 add, 28c06f5 Merge pull request #1 from trungducnguyen4/main, 3221af2 Merge pull request #2 from OAB710/main, 36549ac AI GEN QUES, 563dc34 Merge pull request #3 from trungducnguyen4/duc, 9d34aad Merge branch 'main' into duc (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (23): 2701bbc add, 328ec36 add, 3ce42b8 add, 57697d2 Merge remote-tracking branch 'upstream/main', c4f7ae9 Delete daemon.pid, c7c474f Merge remote-tracking branch 'upstream/main', e3af065 add, ExamSecurityModalProps (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (24): AdminStatCard(), AdminStatCardProps, { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, buildToken(), CourseForm, CourseItem, defaultForm (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (27): SheetContent, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+19 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (22): AdminPageShell(), AdminPageShellProps, EMPTY_FILTERS, Exam, BackendRole, BackendStatus, EMPTY_CREATE_FORM, EMPTY_EDIT_FORM (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (17): AttentionSection(), PRIORITY_STYLES, ContextHelp(), ContextHelpProps, HelpBody(), HelpButton, HelpContent, HelpedTitle() (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (14): EvidenceCapture, IntegrityCaseDetailProps, IntegrityTimelineEvent, DashboardLayout(), ExamData, ExamQuestion, getCorrectAnswerText(), getOptionEntries() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (1): ExamsService

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (22): 1e57c6d Merge pull request #10 from trungducnguyen4/duc, 27f2728 Merge pull request #9 from trungducnguyen4/duc, 5e60238 add, 67f04b6 add, GenerateExamQuestionsDto, GenerateQuestionDto, SuggestSimilarTopicsDto, ApproveQuestionAiImprovementDto (+14 more)

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (18): 1098f63 add, ad2ef1d Add accounts-only seed script for resetting production data, e0e0f5b Fix Bug, fd68a4b Merge pull request #16 from OAB710/main, THEME_OPTIONS, THEME_PROVIDER_OPTIONS, prisma, students (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (16): DateRangeValue, FilterChip, FilterDefinition, FilterValue, FilterValues, ListFilterOption, NumberRangeValue, TextFilterOperator (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (3): OnModuleDestroy, OnModuleInit, SubmissionsService

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (18): CourseOption, Exam, EMPTY_STUDENT_FILTERS, EvidenceCapture, ExamOverview, IntegrityAlert, StudentSession, formatDateTimeVi() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (2): AiService, OnModuleInit

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (12): themes, ThemeToggle(), roleToPath, capabilityGroups, operatingPrinciples, Header(), DropdownMenuCheckboxItem, DropdownMenuLabel (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (20): completedStatuses, useStudentDashboardData(), COMPLETED_STATUSES, CourseExamAction, CourseExamForAction, CourseExamSubmission, ExamDisplayState, getCourseExamAction() (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.08
Nodes (1): QuestionDraftsController

### Community 38 - "Community 38"
Cohesion: 0.09
Nodes (16): 222b35a add, 97c3ce7 Update schema.prisma, BulkStudentImport(), BulkStudentImportProps, COLUMN_ALIASES, ImportResult, ImportState, ParsedRow (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (1): ExamsController

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (18): accessBadgeClass(), ExamDetail, MySubmission, statusBadgeClass(), StudentExamDetail(), formatBadgeText(), getStatusBadgeLabel(), getStatusBadgeTone() (+10 more)

### Community 41 - "Community 41"
Cohesion: 0.24
Nodes (19): buildBeInfoText(), buildFeInfoText(), buildPublicInfoText(), cfGraphQL(), formatBuildStatus(), getAiStatus(), getFeSubdomainEnabled(), getLastRunAgeMs() (+11 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (12): useIsMobile(), FilterPanelProps, Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (15): { academicYear: defaultAcademicYear, term: defaultTerm }, academicYearOptions, APICourse, buildToken(), Course, CourseExamPreview, courseGradientClasses, CreateCourse() (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (1): AuthController

### Community 45 - "Community 45"
Cohesion: 0.12
Nodes (16): AddLogsDto, AutosaveAnswerDto, AutosaveExamDto, CreateScoreAdjustmentDto, ExtendSubmissionDeadlineDto, FinalizeEvidenceCaptureDto, GradeAnswerDto, ReopenSubmissionDto (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (12): integrity_review_audits, integrity_reviews, users, 50768bd Merge pull request #11 from trungducnguyen4/duc, 95cd9ce add, ReviewAnomalyFlagDto, ReviewIntegrityCaseDto, RiskFlagDecision (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (1): CoursesService

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (10): AnswerMatrix, EvidenceCapture, ExamOverview, ExamResultsList(), groupAnomaliesByStudent(), MonitoringGroup, RiskFlag, SubmissionTimeline (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.20
Nodes (15): ChoiceQuestion, ensureAnswer(), ensureExam(), ensureExamInstance(), ensureExamQuestion(), ensureExamSnapshot(), ensureQuestion(), ensureSubmission() (+7 more)

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (14): ai_generation_records, course_topics, courses, exam_questions, question_course_scopes, question_drafts, question_tags, question_topics (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (1): EnrollmentsController

### Community 52 - "Community 52"
Cohesion: 0.27
Nodes (1): EnrollmentsService

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (1): ExamLinksService

### Community 54 - "Community 54"
Cohesion: 0.19
Nodes (2): OnModuleInit, ProctoringEvidenceService

### Community 55 - "Community 55"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (9): EmptyState(), PageHeader(), PageHeaderProps, EmptyStateProps, PageAction, ResponsiveColumn, StatusTone, ThemeMode (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.15
Nodes (12): AIGenerateSectionDto, AIGenerationConstraintsDto, AISection, ApplyAICandidateDto, CreateQuestionDraftDto, DraftPublishMode, DraftValidationLevel, PublishQuestionDraftDto (+4 more)

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (11): formatAttemptLimitVi(), formatDateVi(), formatNumberVi(), formatPercentVi(), formatScoreVi(), getAttemptStatusLabel(), getExamStatusLabel(), getExamWindowLabel() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (7): BATCH_SIZE, fetchBatch(), LegacyQuestion, main(), prisma, { PrismaClient }, processQuestion()

### Community 60 - "Community 60"
Cohesion: 0.27
Nodes (10): buildContextLines(), buildExamTrustPromptHeader(), ExamTrustAiAnalyticsSummary, ExamTrustAiContext, ExamTrustAiPromptParams, ExamTrustAiUseCase, formatNumber(), getOllamaGenerationOptions() (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.17
Nodes (1): CoursesController

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (8): CalendarView, ExamDetailsDialog(), FlexibleExamCard(), getEventTone(), getStatusLabel(), HOURS, ScheduleExamItem, toDate()

### Community 63 - "Community 63"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (10): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarSubContent (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.45
Nodes (10): courses, enrollments, exam_questions, exam_submissions, exams, integrity_logs, proctoring_sessions, questions (+2 more)

### Community 66 - "Community 66"
Cohesion: 0.20
Nodes (1): CacheService

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 68 - "Community 68"
Cohesion: 0.36
Nodes (9): anomaly_flags, exam_instances, exam_questions, exam_submissions, exams, focus_events, interaction_logs, question_versions (+1 more)

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (7): AttentionItemData, AttentionPriority, LecturerAttentionResponse, LecturerAttentionSummary, LECTURER_ATTENTION_QUERY_KEY, PRIORITY_ORDER, useAttentionItems()

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (8): AutosaveAnswer, AutosaveSyncStatus, getQueueStorageKey(), loadQueue(), persistQueue(), safeParseQueue(), useExamAutosave(), UseExamAutosaveOptions

### Community 71 - "Community 71"
Cohesion: 0.36
Nodes (9): course_topics, courses, exist, question_tags, question_topics, questions, tags, topics (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (1): QueueService

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (1): ExamRiskAssessmentService

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (4): ButtonProps, PaginationContent, PaginationItem, PaginationLinkProps

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (8): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubContent, ContextMenuSubTrigger

### Community 76 - "Community 76"
Cohesion: 0.20
Nodes (1): UsersController

### Community 77 - "Community 77"
Cohesion: 0.22
Nodes (1): UsersService

### Community 78 - "Community 78"
Cohesion: 0.39
Nodes (8): ai_generation_records, exam_submission_regrade_logs, exam_submissions, question_statistics, question_versions, questions, submission_answers, users

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (5): AI_SECTIONS, AiJobsService, AISectionValue, AiTaskType, CreateAiJobParams

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (1): ExamLinksController

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (7): asObject(), formatManualAnswer(), matchingSides(), parseValue(), stringList(), StructuredValue, text()

### Community 82 - "Community 82"
Cohesion: 0.47
Nodes (8): loginRequest(), main(), percentile(), runConcurrent(), runSequential(), safeJson(), summarize(), timedRequest()

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (5): CLIENT_RENDERING_RULES, OrderingLayer, ReferenceBinding, RenderingContract, StructuralLayer

### Community 84 - "Community 84"
Cohesion: 0.32
Nodes (1): DistributedEventsService

### Community 85 - "Community 85"
Cohesion: 0.29
Nodes (6): getSessionDevice(), groupSessionsByDevice(), Session, SessionGroup, Avatar, AvatarFallback

### Community 86 - "Community 86"
Cohesion: 0.25
Nodes (3): AiSuggestion, DraftGrade, CardContent

### Community 87 - "Community 87"
Cohesion: 0.25
Nodes (6): exceptions, ignoredDirectories, include, limit, oversized, root

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (5): Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage

### Community 91 - "Community 91"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 92 - "Community 92"
Cohesion: 0.25
Nodes (5): SheetContentProps, SheetDescription, SheetOverlay, SheetTitle, sheetVariants

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
Cohesion: 0.48
Nodes (6): getMinError(), getNumericInputError(), hasValidNumberFormat(), NumericInputOptions, parseNumericInput(), parseNumericInputOr()

### Community 98 - "Community 98"
Cohesion: 0.52
Nodes (1): AIGenerationProcessor

### Community 99 - "Community 99"
Cohesion: 0.38
Nodes (1): AccessPolicyService

### Community 101 - "Community 101"
Cohesion: 0.29
Nodes (4): CommandDialogProps, CommandInput, CommandSeparator, DialogProps

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (5): anomaly_flags, exam_instances, focus_events, interaction_logs, tab_switch_events

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

### Community 111 - "Community 111"
Cohesion: 0.33
Nodes (5): Exam, ExamHistoryItem, ExamResult, ExamStatus, UpcomingExam

### Community 112 - "Community 112"
Cohesion: 0.60
Nodes (5): ipToLong(), isIpInAnyCidr(), isIpInCidr(), isValidIpOrCidr(), normalizeIp()

### Community 113 - "Community 113"
Cohesion: 0.70
Nodes (4): ai_generation_records, question_drafts, question_versions, questions

### Community 114 - "Community 114"
Cohesion: 0.70
Nodes (4): ai_generation_records, exam_quality_review_items, questions, users

### Community 115 - "Community 115"
Cohesion: 0.70
Nodes (4): exam_instances, exam_submissions, proctoring_evidence_captures, users

### Community 116 - "Community 116"
Cohesion: 0.60
Nodes (1): AdminDashboardService

### Community 117 - "Community 117"
Cohesion: 0.40
Nodes (1): AuditService

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (1): RateLimiterService

### Community 119 - "Community 119"
Cohesion: 0.50
Nodes (2): CanActivate, RateLimitGuard

### Community 120 - "Community 120"
Cohesion: 0.40
Nodes (2): CanActivate, RolesGuard

### Community 122 - "Community 122"
Cohesion: 0.40
Nodes (1): ApiRequestError

### Community 123 - "Community 123"
Cohesion: 0.40
Nodes (3): IdempotencyMiddleware, IdempotencyStore, NestMiddleware

### Community 124 - "Community 124"
Cohesion: 0.60
Nodes (4): hasColumn(), hasIndex(), main(), prisma

### Community 125 - "Community 125"
Cohesion: 0.83
Nodes (3): exam_link_usages, exam_links, exams

### Community 126 - "Community 126"
Cohesion: 0.83
Nodes (3): exam_submissions, score_adjustments, users

### Community 127 - "Community 127"
Cohesion: 0.50
Nodes (3): GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto

### Community 128 - "Community 128"
Cohesion: 0.50
Nodes (2): PaginatedResult, PaginationDto

### Community 129 - "Community 129"
Cohesion: 0.50
Nodes (3): CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto

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
Cohesion: 1.33
Nodes (2): auth_sessions, users

### Community 145 - "Community 145"
Cohesion: 1.00
Nodes (2): question_bank_preferences, users

### Community 146 - "Community 146"
Cohesion: 1.00
Nodes (2): ai_generation_records, anomaly_flags

### Community 147 - "Community 147"
Cohesion: 0.67
Nodes (1): AiStatusController

### Community 148 - "Community 148"
Cohesion: 0.67
Nodes (2): DuplicateQuestionCheckDto, UpdateDuplicatePreferenceDto

### Community 149 - "Community 149"
Cohesion: 0.67
Nodes (1): prisma

### Community 150 - "Community 150"
Cohesion: 0.67
Nodes (1): prisma

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

### Community 155 - "Community 155"
Cohesion: 0.67
Nodes (1): prisma

### Community 156 - "Community 156"
Cohesion: 1.00
Nodes (2): bootstrap(), parseCsvList()

## Knowledge Gaps
- **587 isolated node(s):** `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma`, `prisma`, `prisma` (+582 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 0`** (1 nodes): `ApiClient`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `QuestionsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `SubmissionsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `ExamsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `AiService`, `OnModuleInit`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `QuestionDraftsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `ExamsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `AuthController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `CoursesService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `EnrollmentsController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `EnrollmentsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `ExamLinksService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `OnModuleInit`, `ProctoringEvidenceService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `CoursesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `CacheService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `QueueService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `ExamRiskAssessmentService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `UsersController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `UsersService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `ExamLinksController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `DistributedEventsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `AiController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `AIGenerationProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `AccessPolicyService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `ExamQualityReviewService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `QuestionMetadataController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 116`** (1 nodes): `AdminDashboardService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `AuditService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `RateLimiterService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (2 nodes): `CanActivate`, `RateLimitGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (2 nodes): `CanActivate`, `RolesGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `ApiRequestError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (2 nodes): `PaginatedResult`, `PaginationDto`
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
- **Thin community `Community 144`** (2 nodes): `auth_sessions`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (2 nodes): `question_bank_preferences`, `users`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (2 nodes): `ai_generation_records`, `anomaly_flags`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `AiStatusController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (2 nodes): `DuplicateQuestionCheckDto`, `UpdateDuplicatePreferenceDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
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
- **Thin community `Community 156`** (2 nodes): `bootstrap()`, `parseCsvList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiClient` connect `Community 0` to `Community 21`, `Community 121`, `Community 104`, `Community 132`, `Community 133`, `Community 157`, `Community 122`, `Community 158`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `SubmissionsService` connect `Community 32` to `Community 29`, `Community 88`, `Community 108`, `Community 89`, `Community 100`, `Community 142`, `Community 109`, `Community 110`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `QuestionsService` connect `Community 10` to `Community 22`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `local_ai_server.py — Minimal local model server for ExamTrust AI feature Uses l`, `Try to pull the first valid JSON object out of model output.`, `prisma` to the rest of the system?**
  _587 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.032231404958677684 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02061430632859204 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03278688524590164 - nodes in this community are weakly interconnected._