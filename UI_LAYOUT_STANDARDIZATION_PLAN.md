# UI Layout Standardization Plan

## Objective

Standardize the application layout using `/lecturer/analytics` as the visual reference. The goal is a consistent, responsive experience across screens without changing business logic, routes, data, or API contracts.

## Reference pattern

The Lecturer Analytics screen is the baseline for the following pattern:

- The page uses the full available content width to the right of the sidebar; it must not be constrained by the default `max-w-7xl` wrapper.
- Filter controls live in a bordered card with a leading icon, a prominent title, and a short description.
- Filter fields have compact labels, consistent control heights, and responsive grid columns.
- Empty-state cards fill the remaining viewport height where appropriate and center their content vertically.
- Content retains responsive gutters on mobile and desktop rather than stretching edge-to-edge.

## Shared implementation approach

1. Add or reuse opt-in layout props in shared components. Do not remove width limits globally.
2. Use `DashboardLayout contentClassName="max-w-none"` only for data-heavy screens that benefit from full width.
3. Reuse `FilterPanel` compact mode where it fits; add a small page-level filter header pattern only when the screen needs an icon/title/description.
4. Preserve existing filtering behavior, query state, accessibility labels, and mobile drawer behavior.
5. Use responsive grids so fields collapse cleanly on smaller viewports.

## Rollout batches

### Batch A — Lecturer data-heavy pages

- `/lecturer/exams`
- `/lecturer/courses`
- `/lecturer/course/[id]`
- `/lecturer/exam/[id]/results`
- `/lecturer/exam/[id]/monitor`
- `/lecturer/integrity`
- `/lecturer/question-bank`
- `/lecturer/analytics` (reference implementation; verify only)

### Batch B — Administrator data-heavy pages

- `/admin/courses`
- `/admin/exams`
- `/admin/integrity`
- `/admin/audit-logs`
- `/admin/reports`
- `/admin/analytics/*`
- `/admin/system-policy`

### Batch C — Student list and results pages

- `/student/courses`
- `/student/exams`
- `/student/results`
- `/student/schedule`
- `/student/feedback`

### Batch D — Detail, editor, and workflow pages

- Course detail and exam detail pages
- Create/edit course and exam flows
- Question editor and question history
- Manual grading, exam preview, and quality review
- Profile, settings, login, reset password, and public pages

## Per-screen checklist

- [ ] Decide whether full-width content is appropriate; apply it only where tables, filters, charts, or dense content benefit.
- [ ] Replace inconsistent filter sections with the reference filter-card pattern.
- [ ] Use an icon, title, and concise description when filters are a primary page action.
- [ ] Use compact controls and remove redundant group labels.
- [ ] Ensure the filter grid has sensible desktop and mobile breakpoints.
- [ ] Ensure empty states fill the remaining viewport only when there is no primary list/chart content.
- [ ] Verify horizontal scroll behavior for tables at narrow widths.
- [ ] Verify at normal zoom, 125%, 150%, and 200% browser zoom.
- [ ] Verify keyboard navigation, visible focus states, labels, and screen-reader names.

## Acceptance criteria

- Data-heavy pages use the available content width instead of appearing as a narrow centered column on wide or zoomed displays.
- Filter sections look consistent, remain compact, and do not leave oversized blank areas.
- No page loses functionality, filtering behavior, or accessibility metadata.
- Mobile layouts remain usable without horizontal clipping.
- Each rollout batch is validated with targeted lint/type-check and visual review before starting the next batch.

## Current status

- Reference implementation: `/lecturer/analytics` complete.
- Shared opt-in full-width support: complete through `DashboardLayout.contentClassName`.
- Shared filter-card support: complete through `FilterPanel.compact`, including an icon, title, description, and responsive filter grid.
- Batch A complete: `/lecturer/exams`, `/lecturer/courses`, `/lecturer/course/[id]`, `/lecturer/exam/[id]/results`, `/lecturer/exam/[id]/monitor`, `/lecturer/integrity`, `/lecturer/question-bank`, and `/lecturer/analytics` now use the full-width pattern where appropriate.
- Batch B complete: Admin courses, exams, integrity, users, audit logs, dashboard/report entry point, system policy, and analytics use the full-width pattern where appropriate; list filters use the shared compact filter-card pattern.
- Batch C complete: Student courses, exams, results, schedule, and feedback use the full-width pattern where appropriate; list filters use the shared compact filter-card pattern.
- Batch D complete: course/exam details, question editing and history, quality review, create workflows, exam-link management, manual grading, and grading breakdown use full width where it improves dense content. Reading-focused, authentication, QR, and compact form workflows retain intentional max-width constraints.
- Extended coverage complete: lecturer and student dashboards, profile/settings, document upload, event timeline, exam preview, and administrator methodology/transparency pages now use the full-width page pattern when they contain multiple panels or data views.
- Final audit: administrator analytics reports and the student grading template now use full width. The only intentionally constrained Dashboard workflows are Join Exam, Scan QR, Ready Check, and the lecturer QR view, because each centers a single task; loading-only branches retain their existing lightweight wrapper.
- Date-range filter rule: suppress redundant group labels such as “Created At”, “Created date”, “Joined Date”, and “Start time” when the control already displays “From date” and “To date”. This keeps compact filter cards short and prevents empty space above the date inputs.
