# Changelog

All notable changes to the **Hostel Allocation & Roommate Matching System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Phase 3: Database Development (In Progress)

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

