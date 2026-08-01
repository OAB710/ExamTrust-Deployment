# ExamTrust architecture audit — 2026-08-01

## 1. Current architecture

The application is a Next.js frontend (`FE`) over a NestJS REST API (`BE`),
with Prisma/MySQL for persistence. Authentication is JWT based; the API owns
authorization through guards plus `AccessPolicyService`. The critical flow is
course/enrolment -> exam draft -> published `ExamSnapshot` -> student
`ExamInstance`/`ExamSubmission` -> autosave/submit -> grading/result release.

The intended data graph is sound in direction: `Question -> QuestionVersion`,
`Exam -> ExamSnapshot -> QuestionSnapshot`, and `ExamSubmission ->
SubmissionAnswer`. The implementation is still partially transitional: legacy
question/exam fields coexist with version/snapshot fields and must therefore be
treated carefully at every read/write boundary.

Role boundary map:

| Role | Permitted scope |
| --- | --- |
| Admin | System-wide administration and review. |
| Lecturer | Only courses/exams they own or teach, including grading/review. |
| Student | Their active enrolments, their available exam payload, and their own submissions. |

## 2. Top urgent issues

| Code | Severity | Module | Issue | Consequence | Resolution |
| --- | --- | --- | --- | --- | --- |
| AUTH-001 | P0 | Auth | Public `POST /auth/register` accepted `role: ADMIN` or `LECTURER`. | Full privilege escalation. | Fixed: public registration is student-only. |
| EXAM-001 | P0 | Exam access | Student detail endpoint checked publication/enrolment but not the opening/closing time. | An enrolled student could obtain question content before the scheduled exam. | Fixed: server rejects payload outside its time window. |
| SUB-001 | P0 | Results | Student submission endpoints selected and returned `Question.correctAnswer`. | Answer keys were recoverable directly from Network before release. | Fixed: answer keys now come only from immutable snapshots after explicit result publication. |
| SUB-002 | P0 | Attempt lifecycle | Autosave and submit did not enforce the server deadline; only start checked it. | A direct request could alter/submit work after time expired. | Fixed: autosave is rejected after the earliest of the individual and scheduled deadlines; submit finalizes persisted autosave state only. |
| SUB-003 | P0 | Autosave | Autosave validated question IDs against mutable `exam_questions`, not the submission snapshot. | Editing an exam could cause saved answers to be ignored or linked to changed question data. | Fixed: autosave now accepts only IDs/versions/snapshots from `ExamSubmission.examSnapshot`. |
| EXAM-002 | P1 | Exam authoring | Published exams could still have settings, scores, order, and question list changed. | UI payload, autosave and historical snapshots could diverge. | Fixed: structural edits are draft-only; publish is draft-only. |
| GRADE-001 | P1 | Manual grading | Grading ceiling used current Question/QuestionVersion points, not the answer snapshot. | A later question edit could prevent or distort grading of a historical attempt. | Fixed: snapshot assigned score is now authoritative. |

## 3. Findings by module

### Authentication and authorization

`AUTH-001` was fixed above. The existing ownership checks in
`AccessPolicyService` are generally applied to exam and submission instructor
routes. Continue using them for every route accepting an exam, submission, or
flag ID; hiding UI controls is not authorization.

`AUTH-002` (P1): `EnrollmentsController.findByStudent` lets any lecturer call
`GET /enrollments/student/:studentId`; it only limits students to themselves.
This exposes enrolment history outside a lecturer's courses. Change the service
to require an actor and, for lecturers, filter to their own course IDs.

`AUTH-003` (P1): `CoursesService.findOne` includes all enrolments and student
email/ID before returning a course to an enrolled student. Return an aggregate
or the caller's own enrolment for the student view; reserve the roster for the
course instructor/admin endpoint.

### Exams, attempts and scoring

`EXAM-003` (P1): `ExamInstance` is unique by `(examId, studentId)`, while
submissions support multiple attempts. Re-opened attempts update the instance
status; its immutable snapshot must never be replaced. The current patch stops
replacement, but a follow-up should make the read model consistently use the
instance payload/order when an instance already exists.

`EXAM-004` (P1): status is represented by free-form `status` strings alongside
nullable enum mirrors (`statusEnum`) on Course, Exam and Submission. This can
produce values such as `FINALIZED` that are absent from the enum. Introduce a
single canonical lifecycle in an additive migration, backfill it, then make API
state transitions explicit.

