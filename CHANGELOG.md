# Changelog

All notable changes to the **Hostel Allocation & Roommate Matching System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.11.0] - Phase 11: Testing and Security

### Added
- Implemented comprehensive Role-Based Access Control (RBAC) test suite (`tests/test_permissions.py`):
  - Verified role isolation across Anonymous, Student, Warden, and Admin actors.
  - Proved unauthenticated access to protected endpoints is strictly redirected to login.
  - Proved student cannot access warden/administrative endpoints or execute application reviews.
  - Enforced object-level student privacy: verified cross-student application detail access is rejected with HTTP 403 Forbidden.
  - Verified warden scoping to assigned buildings and admin campus-wide authority.
- Implemented core security defenses test suite (`tests/test_security_defenses.py`):
  - CSRF Defense: verified state-altering POST requests without valid CSRF tokens are rejected with HTTP 403 Forbidden.
  - XSS Defense: verified raw HTML and `<script>` payloads in notifications, profile fields, and search queries are automatically escaped into safe HTML entities.
  - SQL Injection Immunity: tested SQL injection vectors (`' OR '1'='1'`, UNION SELECT, semicolon chaining) across query parameters and login forms, verifying ORM parameterized query safety.
  - Session Fixation Prevention: verified session key regeneration on authentication and complete session destruction on logout.
- Implemented synthetic load and database performance test suite (`tests/test_performance_load.py`):
  - Verified candidate recommendation ranking across 50 synthetic student profiles completes in $< 250$ ms.
  - Verified occupancy census reporting on 75 beds executes in bounded query count ($\le 8$ queries) with zero $N+1$ query regressions.
  - Verified intake and branch analytics aggregate across applications in single database aggregation queries.
- Implemented audit logging and privacy compliance test suite (`tests/test_audit_and_privacy.py`):
  - Verified complete exclusion of smoking attributes from models, forms, and candidate feeds.
  - Verified candidate discovery feeds never leak sensitive student PII (guardian contacts, phone numbers, dates of birth).
  - Verified transactional immutable audit history logging on all application lifecycle transitions and allocation cancellations.
- Total test coverage expanded to **136 / 136 tests passing (100% success rate)**.

## [0.10.0] - Phase 10: Notifications and Reporting

### Added
- Implemented multi-channel transactional notification dispatcher (`apps.notifications.services.dispatcher`):
  - `send_notification`: Records persistent in-app `Notification` database entries and dispatches transactional emails via Django `send_mail`.
  - Notification triggers integrated across core application events:
    - Application submitted, approved, waitlisted, and rejected alerts.
    - Roommate request sent, received, accepted, and rejected notifications.
    - Bed allocation confirmations with hostel, block, room, and bed identifier details.
  - Read tracking and bulk actions: `mark_notification_as_read`, `mark_all_notifications_as_read`.
- Implemented notification center views and UI:
  - `templates/notifications/notification_list.html`: In-app notification center with read/unread styling, date formatting, and bulk "Mark all as read" capability.
  - Added global notifications navigation indicator in `templates/base.html`.
- Implemented occupancy reporting & executive analytics service (`apps.hostels.services.reports`):
  - `get_detailed_occupancy_report`: Real-time bed occupancy census, capacity calculations, vacancy ratios, and filtered bed roster; properly role-scoped (Administrators see campus-wide; Wardens see assigned buildings only).
  - `generate_occupancy_csv`: High-performance streaming CSV export with timestamped filenames for institutional audit records.
  - `get_intake_and_branch_analytics`: Aggregations of hostel application statuses, branch/department distribution, and per-building fill rates.
- Implemented administrative reporting views and templates:
  - `templates/hostels/occupancy_report.html`: Census overview with KPI stat cards (Total Beds, Occupied, Vacant, Maintenance, Occupancy Rate), hostel and status filters, paginated bed roster, and CSV export link.
  - `templates/hostels/analytics.html`: Executive visual dashboard showing application funnel breakdown, branch demand distribution bars, and building capacity progress meters.
  - Created custom `templates/403.html` branded access-denied page for role-restricted reporting endpoints.
- Authored 14 tests across reports, CSV exports, intake analytics, notification dispatcher, and notification views:
  - Full project test suite running **109/109 tests passing (100% success rate)**.

