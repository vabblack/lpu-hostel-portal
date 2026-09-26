# Hostel Allocation and Roommate Matching System

A full-featured Django web application designed to streamline hostel room allocations and facilitate intelligent roommate matching for universities and educational institutions.

---

## Features

- 🏢 **Hostel & Room Management**: Manage hostel blocks, rooms, floor layouts, and occupancy capacities.
- 🤝 **Roommate Matching Algorithm**: Match students based on lifestyle preferences, study habits, routines, and interests to ensure compatibility.
- 📝 **Application & Allocation Workflow**: Online room applications, automated allocation, and administrative approval workflows.
- 👤 **Role-Based Access Control**:
  - **Students**: Fill out preference profiles, view available rooms, submit requests, and check allocation status.
  - **Hostel Wardens / Admins**: Manage inventory, view compatibility scores, approve/reject allocations, and oversee room reassignments.
- 🔔 **Complaints & Maintenance**: Built-in tracking for student queries, maintenance requests, and room change requests.

---

## Tech Stack

- **Backend**: Python 3.13, Django 6.1
- **Database**: SQLite (default, easily switchable to PostgreSQL/MySQL)
- **Frontend**: Django Templates, HTML5, CSS3, JavaScript

---

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Git

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Basit0012/Hostel-Allocation-and-Roommate-Matching.git
   cd Hostel-Allocation-and-Roommate-Matching
   ```

2. **Create and activate a virtual environment:**
   - **Windows:**
     ```powershell
     py -m venv .venv
     .\.venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create an administrative user:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
   Access the app at [http://127.0.0.1:8000/](http://127.0.0.1:8000/) and the admin panel at [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/).

---

## Project Structure

```text
Hostel-Allocation-and-Roommate-Matching/
├── hostel_allocation/       # Django project configuration (settings, urls, asgi/wsgi)
├── manage.py                # Django CLI management script
├── requirements.txt         # Project dependencies
├── .gitignore               # Git ignored files and directories
└── README.md                # Project documentation
```

---

## License

This project is licensed under the MIT License.
