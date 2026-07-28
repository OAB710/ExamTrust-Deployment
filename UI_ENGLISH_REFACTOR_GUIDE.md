# UI English Refactor – Copy/Paste Guide

## Rules for every batch

Keep variable names, API fields, database fields, routes, enums, and business logic unchanged. Translate only text shown to users: UI labels, headings, buttons, placeholders, tooltips, dialogs, toast messages, validation/error/success messages, and dynamic text/constants. Use these terms consistently:

- `bài thi` → **exam**
- `lượt làm bài` → **submission**
- `khóa học` → **course**
- `ngân hàng câu hỏi` → **question bank**
- `toàn vẹn` → **integrity**; `toàn vẹn học thuật` → **academic integrity**
- `giảng viên` → **lecturer**
- `sinh viên` → **student**
- `quản trị viên` → **administrator**

After each batch, run a targeted Vietnamese-text search on the changed folder and report files changed plus terms that need product-owner confirmation.

## Completed – Batch 1: Shared UI and backend errors

Already translated:

- `FE/src/app/layout.tsx`
- `FE/src/components/common/BackToDashboardButton.tsx`
- `FE/src/components/common/ConfirmActionDialog.tsx`
- `FE/src/components/common/ContextHelp.tsx`
- `FE/src/components/common/DataPagination.tsx`
- `FE/src/components/common/ExamSecurityModal.tsx`
- `FE/src/components/common/ThemeToggle.tsx`
- `FE/src/components/common/list/ActiveFilterChips.tsx`
- `FE/src/components/common/list/FilterPanel.tsx`
- `FE/src/components/common/list/SearchBar.tsx`
- `FE/src/components/common/list/SortButton.tsx`
- `FE/src/components/layout/DashboardLayout.tsx`
- `FE/src/components/layout/Header.tsx`
- `FE/src/components/ui/status-badge.tsx`
- `BE/src/ai/ai-jobs.service.ts`
- `BE/src/ai/ai.service.ts`
- `BE/src/courses/courses.service.ts`
- `BE/src/exams/exams.service.ts`
- `BE/src/submissions/exam-risk-assessment.service.ts`

---

## Completed – Batch 2: Student exam session

Translated and verified:

- `FE/src/features/student/ExamReadyCheck.tsx`
- `FE/src/features/student/JoinExam.tsx`
- `FE/src/features/student/ExamTaking.tsx`

The only remaining accented match is **Bélády**, a proper name in a sample question, so it is intentionally retained.

## Batch 2 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/student/ExamReadyCheck.tsx
- FE/src/features/student/JoinExam.tsx
- FE/src/features/student/ExamTaking.tsx

Include headings, help text, buttons, accessibility labels, dynamic/template strings, toast messages, and status labels. Do not translate sample course/exam data unless that text is rendered to users; if it is rendered, translate it as well. Preserve variables, API/database fields, routes, enums, and behavior. Use the terminology in UI_ENGLISH_REFACTOR_GUIDE.md. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 3: Student courses, exams, results, and feedback

Translated and verified:

- `FE/src/features/student/StudentDashboard.tsx`
- `FE/src/features/student/StudentCourses.tsx`
- `FE/src/features/student/StudentCourseDetail.tsx`
- `FE/src/features/student/StudentExams.tsx`
- `FE/src/features/student/StudentExamDetail.tsx`
- `FE/src/features/student/StudentResults.tsx`
- `FE/src/features/student/StudentSchedule.tsx`
- `FE/src/features/student/GradingBreakdown.tsx`
- `FE/src/features/student/LearningFeedbackDetail.tsx`

## Batch 3 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/student/StudentDashboard.tsx
- FE/src/features/student/StudentCourses.tsx
- FE/src/features/student/StudentCourseDetail.tsx
- FE/src/features/student/StudentExams.tsx
- FE/src/features/student/StudentExamDetail.tsx
- FE/src/features/student/StudentResults.tsx
- FE/src/features/student/StudentSchedule.tsx
- FE/src/features/student/GradingBreakdown.tsx
- FE/src/features/student/LearningFeedbackDetail.tsx