## [0.9.0] - Phase 9: Allocation Engine

### Added
- Implemented pre-allocation eligibility and cycle validation service (`apps.allocations.services.eligibility`):
  - `validate_student_for_allocation`: Enforces active student registry enrollment status (`ACTIVE`), active user account, open cycle window, approved application status, and rejects students with pre-existing active allocations.
  - `validate_roommate_group_for_allocation`: Enforces group bounds (2–4 members $\le$ room capacity), individual member eligibility, and verifies sufficient vacant beds (`BedStatus.VACANT`) in the agreed target room.
  - `get_allocatable_applications_for_cycle`: High-speed batch query filtering allocatable applications.
- Implemented transactional bed allocation engine (`apps.allocations.services.engine`):
  - `allocate_individual_student`: Implements Decision 2 (Automatic Bed Assignment) using pessimistic database row locking (`select_for_update()`) on vacant beds; executes priority fallback across student's 1st, 2nd, and 3rd choices; cleanly transitions to `WAITLISTED` if all choices are exhausted.
  - `allocate_roommate_group`: Executes atomic collective placement for confirmed roommate groups in their agreed room with simultaneous bed locking.
  - `cancel_or_release_allocation`: Deactivates allocation, frees occupied bed back to `VACANT`, restores room status to `AVAILABLE`, marks application `CANCELLED`, and logs audit trail.
- Enforced database-level concurrency safeguards:
  - `unique_active_bed_allocation`: Prevents overlapping active allocations for the same physical bed.
  - `unique_active_student_allocation`: Prevents a single student from holding multiple active bed allocations.
- Authored 17 comprehensive unit, integration, and multi-threaded concurrency stress tests (`test_eligibility.py`, `test_engine.py`, `test_concurrency.py`):
  - Parallel workers race condition test proves zero possibility of double bookings under concurrent execution: **95/95 tests passing (100% success rate)**.

## [0.8.0] - Phase 8: Roommate Management & Compatibility Algorithm

### Added
- Implemented 7-factor roommate lifestyle questionnaire form (`apps.roommates.forms.RoommatePreferenceForm`):
  - Validates 7 lifestyle dimensions: sleeping schedule (22%), cleanliness (17%), study habits (17%), noise tolerance (11%), food preference (11%), social preference (11%), and room temperature (11%).
  - Enforces strict zero-smoking policy with instant validation rejection on any submitted smoking parameters.
  - Enforces 100% questionnaire completeness.
- Implemented roommate request & mutual alignment service (`apps.roommates.services.requests`):
  - `send_roommate_request`: Supports direct lookup by Student ID, enforces single-gender validation, active cycle checks, duplicate prevention, and group capacity limits.
  - `respond_to_roommate_request`: Implements Decision 4 (Mutual Room Alignment Rule) verifying identical room selections before confirmation; manages automatic `RoommateGroup` creation, bed capacity limits (2–4 beds), and auto-cancellation of conflicting pending requests.
  - `cancel_roommate_request` & `leave_roommate_group`: Allows voluntary withdrawal and group auto-disbanding when below 2 members.
- Implemented pure Python deterministic compatibility scoring engine (`apps.roommates.services.algorithm`):
  - Zero external AI APIs and zero machine learning models.
  - Normalized ordinal distance metric $s_i = 1 - (|x_A - x_B| / 4)$ and categorical dietary compatibility logic.
  - Strictly proves and enforces mathematical symmetry: $\text{Score}(A, B) \equiv \text{Score}(B, A)$.
  - Cached match score lookups using canonical student primary key ordering (`student_a_id < student_b_id`).
- Implemented candidate recommendation service (`apps.roommates.services.recommendations`):
  - Ranks prospective same-gender candidates descending by compatibility score and generates lifestyle alignment highlight chips.
- Implemented responsive Django templates and views:
  - `templates/roommates/preferences.html`: Semantic questionnaire card layout with weight indicators.
  - `templates/roommates/discover.html`: Candidate recommendation feed with match percentages and direct Student ID search bar.
  - `templates/roommates/requests.html`: Request center with group capacity visualizer, bed slot cards, and mutual room alignment badges.