`EXAM-005` (P2): `startExam` has a race between checking for an active
submission and creating the next attempt. The unique key prevents duplicate
records, but its catch path relies on a database-specific constraint name.
Use an idempotency key on start plus a transaction/unique-error normalizer.

### Question bank and AI

`QUESTION-001` (P1): `QuestionsV2Service.updateQuestion` overwrites the live
Question fields without creating a `QuestionVersion`. Snapshots protect
published attempts, but the question-bank revision history is incomplete and
AI source freshness is less reliable. Route edits through a transaction that
creates the next version and atomically updates `latestVersionNo`.

`QUESTION-002` (P1): `ExamQuestion.questionVersionId` remains nullable and
`questionId` remains the operational key. New data must require an approved
version; use the existing backfill proposals to resolve legacy rows before a
future NOT NULL/FK migration. Do not drop the legacy column yet.

`AI-001` (P2): `AIGenerationRecord` status has no explicit CANCELLED/TIMEOUT
state and no persisted retry/idempotency key. Add fields additively and enforce
one active job per draft/section before relying on this workflow operationally.

### Integrity, analytics and UI

`INTEGRITY-001` (P1): raw logs are append-only in practice but lack a durable
deduplication key. Retry/reconnect can inflate counters/risk signals. Add a
client event ID with a unique composite key such as `(submissionId, eventId)`;
retain raw evidence and compute risk as a review signal, never a verdict.

`ANALYTICS-001` (P2): analytics use a mix of submission answers, current
question relations and snapshots. All historical item metrics should resolve
the version/snapshot at exam time, not a mutable question row.

`UI-001` (P2): `FE/src/features/student/JoinExam.tsx` and
`ScanQRJoinExam.tsx` contain mock validation paths; `FeedbackDetail.tsx` and
`grading-template.tsx` contain static mock content. Ensure those components are
not routed as production data views, or label/remove the mock paths.

## 4. Implemented changes

| File | Previous behaviour | New behaviour |
| --- | --- | --- |
| `BE/src/auth/auth.service.ts` | Client chose registration role. | Public signup always creates STUDENT; privileged role request is rejected. |
| `BE/src/exams/exams.service.ts` | Detail payload was available whenever published. Published exams were mutable. | Time-window check before payload; exam structure/settings are draft-only. |
| `BE/src/submissions/submissions.service.ts` | Answer key came from current question; autosave used mutable exam links; expiry was client-side. | Snapshot-based student view/autosave/grading ceiling; server deadline; explicit publication time. |
| `BE/src/submissions/submissions.controller.ts` | Student response used the unsanitized submission model. | Student endpoint applies the safe result view. |
| `BE/prisma/schema.prisma` | No durable result release state. | Adds nullable `Exam.resultsPublishedAt`. |

## 5. Database migration

Migration `20260801120000_add_exam_results_published_at` only adds a nullable
column and index. It does not rewrite, delete, or reset any data. Existing
results are intentionally treated as unpublished until an instructor performs
the explicit release action. Rollback is `DROP INDEX exams_resultsPublishedAt_idx
ON exams; ALTER TABLE exams DROP COLUMN resultsPublishedAt;` only if no release
timestamp has been written; otherwise restore from a backup instead.

Do not execute it with `prisma migrate reset`. Apply normally with the existing
deployment process after a database backup and a preflight check that the column
does not already exist.

## 6. Verification

- `npm run prisma:generate` — passed.
- `npm run build` in `BE` — passed.
- ESLint on touched backend files — passed.
- `jest submissions/submissions.snapshot-score.spec.ts --runInBand` — passed
  (3 tests). The stale constructor wiring in that test was aligned with the
  current service dependencies.

No live database migration or destructive data operation was run. API role and
multi-tab checks require a running environment and seeded accounts, so they
remain deployment smoke-test items.

## 7. Remaining work

- P1: AUTH-002, AUTH-003, EXAM-003, EXAM-004, QUESTION-001, QUESTION-002,
  INTEGRITY-001.
- P2: EXAM-005, AI-001, ANALYTICS-001, UI-001; add lifecycle transition tests
  and role/ownership integration tests.
- P3: replace per-row loops in bulk enrolment/question insertion with bounded
  transactions; consolidate compatibility raw SQL after the v2 backfill is
  complete; add retention/aggregation jobs for high-volume interaction logs.