Include dynamic strings, constants/config-derived labels, modals, toasts, validation, placeholders, tooltips, and accessibility labels. Preserve system identifiers and business behavior. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 4: Lecturer dashboard and course management

Translated and verified:

- `FE/src/features/lecturer/LecturerDashboard.tsx`
- `FE/src/features/lecturer/CourseManagement.tsx`
- `FE/src/features/lecturer/CourseDetail.tsx`
- `FE/src/features/lecturer/CreateCourse.tsx`

## Batch 4 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/lecturer/LecturerDashboard.tsx
- FE/src/features/lecturer/CourseManagement.tsx
- FE/src/features/lecturer/CourseDetail.tsx
- FE/src/features/lecturer/CreateCourse.tsx

Translate all UI and generated text, including filters, empty states, dialog/toast/validation messages, tooltips, aria labels, and help content. Keep all identifiers, field names, routes, and logic intact. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 5: Lecturer exam lifecycle and integrity

Translated and verified:

- `FE/src/features/lecturer/AdvancedExamRuleConfig.tsx`
- `FE/src/features/lecturer/ExamManagement.tsx`
- `FE/src/features/lecturer/ExamPreview.tsx`
- `FE/src/features/lecturer/ExamMonitor.tsx`
- `FE/src/features/lecturer/ExamResultsList.tsx`
- `FE/src/features/lecturer/attention/AttentionSection.tsx`
- `FE/src/features/lecturer/ExamQualityReview.tsx`
- `FE/src/features/lecturer/CreateExam.tsx`
- `FE/src/features/lecturer/ExamAnalytics.tsx`

## Batch 5 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/lecturer/CreateExam.tsx
- FE/src/features/lecturer/AdvancedExamRuleConfig.tsx
- FE/src/features/lecturer/ExamManagement.tsx
- FE/src/features/lecturer/ExamPreview.tsx
- FE/src/features/lecturer/ExamMonitor.tsx
- FE/src/features/lecturer/ExamResultsList.tsx
- FE/src/features/lecturer/ExamAnalytics.tsx
- FE/src/features/lecturer/ExamQualityReview.tsx
- FE/src/features/lecturer/attention/AttentionSection.tsx

Translate all user-visible text, including dynamic/template strings, constants, empty states, charts/tooltips, modals, toasts, validation, and aria labels. Preserve all system identifiers and business behavior. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 6: Lecturer question bank, editor, AI and grading

Translated and verified:

- `FE/src/features/lecturer/ManualGradingDetail.tsx`
- `FE/src/features/lecturer/UploadDocAIGen.tsx`
- `FE/src/features/lecturer/QuestionEditor.tsx`
- `FE/src/features/lecturer/QuestionBankManagement.tsx`

## Batch 6 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/lecturer/QuestionBankManagement.tsx
- FE/src/features/lecturer/QuestionEditor.tsx
- FE/src/features/lecturer/UploadDocAIGen.tsx
- FE/src/features/lecturer/ManualGradingDetail.tsx

Pay special attention to strings assembled with interpolation/concatenation and help/context content. Translate all user-visible text without renaming API/database fields, variables, routes, enum values, or logic. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 7: Administrator dashboard and management

Translated and verified:

- `FE/src/features/admin/AdminDashboard.tsx`
- `FE/src/features/admin/AdminAnalyticsDashboard.tsx`
- `FE/src/features/admin/CourseManagement.tsx`
- `FE/src/features/admin/ExamManagement.tsx`
- `FE/src/features/admin/IntegrityOverview.tsx`
- `FE/src/components/admin/IntegrityCaseDetail.tsx`

## Batch 7 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/admin/AdminDashboard.tsx
- FE/src/features/admin/AdminAnalyticsDashboard.tsx
- FE/src/features/admin/CourseManagement.tsx
- FE/src/features/admin/ExamManagement.tsx
- FE/src/features/admin/IntegrityOverview.tsx
- FE/src/components/admin/IntegrityCaseDetail.tsx

