# Software Requirements Specification (SRS)
## Hostel Allocation & Roommate Matching System

**Document Version:** 1.0.0  
**Status:** Approved for Phase 1 Architecture  
**Target Environment:** Django 6.1, Python 3.13, PostgreSQL, NGINX, Gunicorn, Vanilla HTML/CSS/JS  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the complete functional and non-functional requirements for the **Hostel Allocation and Roommate Matching System**. It serves as the authoritative specification for all development phases, system modeling, database design, testing, and deployment.

### 1.2 Scope
The system automates the end-to-end lifecycle of university accommodation for educational institutions. The platform handles:
- Verification of student identities against an authoritative pre-enrolled student registry.
- Multilevel academic and accommodation structural management.
- Dynamic room browsing with real-time bed availability indicators.
- Submission of prioritized accommodation applications (up to 3 hostel choices).
- Deterministic 7-factor lifestyle roommate compatibility matching.
- Formation of mutually agreed roommate groups (2, 3, or 4 students depending on room capacity).
- Atomic, race-condition-free bed allocations with administrative approval workflows.
- Real-time in-app notifications, comprehensive audit logging, and occupancy reporting.

### 1.3 Out-of-Scope (Strict Exclusions)
- **No Third-Party Frontend Frameworks:** No React, Vue, Angular, or Tailwind CSS. Frontend must be pure Django Templates, HTML5, semantic CSS3, and Vanilla JavaScript.
- **No Machine Learning or External AI Services:** No OpenAI, Gemini, scikit-learn, or heuristics black-boxes. The roommate matching algorithm is strictly a deterministic, transparent Python weighted mathematical calculation.
- **No Smoking Preferences:** Smoking habits are excluded entirely from questionnaires, algorithms, and models.
- **No Direct Real Student Data:** Test and staging environments must exclusively use synthetic records.

---

## 2. Overall Description

### 2.1 User Roles and Permissions (RBAC)

The system enforces three primary operational roles with backend verification on all endpoints:

| Role | Scope & Permissions |
|---|---|
| **University Administrator** | Global authority. Manages academic entities, official student registry, hostels, blocks, floors, rooms, beds, facilities, accommodation cycles, warden assignments, system configuration, global approval of applications, bed reallocations, occupancy analytics, and full audit trails. |
| **Hostel Warden** | Scoped strictly to assigned hostel(s). Can view resident rosters, room occupancy, and incoming applications for assigned buildings. Has delegated approval authority if explicitly granted by an Administrator; otherwise acts as reviewer/recommender. |
| **Student** | Self-service access. Verifies identity using Student ID and institutional email. Manages profile, completes 7-factor roommate preferences, searches eligible hostels, submits up to 3 prioritized hostel/room applications per cycle, sends/accepts roommate requests (aligned on room choices), and tracks allocation status. |

### 2.2 System Architecture Overview

```
                      +---------------------------------------+
                      |       Client Browser (Desktop/Mobile) |
                      |    (HTML5 / Semantic CSS3 / Vanilla JS)|
                      +-------------------+-------------------+
                                          | HTTPS / Port 443
                                          v
                      +---------------------------------------+
                      |         NGINX Web Server              |
                      |  - Reverse Proxy                      |
                      |  - SSL/TLS Termination                |
                      |  - Static / Media File Serving        |
                      +-------------------+-------------------+
                                          | Unix Socket / HTTP
                                          v
                      +---------------------------------------+
                      |         Gunicorn WSGI Server          |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Django 6.1 Monolith             |
                      |  - 10 Modular Apps (accounts, etc.)   |
                      |  - Deterministic Matching Engine      |
                      |  - Transactional Allocation Engine    |
                      +-------------------+-------------------+
                                          | psycopg
                                          v
                      +---------------------------------------+
                      |         PostgreSQL Database           |
                      |  - ACID Transactions & Strict FKs     |
                      |  - Pessimistic Locks (select_for_update)
                      |  - Composite B-Tree Indexes           |
                      +---------------------------------------+
```

---

## 3. Academic and Accommodation Hierarchies

### 3.1 Academic Hierarchy
All students must belong to a verified academic structure:
$$\text{University} \longrightarrow \text{Department} \longrightarrow \text{Degree Program} \longrightarrow \text{Branch} \longrightarrow \text{Admission Batch} \longrightarrow \text{Student Registry} \longrightarrow \text{Student Enrollment}$$

