# Refactor backlog — source-size guideline

This backlog tracks source files above the soft 600-line guideline. It is not a request to split every file mechanically: schema, seed, generated code and configuration are excluded.

## Wave 1 — Question and course management

- `FE/src/features/lecturer/QuestionBankManagement.tsx`: finish extracting preview/copy dialogs and remaining interaction hooks.
- `FE/src/features/lecturer/QuestionEditor.tsx`: split editor steps, draft persistence and question-type renderers.
- `FE/src/features/lecturer/CreateCourse.tsx`, `CourseDetail.tsx`, and course-management screens: split forms, tables and import/enrollment flows.

## Wave 2 — Exam workflows

- `FE/src/features/lecturer/CreateExam.tsx`: separate form sections, selection strategy and validation.
- `FE/src/features/lecturer/ExamAnalytics.tsx`, `ExamMonitor.tsx`, and management pages: extract charts, filters, polling and action dialogs.
- `BE/src/exams/exams.service.ts`: separate lifecycle, snapshots/question assignment, links and quality review services behind the existing controller contract.

## Wave 3 — Submission and integrity workflows

- `FE/src/features/student/ExamTaking.tsx`: split timer, navigation, autosave, integrity collection and submission handling.
- `BE/src/submissions/submissions.service.ts`: separate instance start, autosave, scoring/submit, integrity events and manual grading.
- `FE/src/features/admin/IntegrityOverview.tsx`: extract list filters, case table and review dialog.

## Wave 4 — Question/AI platform services and API client

- `BE/src/questions-v2/questions-v2.service.ts`: draft, versioning, metadata/topics and analytics/history services.
- `BE/src/ai/ai.service.ts`: prompts/profiles, generation, validation and job orchestration.
- `FE/src/lib/api.ts`: domain clients with a backwards-compatible `api` facade.

Every wave must preserve routes, response contracts, UUID references, existing seed data and historical exam snapshots. Run lint, build and relevant tests before merging each wave.
