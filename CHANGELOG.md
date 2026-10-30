# Changelog

All notable changes to the **Hostel Allocation & Roommate Matching System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Phase 2: Environment Setup

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