- Authored 26 comprehensive unit and integration tests across forms, requests, algorithm symmetry, boundary conditions, and views: **78/78 tests passing (100% success rate)**.

## [0.7.0] - Phase 7: Student Applications

### Added
- Implemented eligibility and accommodation cycle verification service (`apps.applications.services.eligibility`):
  - `verify_student_application_eligibility`: Validates student profile completeness, registry active status, open accommodation cycle window, and ensures single active application per cycle constraint.
  - `get_eligible_hostels_and_rooms`: Scopes visible hostels by verified student gender (`MALE` -> Boys/Co-Ed, `FEMALE` -> Girls/Co-Ed) and surfaces room inventory with real-time bed availability.
- Implemented multi-priority choice and submission service (`apps.applications.services.submission`):
  - `submit_student_application`: Atomically creates `Application` with up to 3 prioritized choices (`ApplicationChoice` at Rank 1, 2, 3) ensuring no duplicate hostel rankings in a single application.
  - `update_application_status`: Updates status with administrative remarks, logs history entry (`ApplicationStatusHistory`), and creates notification records.
- Implemented forms in `apps.applications.forms`:
  - `ApplicationSubmissionForm`: Dynamic choice validation enforcing strictly distinct hostel rankings (Priority 1, 2, 3) and validating room choices against hostel blocks.
  - `ApplicationReviewForm`: Administrative review form supporting Under Review, Approved, Waitlisted, and Rejected decisions with mandatory remarks.
- Implemented responsive Django templates:
  - `templates/applications/apply.html`: Priority selection wizard displaying real-time fee and room details.
  - `templates/applications/application_detail.html`: Visual 5-stage status stepper (Submitted -> Under Review -> Approved / Waitlisted / Rejected) with complete chronological audit history.
  - `templates/applications/review_queue.html`: Administrative/warden queue with status badges, priority summaries, and direct review modal actions.
- Added comprehensive end-to-end workflow test suite (`apps.applications.tests.test_workflow`):
  - Tests verified eligibility checks, multi-choice submission, single active application constraint, and admin/warden review pipeline: **52/52 tests passing (100% success rate)**.

## [0.6.0] - Phase 6: Hostel Management

### Added
- Implemented administrative forms (`apps.hostels.forms`):
  - `HostelForm`, `BlockForm`, `FloorForm`, `RoomForm`, `BedForm`.
  - `WardenAssignmentForm` with strict role validation ensuring only WARDEN accounts can be assigned.
- Implemented high-efficiency occupancy aggregation service (`apps.hostels.services.occupancy`):
  - `get_hostel_occupancy_summary`: Computes total rooms, total beds, occupied, vacant, reserved, and occupancy percentage using single-pass conditional Count aggregation (eliminating N+1 query loops).
  - `get_available_rooms_query`: High-speed indexed lookup of rooms with available beds, supporting multi-criteria filtering by gender policy, AC/Non-AC, washroom type, and room capacity.
- Implemented safe bulk student registry CSV import service (`apps.academics.services.import_registry`):
  - Row-level validation for Student IDs, email formats, YYYY-MM-DD dates, and gender values.
  - In-memory resolution and verification against existing academic branches and admission batches.
  - Atomic batch insertion (`bulk_create`) with graceful skipping of existing records.
- Authored 5 new management and aggregation tests: **46/46 tests passing (100% success rate)**.

## [0.5.0] - Phase 5: Frontend UI & Design System

### Added
- Created complete semantic design system in `static/css/main.css` utilizing **Academic Navy & Royal Blue** (Palette 1) with zero external CSS frameworks:
  - Custom CSS variables for typography, spacing, border radiuses, and elevation shadows.
  - Responsive layout grids and flex containers with mobile-first breakpoints.
  - Buttons (`.btn-primary`, `.btn-secondary`, `.btn-outline`), status badges (`.badge-vacant`, `.badge-occupied`, `.badge-pending`), and stat cards.
- Authored client-side interactions in `static/js/main.js`:
  - Automatic dismissal and close handlers for system alerts.
  - Tab navigation component.
