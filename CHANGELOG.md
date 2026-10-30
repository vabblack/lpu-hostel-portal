# Changelog

All notable changes to the **Hostel Allocation & Roommate Matching System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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