- **Admission Batch:** Entry year and cohort rules.
- **Student Enrollment:** Tracks active academic year and semester for current eligibility checks.

### 3.2 Accommodation Hierarchy
Physical inventory is strictly organized as follows:
$$\text{University} \longrightarrow \text{Hostel} \longrightarrow \text{Block} \longrightarrow \text{Floor} \longrightarrow \text{Room} \longrightarrow \text{Bed}$$

- **Room Capacities:** Supported room capacities are 1, 2, 3, or 4 beds.
- **Facilities:** Configurable attributes mapped to rooms (e.g., Attached Washroom, Air Conditioning, Geyser, Balcony).
- **Hostel Eligibility:** Hostels enforce gender policies (`MALE`, `FEMALE`, `CO_ED`) and optional program or year-of-study restrictions.

---

## 4. Functional Requirements

### 4.1 Student Registry & Identity Verification (FR-01)
- **FR-01.1:** Official student records must be pre-populated in `StudentRegistry` (via Admin import) containing `student_id`, `full_name`, `institutional_email`, `gender`, `branch_id`, `batch_id`, and `enrollment_status`.
- **FR-01.2:** A student can register an online account only by providing a valid `student_id` and matching `institutional_email`.
- **FR-01.3:** An activation token/verification code is dispatched to the institutional email to complete registration.
- **FR-01.4:** Each `StudentRegistry` record can link to at most one user account. Duplicate registrations are rejected.

### 4.2 User Authentication & Session Security (FR-02)
- **FR-02.1:** Uses Django's PBKDF2 with SHA-256 password hashing.
- **FR-02.2:** Secure session management with session timeout, cookie encryption, and rotation on login.
- **FR-02.3:** Backend RBAC decorators enforce route-level authorization. Access violations trigger HTTP 403 Forbidden.

### 4.3 Accommodation Cycles & Eligibility (FR-03)
- **FR-03.1:** Applications are accepted only during an active `AccommodationCycle` configured with start/end submission dates.
- **FR-03.2:** A student can have **exactly one active application per cycle**.
- **FR-03.3:** The system validates that the student's verified gender matches the hostel's gender policy.

### 4.4 Hostel & Room Discovery (FR-04)
- **FR-04.1:** Students can filter hostels by gender eligibility, block, facilities (AC/Non-AC, Attached Washroom), and available room capacities.
- **FR-04.2:** Real-time display of total rooms, occupied beds, and remaining available beds per room.
- **FR-04.3:** Direct selection: The student selects their desired **Room**; the specific **Bed** is automatically assigned upon allocation.

### 4.5 Application Submission (FR-05)
- **FR-05.1:** Students can submit up to **3 prioritized hostel choices** (`priority` values 1, 2, and 3).
- **FR-05.2:** For each choice, the student selects the target Hostel and optionally a preferred Room/Room Type.
- **FR-05.3:** Submitted applications enter the `PENDING_REVIEW` state and generate an immutable entry in `ApplicationStatusHistory`.

### 4.6 Roommate Compatibility Questionnaire & Algorithm (FR-06)
- **FR-06.1:** Students complete a 7-factor questionnaire. Each factor uses standardized integer categorical scales (1 to 5) or categorical options normalized to $[0, 1]$:
  1. **Sleeping Schedule (22%):** Early riser vs. night owl ($w_1 = 0.22$)
  2. **Cleanliness (17%):** Frequency of tidying and personal organization ($w_2 = 0.17$)
  3. **Study Habits (17%):** Study environment preference: silence vs. ambient sound/group ($w_3 = 0.17$)
  4. **Noise Tolerance (11%):** Low, medium, high tolerance ($w_4 = 0.11$)
  5. **Food Preferences (11%):** Dietary habits (Veg, Non-Veg, Flexible) ($w_5 = 0.11$)
  6. **Social Preferences (11%):** Introvert, balanced, highly social ($w_6 = 0.11$)
  7. **Room Temperature (11%):** AC/cooling preference ($w_7 = 0.11$)
- **FR-06.2:** Compatibility Formula:
  $$\text{Compatibility Score} = \left( \frac{\sum_{i=1}^{7} w_i \cdot s_i}{\sum_{i=1}^{7} w_i} \right) \times 100$$
  where $w_i$ is the factor weight and $s_i \in [0, 1]$ is the absolute similarity score between student $A$ and student $B$:
  $$s_i = 1 - \frac{|x_{A,i} - x_{B,i}|}{\text{MaxRange}_i}$$