- Implemented core templates:
  - `templates/base.html`: Responsive navigation bar with role badges, authentication links, and alert banners.
  - `templates/landing.html`: Campus accommodation hero, feature highlights, and CTA banners.
  - `templates/accounts/login.html`: Dual-identity sign-in card.
  - `templates/accounts/register.html`: Two-column identity verification and registration form.
  - `templates/hostels/hostel_list.html`: Hostels exploration grid with gender filtering and real-time capacity stats.
  - `templates/hostels/hostel_detail.html`: Detailed block, floor, and room layout with individual bed status indicators.
- Created `tests/test_frontend.py` verifying template rendering: **41/41 tests passing (100% success rate)**.

## [0.4.0] - Phase 4: Authentication and Authorization

### Added
- Implemented `verify_and_register_student` service (`apps.accounts.services.registration`):
  - Strictly verifies Student ID and institutional email against `StudentRegistry`.
  - Rejects inactive or suspended student records.
  - Enforces duplicate registration prevention (atomic check on `is_registered` and existing User accounts).
  - Atomically creates `User` and linked `StudentProfile`, marks registry record claimed, and dispatches welcome `Notification`.
- Implemented custom `EmailOrStudentIDBackend` (`apps.accounts.backends`):
  - Enables dual login: Students can log in using either their Student ID or institutional email.
  - Wardens and Administrators authenticate via email.
- Created `StudentRegistrationForm` and `LoginForm` with custom validation and password policy enforcement.
- Implemented role-based backend permission decorators (`apps.accounts.decorators`):
  - `@admin_required`: Restricts view to University Administrators.
  - `@warden_required`: Restricts view to assigned Wardens and Admins.
  - `@student_required`: Restricts view to enrolled Students.
  - `@role_required`: Generic role-based decorator.
- Implemented Warden scoping utilities (`apps.hostels.services.scoping`):
  - `get_warden_assigned_hostel_ids` and `can_warden_manage_hostel`.
  - `can_warden_approve_allocation` checking delegated approval permissions.
- Authored authentication views (`RegisterView`, `LoginView`, `LogoutView`, `RoleRedirectView`).
- Created unstyled accessible HTML form templates (`register.html`, `login.html`, `placeholder.html`) adhering strictly to the directive of reserving full UI/UX design until Phase 5 user approval.
- Authored comprehensive test suite for registration verification, duplicate rejection, dual login, and RBAC: **37/37 tests passing (100% success rate)**.

## [0.3.0] - Phase 3: Database Development

### Added
- Implemented `applications` models (`apps.applications.models`):
  - `AccommodationCycle` for application windows, semesters, and intake periods.
  - `HostelApplication` with lifecycle statuses and unique constraint ensuring **exactly one active application per cycle**.
  - `ApplicationChoice` supporting up to 3 prioritized choices per application with unique rank constraints.
  - `ApplicationStatusHistory` for immutable state transition tracking.
- Implemented `roommates` models (`apps.roommates.models`):
  - `RoommatePreference` with the 7 lifestyle factors (1-5 scales, food preferences, **strictly zero smoking**).
  - `RoommateRequest` for direct student-to-student pairing requests with self-request prevention.
  - `RoommateGroup` and `RoommateGroupMember` supporting aligned groups of 2, 3, or 4 students.
  - `MatchScore` for caching calculated pairwise compatibility percentages.
- Implemented `allocations` models (`apps.allocations.models`):
  - `Allocation` with database-level concurrency protection: `unique_active_bed_allocation` (no bed double bookings) and `unique_active_student_allocation` (no student duplicate residencies).
  - `AllocationHistory` for room transfers, reallocations, and checkout history.
- Implemented `notifications` models (`apps.notifications.models`):
  - `Notification` center for lifecycle events and in-app alerts.
- Implemented `audit` models (`apps.audit.models`):
  - `AuditLog` recording actor, action, target entity, IP address, and JSON diffs.
