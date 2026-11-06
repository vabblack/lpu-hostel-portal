# Hostel Allocation & Roommate Matching System

A full-featured, enterprise-grade residential living portal designed to streamline hostel room allocations and facilitate intelligent, deterministic roommate matching for Lovely Professional University (LPU).

---

## 🌟 Key Features

- 🏢 **Hostel & Room Management**:
  - Full inventory hierarchy: **University $\rightarrow$ Hostel $\rightarrow$ Block $\rightarrow$ Floor $\rightarrow$ Room $\rightarrow$ Bed**.
  - Covers all 14 residential complexes (Boys Hostels `BH-1` to `BH-8`, Girls Hostels `GH-1` to `GH-6`).
  - Standard rooms, studio apartments (with pantry & attached washroom), and dormitories across 1 to 8-seater configurations.
  - Air-Conditioned (AC) vs Air-Cooled options with metered kWh electricity quotas.

- 🤝 **7-Factor Deterministic Roommate Matching**:
  - Transparent, explainable mathematical compatibility algorithm (zero black-box ML, zero external APIs).
  - Evaluates: **Sleep Schedule (22%)**, **Cleanliness (17%)**, **Study Habits (17%)**, **Noise Tolerance (11%)**, **Dietary Preference (11%)**, **Social Routine (11%)**, and **AC Temperature (11%)**.
  - **Zero Smoking Policy**: Strictly excludes smoking references from all forms, feeds, and models.
  - Mutual request handshake and target room capacity alignment before group formation (2–4 members).

- ⚡ **Atomic, Concurrency-Safe Allocation Engine**:
  - Up to 3 prioritized hostel/room choices per student application.
  - Automatic bed assignment using pessimistic database row locking (`select_for_update`) to prevent overbooking and race conditions.
  - Database-level unique constraints preventing overlapping bed or student allocations.

- 👤 **Role-Based Access Control (RBAC)**:
  - **Students**: Identity claim against verified `StudentRegistry`, 7-factor preference questionnaire, candidate discovery, room browsing, and 3-choice applications.
  - **Hostel Wardens**: Scoped strictly to assigned hostel buildings; review applicants and oversee bed occupancy.
  - **University Administrators**: Global authority over inventory, cycles, registry imports, allocations, and non-repudiation audit logs.

- 🔔 **Transactional Notifications & Reporting**:
  - In-app notification center and email dispatcher for lifecycle events.
  - Real-time census reports, vacancy ratios, CSV export, and intake analytics.

---

## 🛠️ Tech Stack & Unified Architecture

The system is architected as a **Modern Headless REST API + React SPA**:

- **Frontend (`frontend/`) — Primary User Experience**:
  - **React 19 + TypeScript + Vite**: Fast, fluid client-side Single-Page Application.
  - **2D Architectural Blueprint Floor Plan**: Vector-accurate floor plan visualizer showing corridors, door clearance swings, window orientation, and live per-bed occupancy (A, B, C, D) — eliminating bulky 3D/Blender plugins.
  - **7-Factor Roommate Harmony Radar**: Interactive SVG lifestyle synergy chart with transparent compatibility scoring.
  - **Residential Economics Simulator**: 10-month session fee calculator with instant ₹10,000 Early Decision Benefit (EDB), 6 Pro Bricks regional cuisines, and metered power overage estimation.
  - **Daily Residence Hub**: Digital turnstile QR gate passes and RMS maintenance service desk with SLA countdowns.

- **Backend (`backend/`) — Headless REST API & Registrar Administration**:
  - **Python 3.13 / 3.14 + Django 5.2 / 6.1**: Enterprise monolith powering the deterministic algorithms, database constraints, and state machine.
  - **Headless JSON REST API (`/api/`)**: Session-authenticated API with automatic CSRF token exchange.
  - **Django Admin Console (`/admin/`)**: Database administration dashboard for university registrars and audit officers.
  - **Integrated SPA Hosting (`/spa/`)**: Django natively serves the compiled React application, allowing single-command deployment.
  - **Database**: SQLite (default for instant zero-config setup) / PostgreSQL 15+ (production via `psycopg`).
  - **Testing**: `pytest`, `pytest-django` (155 automated unit, concurrency, RBAC, and security tests).

---

## 📁 Project Structure