- **FR-06.3:** Smoking preferences are strictly excluded from all questionnaire forms, models, and calculation routines.
- **FR-06.4:** Algorithm is symmetric: $\text{Score}(A, B) \equiv \text{Score}(B, A)$.

### 4.7 Roommate Requests & Group Formation (FR-07)
- **FR-07.1:** Students can search for potential roommates by Student ID or view top compatibility recommendations.
- **FR-07.2:** Roommate groups support **2, 3, or 4 students**, not exceeding the selected room's maximum bed capacity.
- **FR-07.3:** **Mutual Alignment Rule:** A roommate request can only be accepted if all participants have selected the same common hostel and room. If preferences differ, the system notifies both students to align their application choices before confirming the group.
- **FR-07.4:** Manual roommate agreements take precedence over algorithmic recommendations during allocation.

### 4.8 Transactional Allocation Engine (FR-08)
- **FR-08.1:** Allocations are executed inside an atomic database transaction (`transaction.atomic()`).
- **FR-08.2:** The allocation service uses row-level locking (`select_for_update()`) on candidate `Bed` records to prevent race conditions during concurrent approvals.
- **FR-08.3:** **Approval Hierarchy:** The University Administrator holds primary approval authority. Wardens may approve allocations only if granted explicit `delegated_approval` permissions for their assigned hostel.
- **FR-08.4:** Automated Bed Assignment: When a room application is approved, the engine selects the next vacant bed in the chosen room, marks its status as `OCCUPIED`, and creates an active `Allocation` record.
- **FR-08.5:** Double-Allocation Prevention: A unique constraint prevents any student from having more than one active allocation (`is_active=True`) simultaneously.

### 4.9 Notifications & Communication (FR-09)
- **FR-09.1:** In-app notification records are generated for:
  - Account verification and activation.
  - Receipt, acceptance, or rejection of roommate requests.
  - Application status transitions (`UNDER_REVIEW`, `APPROVED`, `ALLOCATED`, `REJECTED`, `WAITLISTED`).
  - Allocation confirmation with room and bed details.

### 4.10 Reporting, Analytics & Audit Trail (FR-10)
- **FR-10.1:** Occupancy reports display total rooms, bed capacity, occupied beds, vacant beds, and occupancy percentage per hostel/block/floor.
- **FR-10.2:** Every critical administrative and warden action (approval, rejection, manual override, reallocation, warden assignment) creates an immutable `AuditLog` entry.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Security & Privacy
- **CSRF & XSS:** Django CSRF middleware active on all POST/PUT/DELETE forms. All template variables safely escaped by default.
- **SQL Injection Prevention:** 100% of queries use Django ORM parameterization. Raw SQL is strictly prohibited.
- **Brute-Force & Rate Limiting:** Sensitive endpoints (login, registration, student verification lookup) must enforce rate limiting (e.g., 5 requests per minute per IP).
- **Data Minimization:** Roommate preference factors display similarity scores, not private raw answers, to other students.

### 5.2 Performance & Scalability
- **Synthetic Load Benchmark:** Architecture designed to handle a registry capacity of up to 10,000,000 student records using indexing, selective query fields, and server-side pagination.
- **Query Optimization:** Strict enforcement of `select_related()` for foreign keys and `prefetch_related()` for reverse relations and many-to-many fields to eliminate N+1 queries.
- **Pessimistic Locking:** Database row locks (`select_for_update`) during bed assignment ensure zero overbooking even during peak application rush periods.

### 5.3 Reliability & Maintainability
- 100% test coverage for critical business logic: compatibility algorithm, room capacity checks, atomic allocations, and authorization restrictions.
- Strict separation of business logic into service layers (`services/`) instead of bundling rules inside views or models.

---

## 6. Assumptions and Dependencies

1. **Email Delivery:** Development uses Django console email backend (`django.core.mail.backends.console.EmailBackend`). Production will use university SMTP.
2. **PostgreSQL Version:** PostgreSQL 15+ with standard B-Tree indexing.
3. **Python Version:** Python 3.13.x with Django 6.1.x.
4. **UI Consultation Milestone:** Prior to Phase 5 execution, a complete UI/UX design proposal (wireframes, styling conventions, color schemes) must be submitted to and approved by the user.