- Registered all models with Django Admin (`applications.admin`, `roommates.admin`, `allocations.admin`, `notifications.admin`, `audit.admin`).
- Created and verified migrations for `applications`, `roommates`, `allocations`, `notifications`, and `audit`.
- Authored comprehensive test suite covering priority choices, group constraints, and allocation uniqueness: **28/28 tests passing (100% success rate)**.
- Implemented `StudentProfile` model (`apps.students.models.StudentProfile`) with One-to-One links to `User` and `StudentRegistry`, emergency contact fields, and profile completion tracking.
- Implemented physical accommodation inventory models (`apps.hostels.models`):
  - `Hostel` with `GenderPolicy` (`MALE`, `FEMALE`, `CO_ED`), `total_capacity`, and status tracking.
  - `Block`, `Floor`, `Room` (capacities 1-4, AC/Non-AC, Attached/Shared washrooms), and `Bed` (`A`, `B`, `C`, `D`).
  - Dynamic amenities through `Facility` and `RoomFacility`.
  - `WardenAssignment` supporting delegated allocation approval permissions.
- Registered student and hostel models with Django Admin (`apps.students.admin`, `apps.hostels.admin`).
- Created initial migrations `0001_initial.py` for `students` and `hostels`.
- Authored and executed 7 new unit tests for profile links, room capacity tracking, and warden delegation (18/18 tests passing).
- Implemented custom `User` model (`apps.accounts.models.User`) and `UserManager` with `Role` choices (`ADMIN`, `WARDEN`, `STUDENT`).
- Configured `AUTH_USER_MODEL = 'accounts.User'` in `config/settings/base.py` before running initial migrations.
- Implemented complete academic hierarchy in `apps.academics.models`:
  - `University`, `Department`, `DegreeProgram`, `Branch`, `AdmissionBatch`.
- Implemented authoritative pre-enrolled registry `StudentRegistry` and `StudentEnrollment` with unique constraints and composite indexes.
- Registered models in Django Admin (`apps.accounts.admin`, `apps.academics.admin`).
- Created initial migrations `0001_initial.py` for both `accounts` and `academics`.
- Authored and executed 9 new model unit tests across `apps/accounts/tests/` and `apps/academics/tests/` (11/11 tests passing).

## [0.2.0] - Phase 2: Environment Setup

### Added
- Upgraded `requirements.txt` with `psycopg[binary]`, `python-dotenv`, `pytest`, `pytest-django`, `asgiref`, and `sqlparse`.
- Created `.env.example` template and local `.env` with PostgreSQL and console email configurations.
- Transitioned Django configuration into modular settings architecture (`config/settings/base.py`, `development.py`, `production.py`).
- Configured forward-compatible Django 6+ email engine via `MAILERS`.
- Initialized all 10 modular apps under `apps/` with `services/` and `tests/` directories:
  - `apps.accounts`, `apps.academics`, `apps.students`, `apps.hostels`, `apps.applications`
  - `apps.roommates`, `apps.allocations`, `apps.notifications`, `apps.reports`, `apps.audit`
- Created `templates/`, `static/`, `media/`, and root `tests/` directories.
- Added `pytest.ini` and executed baseline environment tests (100% pass rate).
- Updated `.gitignore` with coverage and pytest cache ignore rules.
- Safely removed legacy boilerplate directory `hostel_allocation/`.

## [0.1.0] - Phase 1: Planning and Architecture

### Added
- Created `DEVELOPMENT_PROGRESS.md` covering all 12 project phases and 77 sequential tasks.
- Established master architectural decisions:
  - Students can select up to 3 prioritized hostel choices per cycle.
  - Students select rooms; the system allocates available beds automatically upon approval.
  - Final approval rests with University Administrators by default, with delegated approval support for authorized Wardens.
  - Mutual roommate requests require explicit mutual alignment on the common hostel and room before submission.
  - Roommate groups support up to room capacity (2, 3, or 4 students).
  - Student verification requires Student ID and institutional email matched against `StudentRegistry`.
  - Exactly one active application permitted per student per accommodation cycle.
  - Zero tolerance for AI/ML in roommate matching (deterministic Python algorithm with 7 weighted lifestyle factors, excluding smoking).
- Authored initial Software Requirements Specification (`documentation/SRS.md`).
- Authored System Architecture Document (`documentation/ARCHITECTURE.md`) specifying the 10-app modular Django design.
- Authored Database Design & ER Schema (`documentation/DATABASE_DESIGN.md`) detailing entities, constraints, indexes, and concurrency locking mechanisms.