```text
Hostel-Allocation-and-Roommate-Matching/
├── backend/                      # Django backend monolith
│   ├── apps/                     # Decoupled Django domain applications
│   │   ├── academics/            # University structure, departments, StudentRegistry
│   │   ├── accounts/             # Custom User model, RBAC roles, dual auth backend
│   │   ├── allocations/          # Transactional allocation engine with row locks
│   │   ├── api/                  # Native Django REST JSON API layer
│   │   ├── applications/         # Multi-choice accommodation applications
│   │   ├── audit/                # Immutable non-repudiation event logs
│   │   ├── hostels/              # Physical buildings, blocks, rooms, beds, occupancy
│   │   ├── notifications/        # Transactional alerts & notification center
│   │   ├── roommates/            # 7-factor questionnaire, compatibility algorithm
│   │   └── students/             # Student profile & enrollment metadata
│   ├── config/                   # Central Django project configuration
│   │   ├── settings/
│   │   │   ├── base.py           # Shared settings (DB fallback, apps, middleware)
│   │   │   ├── development.py    # Development settings & verbose logging
│   │   │   └── production.py     # Production security & cache settings
│   │   ├── asgi.py               # ASGI application entrypoint
│   │   ├── urls.py               # Root URL dispatcher
│   │   └── wsgi.py               # WSGI application entrypoint
│   ├── data/                     # Seed data fixtures (LPU ERP seed catalog)
│   │   └── lpu_erp_seed.json
│   ├── prisma/                   # University ERP schema specifications
│   │   └── schema.prisma
│   ├── static/                   # Static CSS & JS for Django server templates
│   │   ├── css/main.css
│   │   └── js/main.js
│   ├── templates/                # Server-rendered HTML5 templates
│   ├── tests/                    # E2E, security, RBAC, load, and privacy test suites
│   ├── .env.example              # Backend environment variable template
│   ├── manage.py                 # Django CLI management script
│   ├── pytest.ini                # Pytest configuration
│   └── requirements.txt          # Pinned Python dependencies
├── frontend/                     # Vite + React 19 + TypeScript SPA
│   ├── src/
│   │   ├── api/                  # Typed REST API clients with auto-CSRF
│   │   ├── components/           # Accessible design tokens & UI components
│   │   ├── context/              # AuthContext & session state
│   │   ├── pages/                # Catalog, Roommates, Apply, Dashboard, Auth
│   │   ├── styles/               # CSS custom properties & base typography
│   │   └── types/                # TypeScript interface definitions
│   ├── public/                   # Static public assets
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts            # Vite proxy to Django backend (:8000)
├── documentation/                # Architecture, SRS, and database specifications
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   └── SRS.md
├── .env.example                  # Root environment variable template
├── pytest.ini                    # Root pytest runner configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.10 to 3.14
- **Node.js**: 18+ and `npm` (for React frontend)
- **Git**

---

### Step 1: Clone Repository & Set Up Environment

```bash
git clone https://github.com/Basit0012/Hostel-Allocation-and-Roommate-Matching.git
cd Hostel-Allocation-and-Roommate-Matching
```

Create a `.env` file from the example:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

By default, `.env` uses `DB_ENGINE=sqlite3` for zero-configuration local development. To use PostgreSQL, set `DB_ENGINE=postgresql` and fill in your database credentials in `.env`.

---

### Step 2: Install Backend Dependencies

Create and activate a virtual environment:
- **Windows:**
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\activate
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

Install dependencies:
```bash
pip install -r backend/requirements.txt
```

---

### Step 3: Run Database Migrations & Seed Demo Data

Apply migrations:
```bash
cd backend
python manage.py migrate
```

Seed the comprehensive demonstration database (populates 14 hostels, blocks, floors, rooms, beds, academic structure, student registry records, and test accounts):
```bash
python manage.py seed_demo_data
```

#### Demo Credentials Created:
| Role | Email / ID | Password | Access |
|---|---|---|---|
| **Administrator** | `admin@lpu.in` | `Password123!` | Django Admin, Full Inventory, Global Allocations |
| **Boys Warden** | `warden.boys@lpu.in` | `Password123!` | Boys Hostels (`BH-1`..`BH-8`) Approvals & Census |
| **Girls Warden** | `warden.girls@lpu.in` | `Password123!` | Girls Hostels (`GH-1`..`GH-6`) Approvals & Census |
| **Student** | `arjun.sharma@lpu.in` (ID: `12400001`) | `Password123!` | Student Portal, Preferences, Applications |
| **Student** | `rohit.verma@lpu.in` (ID: `12400002`) | `Password123!` | Student Portal, Preferences, Applications |

---

### Step 4: Run the Application

You can run the backend and the frontend concurrently:

#### A. Django Backend Server
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```
- Web Portal / Templates: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Django Admin Panel: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- REST API Root: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)

#### B. React Frontend SPA (Vite Dev Server)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
- Access the React SPA at: [http://localhost:5173/](http://localhost:5173/)
- The Vite dev server automatically proxies `/api` and `/static` requests to `http://127.0.0.1:8000/`.

---

## 🧪 Running Automated Tests

Run the full automated test suite from the repository root:

```bash
python -m pytest -q
```

Or from inside `backend/`:
```bash
cd backend
python -m pytest -q
```

To run a specific test suite:
```bash
# Concurrency & row-locking test suite
python -m pytest backend/apps/allocations/tests/test_concurrency.py

# Deterministic roommate matching algorithm tests
python -m pytest backend/apps/roommates/tests/test_algorithm.py

# RBAC permission & role isolation tests
python -m pytest backend/tests/test_permissions.py

# Security defenses (CSRF, XSS escaping, SQL injection prevention)
python -m pytest backend/tests/test_security_defenses.py
```

---

## 🔒 Security & Concurrency Guarantees

- **No Overbooking**: Row-level database locks (`select_for_update`) during bed assignment ensure multiple concurrent applicants cannot claim the same bed.
- **Privacy First**: Roommate candidate discovery never exposes private student PII (phone numbers, parent contacts, DOB).
- **Dual-Identity Authentication**: Secure login supporting both institutional email and verified Student Registration ID.
- **Tamper-Proof Audit History**: All status transitions, allocations, cancellations, and administrative actions are logged with immutable timestamps and actor IDs.

---

## 📄 License

This project is licensed under the MIT License.