Translate headings, controls, filters, dynamic strings, tooltips, dialogs, toasts, validation/errors, charts, empty states, and aria labels. Do not rename system identifiers or alter behavior. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Report changed files and uncertain terms, then run a targeted Vietnamese-text search for these files.
```

## Completed – Batch 8: Administrator analytics, policy, audit and remaining shared features

Translated and verified:

- `FE/src/features/admin/AnalyticsReport.tsx`
- `FE/src/features/admin/AuditLogViewer.tsx`
- `FE/src/features/admin/MetricMethodologyReference.tsx`
- `FE/src/features/admin/SystemPolicyConfig.tsx`
- `FE/src/components/common/BulkStudentImport.tsx`
- `FE/src/features/Login.tsx`
- `FE/src/features/ResetPassword.tsx`
- `FE/src/features/Profile.tsx`
- `FE/src/features/Landing.tsx`
- `FE/src/features/Privacy.tsx`
- `FE/src/features/NotFound.tsx`

The Vietnamese CSV/Excel header aliases in `BulkStudentImport.tsx` are intentionally retained to support Vietnamese import files: `địa chỉ email`, `mã sinh viên`, `họ và tên`, `họ tên`, `lớp`, and `tên lớp`. Targeted ESLint and `git diff --check` passed.

## Batch 8 prompt (completed)

Copy and paste:

```text
Continue the UI-English refactor. Translate every user-visible Vietnamese string in the following files only:

- FE/src/features/admin/AnalyticsReport.tsx
- FE/src/features/admin/AuditLogViewer.tsx
- FE/src/features/admin/MetricMethodologyReference.tsx
- FE/src/features/admin/SystemPolicyConfig.tsx
- FE/src/components/common/BulkStudentImport.tsx
- FE/src/features/Login.tsx
- FE/src/features/ResetPassword.tsx
- FE/src/features/Profile.tsx
- FE/src/features/Landing.tsx
- FE/src/features/Privacy.tsx
- FE/src/features/NotFound.tsx

Translate every user-visible Vietnamese string, including import validation and downloadable-template messages. Keep parser aliases that deliberately accept Vietnamese spreadsheet headers unless changing them is explicitly safe; call these out in the report. Preserve all system identifiers and behavior. Use UI_ENGLISH_REFACTOR_GUIDE.md terminology. Run a targeted Vietnamese-text search afterwards.
```

## Completed – Batch 9: Shared libraries, tests, and final audit

Translated and verified:

- `FE/src/lib/presentation.ts`
- `FE/src/lib/course-term.ts`
- `FE/src/lib/course-exam-action.ts`
- `FE/src/lib/api.ts`
- `FE/src/lib/presentation.test.ts`
- `FE/src/components/common/ui-foundation.test.tsx`
- `FE/src/features/Profile.test.tsx`
- `FE/src/features/lecturer/CourseDetail.test.tsx`
- `FE/src/features/lecturer/CreateCourse.test.tsx`
- `FE/src/features/lecturer/LecturerDashboard.test.tsx`

The final source audit found no Vietnamese user-visible text in `BE/src`. The remaining Vietnamese text is intentionally retained only in `BulkStudentImport.tsx` CSV/Excel header aliases, plus Vietnamese names and exam titles in test fixtures. `Bélády` remains as the proper name in a sample question.

Verification: `git diff --check` passed, `npm test` passed (15 files, 30 tests), and `npm run lint:frontend` passed with pre-existing warnings only. The broader `npm run lint` includes generated `.next-dev` and `.open-next` files and reports pre-existing generated-file errors.

## Batch 9 prompt (completed)

Copy and paste:

```text
Perform the final UI-English audit. Search all FE/src and BE/src source files for Vietnamese user-visible text, including text in constants/config, dynamic string concatenation, validation, errors, and toasts. Translate remaining UI/API user messages only; do not translate code comments, docs, variable names, API/database fields, routes, enums, or business logic.

Also inspect and update relevant test expectations/fixtures where their displayed strings changed. Do not translate Vietnamese import-header aliases that are intentionally accepted as input unless there is an English equivalent alongside them. Run git diff --check and the appropriate frontend lint/test or build command. Report: (1) every changed file, (2) remaining Vietnamese text intentionally retained and why, and (3) uncertain business terminology.
```
