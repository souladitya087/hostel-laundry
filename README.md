# 🧺 Campus Laundry Slot Booking and Billing System

> A full-stack university DBMS mini-project built with **Python (FastAPI)**, **MySQL 8.0 / SQLite 3**, and a **Modern Responsive React SPA**, featuring distinct portals for **Students** and **Staff Administrators**.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL 8.0](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement
Students in university hostels need an organized, automated way to reserve laundry slots, submit specific garments for washing, steam ironing, or dry cleaning, and monitor their order and pickup status. 

Hostel laundry management requires:
* Enforcing daily slot capacities to prevent counter overcrowding and machine burnout.
* Dynamic price tallying per service category and item quantity.
* Multi-role segregation: student self-service booking vs. staff administrative controls.
* Generating instant pickup tokens and printable digital receipts.
* Accurate daily financial and machine occupancy reporting.

---

## 🔐 Multi-Role Authentication & Portals

The application provides dedicated, customized interfaces tailored to each role:

### 1. 🎓 Student Self-Service Portal
* **Quick Login**: Enter university roll number (e.g. `2024CS01`) or click any 1-click evaluation profile.
* **Self-Registration**: New students can self-register with Name, Roll Number, Room Number, Phone, and Email.
* **Personalized Dashboard**: Greets the student, displays active laundry orders, alerts when clothes are **Ready for Pickup**, and tracks total wardrobe expenses.
* **Streamlined Slot Reservation**: Automatically locks the student's verified profile and room number into the booking wizard.
* **My Orders & Receipts**: View only personal orders, real-time washing status, pickup tokens, and printable receipts.
* **Catalog & Slots**: View active collection schedules and service rates without administrative mutation controls.

### 2. 🛡️ Staff Administrator Console
* **Admin Login**: Authenticate with administrative credentials (`admin` / `admin123`).
* **Hostel Operations Center**: Live KPI cards for active orders, revenue collected, total clothes cleaned, and slot occupancy rates.
* **Full Order Management**: Search all students, filter by status, and transition orders through workflow stages:
  $$\text{Pending} \longrightarrow \text{In Progress} \longrightarrow \text{Ready for Pickup} \longrightarrow \text{Completed}$$
* **Slot Capacity Schedules**: Create, update, or remove daily collection windows and max student seat limits.
* **Student Directory CRUD**: Add, edit, search, and manage registered hostel residents.
* **Services & Rates Catalog**: Configure laundry categories, prices per item, and turnaround guarantees.
* **Analytical Reports**: 14-day daily financial revenue charts and service category breakdowns.
* **DBMS Database Administration**: One-click database reseeding for live presentation demonstrations.

---

## ⚡ Quick Evaluation Credentials

For grading panels and team demonstrations, test accounts are built-in:

| Role | Portal Tab | Username / Identifier | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Staff Admin** | Staff Administrator | `admin` | `admin123` | Full operations & database controls |
| **Student 1** | Student Portal | `2024CS01` | *(None required)* | Aditya Sharma (Room BH-204) |
| **Student 2** | Student Portal | `2024IT15` | *(None required)* | Priya Patel (Room GH-102) |
| **Student 3** | Student Portal | `2023ME42` | *(None required)* | Rohan Verma (Room BH-315) |
| **New Student**| Student Portal | *(Self-register)* | *(None required)* | Instant database insertion & login |

---

## 🚀 Key DBMS Features

* **3NF Relational Database**: Strictly normalized 6-table schema (`students`, `services`, `slots`, `bookings`, `booking_items`, `payments`) with foreign keys, checks, and unique constraints.
* **SQL Stored Procedures & Triggers**:
  * `sp_create_booking`: Atomically checks slot capacity and enforces booking limits before inserting.
  * Triggers: Automatically recalculate `bookings.total_amount` whenever items are added, modified, or removed (`trg_items_insert`, `trg_items_update`, `trg_items_delete`).
* **SQL Views**: Complex multi-table joins consolidated into optimized views (`vw_booking_summary`, `vw_slot_utilization`, `vw_daily_financial_summary`).
* **Interactive REST API**: Built with FastAPI with interactive Swagger UI documentation at `/docs`.
* **Zero-Friction Fallback**: Connects directly to **MySQL 8.0**, with automatic SQLite fallback for rapid team testing without local MySQL configuration.

---

## 🏗️ Project Architecture

```
hostel_laundry/
├── backend/
│   ├── sql/
│   │   ├── 01_schema.sql             # 3NF DDL, tables, constraints, indexes
│   │   ├── 02_views.sql              # Summary & analytical SQL views
│   │   ├── 03_procedures_triggers.sql# Stored procedure & automatic triggers
│   │   ├── 04_seed_data.sql          # Realistic sample data
│   │   └── setup_database.sql        # Master initialization script
│   ├── routers/                      # Modular FastAPI endpoints
│   │   ├── auth.py                   # Role login, registration, demo accounts
│   │   ├── students.py               # Student directory CRUD
│   │   ├── services.py               # Laundry rates & catalog
│   │   ├── slots.py                  # Collection slot schedules & capacity
│   │   ├── bookings.py               # Booking wizard & status workflow
│   │   ├── payments.py               # Payment records & methods
│   │   ├── reports.py                # Analytical & KPI views
│   │   └── db_admin.py               # Status & reseed utilities
│   ├── config.py                     # Environment configuration
│   ├── database.py                   # Multi-engine connector (MySQL + SQLite fallback)
│   └── main.py                       # FastAPI application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, NewBookingModal, ReceiptModal
│   │   ├── views/                    # LoginView, DashboardView, BookingsView, SlotsView,
│   │   │                             # StudentsView, ServicesView, ReportsView, DbmsSpecView
│   │   ├── services/                 # api.js client methods
│   │   ├── App.jsx                   # Role-based root state & routing
│   │   ├── App.css                   # Custom glassmorphic styling
│   │   └── main.jsx                  # React application bootstrap
│   ├── index.html                    # Responsive HTML5 entry
│   └── package.json                  # Vite & React dependencies
├── docs/
│   ├── ER_DIAGRAM.md                 # Entity-Relationship diagram & cardinality
│   └── NORMALIZATION_3NF.md          # Step-by-step 1NF to 3NF proof
├── run_dev.py                        # One-command dual server launcher
├── requirements.txt                  # Python dependencies
└── README.md                         # Project documentation
```

---

## 🛠️ Quick Start Guide

### Option A: One-Command Launcher (Recommended)
You can launch both the FastAPI backend and Vite frontend with a single command:

```bash
python run_dev.py
```
* **Web Application**: `http://localhost:5173`
* **Swagger API Docs**: `http://localhost:8000/docs`

---

### Option B: Step-by-Step Setup

#### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```
*(Optional: Set your MySQL password in `.env` if you have local MySQL Server running. Otherwise, SQLite fallback operates automatically).*

#### 2. Start Backend Server
```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Start backend server
python -m uvicorn backend.main:app --reload --port 8000
```
Backend will be live at: `http://localhost:8000`

#### 3. Start Frontend Client
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## 👥 Suggested Academic Team Split

| Member | Focus Area | Deliverables |
| :--- | :--- | :--- |
| **Member 1** | Database Architecture | ER Diagram, 3NF Normalization Proof, Schema DDL |
| **Member 2** | SQL Logic & Queries | Stored procedures, triggers, views, and seed data |
| **Member 3** | Backend & APIs | FastAPI routes, role authentication, business logic |
| **Member 4** | Frontend & Testing | UI components, login portal, billing receipts, testing |
