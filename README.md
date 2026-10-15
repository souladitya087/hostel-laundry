# 🧺 Campus Laundry Slot Booking and Billing System

> **24CS305 / CS3106 — Database Management Systems Laboratory Mini Project**  
> A full-stack university DBMS application engineered with **FastAPI (Python)**, **React 19 + Vite**, and **MySQL 8.0** (with automatic zero-config SQLite fallback). Built with dedicated, role-segregated portals for **Students** and **Hostel Operations Administrators**.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL 8.0](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![SQLite](https://img.shields.io/badge/Fallback-SQLite_3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎓 Academic Project Overview

* **Course Code & Title**: 24CS305 / CS3106 — Database Management Systems Laboratory Mini Project
* **Domain**: University Hostel Services & Facility Automation
* **Architecture**: 3-Tier Client-Server Architecture (React 19 SPA ↔ REST API ↔ 3NF Relational Database)
* **Key DBMS Concepts Demonstrated**:
  * **3NF Relational Normalization**: 6 distinct entities free from insertion, update, and deletion anomalies.
  * **Referential & Domain Integrity**: Strict Primary Keys, Foreign Keys (`CASCADE` / `RESTRICT`), Unique constraints, and `CHECK` validations.
  * **Stored Procedures with `IN` / `OUT` Parameters**: Atomic booking creation (`sp_create_booking`) and payment processing (`sp_complete_booking_payment`).
  * **Deterministic Stored Functions**: Real-time remaining slot capacity calculation (`fn_slot_available_capacity`).
  * **Automated Recalculation Triggers**: Real-time booking total recalculation upon line item insertion, modification, or removal (`trg_after_booking_items_insert / update / delete`).
  * **Analytical Summary Views**: Multi-table joined reporting views for booking summaries, slot occupancy, service revenue, and daily financial ledgers.
* **Companion Documentation & Academic Report**:
  * 📄 **Academic Report (DOCX)**: [G01_HostelLaundryManagement_Report.docx](docs/G01_HostelLaundryManagement_Report.docx)
  * 📑 **Academic Report (PDF)**: [G01_HostelLaundryManagement_Report.pdf](docs/G01_HostelLaundryManagement_Report.pdf)
  * [Entity-Relationship (ER) Diagram & Cardinality](docs/ER_DIAGRAM.md)
  * [Step-by-Step 1NF to 3NF Normalization Proof](docs/NORMALIZATION_3NF.md)
  * [Mobile API Integration Guide](docs/MOBILE_APP_INTEGRATION.md)

---

## 🔑 Test Credentials Table

Pre-seeded demonstration accounts are configured for rapid grading, viva evaluation, and feature testing:

| Role | Portal Login Tab | College Email / Identifier | Password | Demonstration Profile & Orders |
| :--- | :--- | :--- | :--- | :--- |
| **Staff Admin** | Administrator Console | `admin` *(or `admin@campus.edu`)* | `admin123` | Full hostel operations, capacity control & live analytics |
| **Student 1** | Student Portal | `aditya.cs24@campus.edu` | `student123` | Aditya Sharma (Room BH-204) — Order `LND-2401` (**In Progress**) |
| **Student 2** | Student Portal | `priya.it24@campus.edu` | `student123` | Priya Patel (Room GH-102) — Order `LND-2402` (**Ready for Pickup**) |
| **Student 4** | Student Portal | `sneha.ec24@campus.edu` | `student123` | Sneha Kulkarni (Room GH-208) — Order `LND-2404` (**Completed**) |
| **New Student** | Student Portal | *(Self-Register)* | *(Min 4 chars)* | Instant registration with College Email, Room No & Password |

> 💡 **Quick Login Buttons**: The web login screen features 1-click demo login buttons for both Admin and sample Students, allowing evaluators to switch roles instantly without manual typing.

---

## ⚡ Quick Start & Setup Guide

### Method 1: 1-Command Startup (Recommended)

Run both the **FastAPI Backend** and the **React Vite Frontend** simultaneously with a single command:

```bash
python run_dev.py
```

| Service | Access URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Responsive Student Portal & Staff Admin Console |
| **Interactive Swagger API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Complete OpenAPI specification with live testing |
| **Backend API Health Check** | [http://localhost:8000](http://localhost:8000) | Root health check & database engine status |

*Press `Ctrl+C` in the terminal to gracefully terminate both services.*

---

### Method 2: Manual Step-by-Step Setup

If you prefer running the backend and frontend in separate terminals:

#### Prerequisites
* **Python**: Version 3.10 or higher
* **Node.js**: Version 18.0 or higher (includes `npm`)
* **Database**: MySQL 8.0 Server *(Optional — if MySQL is not running locally, the application automatically uses an embedded SQLite database with zero manual configuration)*

#### Step 1: Backend Setup
```bash
# 1. Install required Python packages
python -m pip install -r requirements.txt

# 2. (Optional) Configure environment variables
# Copy .env.example to .env to customize MySQL credentials if running local MySQL
copy .env.example .env

# 3. Start the FastAPI backend server
python -m uvicorn backend.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

#### Step 2: Frontend Setup
In a separate terminal window:
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Launch Vite dev server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 🔐 Multi-Role Authentication & Portals

The application enforces strict role segregation between resident students and hostel operations administrators:

### 1. 🎓 Student Self-Service Portal
* **College Email & Password Authentication**: Students sign in securely using their institutional email address (e.g. `aditya.cs24@campus.edu`) and password (`student123`).
* **Resident Self-Registration**: New hostel residents can register themselves with Full Name, University Register Number, Phone Number, College Email, Password, and Hostel Room Number.
* **Personalized Resident Dashboard**: Displays the student's room number, active laundry requests, live garment status, and collection alerts.
* **Streamlined Slot Reservation**: Automatically pre-fills the student's verified profile and room number, preventing impersonation.

### 2. 🛡️ Staff Administrator Console
* **Dedicated Admin Authentication**: Administrative access via `admin` or `admin@campus.edu` with admin password (`admin123`).
* **Operations Center KPIs**: Real-time summary cards tracking Active Orders, Today's Collected Revenue, Total Clothes Cleaned, and Slot Occupancy Percentage.
* **Global Order Processing**: Search, inspect, and transition laundry orders for **all students across campus** through workflow stages:
  `Submitted (Pending)` ➔ `Washing & Ironing (In Progress)` ➔ `Ready for Pickup` ➔ `Completed`
* **Slot Capacity Schedules**: Add, modify, or close daily collection windows and adjust counter capacity quotas.
* **Service Rate Management**: Configure laundry categories, per-pair/piece pricing, and turnaround guarantees.
* **1-Click DBMS Reseed**: Easily reset sample data to default demonstration state during viva evaluations.

---

## 🧺 User Order Page Features

The student order view is designed for full transparency, real-time tracking, and clear billing:

1. **Live Order Status Progress Stepper**:
   * Interactive 4-stage visual progress pipeline:
     `Submitted` ➔ `Washing & Ironing` ➔ `Ready for Pickup` ➔ `Completed`
   * Dynamic progress track fill bar reflects real-time order state (15% ➔ 50% ➔ 85% ➔ 100%).
   * High-visibility **"Order Ready for Collection!" alert banner** prompts students as soon as laundry reaches the counter.
   * Clear status representation for cancelled bookings.

2. **Laundry Items Classified by Pair / Piece**:
   * Granular categorization preventing billing ambiguity:
     * **By Pair**: Standard Wash & Fold, Wash & Steam Iron, Express Same-Day Wash, Dry Cleaning, Sneakers & Shoe Spa, Steam Ironing Only, Festive Ethnic Wear, Bedsheets & Pillow Covers.
     * **By Piece**: Heavy Bedding & Blankets, Curtains & Drapes Care.
   * Itemized breakdown listing service name, unit price (₹/pair or ₹/piece), quantity, and calculated line totals.

3. **Pickup Token Verification**:
   * Prominent, unique alphanumeric token badge (e.g., `LND-2401`, `LND-2402`, `LND-2404`).
   * Displayed on the student dashboard, order summary cards, and printable receipts for zero-confusion collection at the hostel counter.

4. **Transparent Billing & Digital Receipts**:
   * Real-time bill tallying powered by database triggers (`bookings.total_amount = SUM(booking_items.line_total)`).
   * Displays payment settlement status (**Paid** / **Unpaid**) and payment method (**UPI**, **Student ID Card**, **Cash**, **Online**).
   * One-click **Printable Official Digital Receipt** modal with university branding, pickup token, QR graphic, and line item details.

5. **Multi-Order Switcher Chips**:
   * Quick-switch selector chips allow students with multiple bookings to switch between orders and review active or historical receipts instantly.

---

## 🗄️ Relational Database Architecture (3NF)

The database schema is strictly normalized into **Third Normal Form (3NF)** to eliminate data redundancy and insertion/update/deletion anomalies.

### 1. The 6 Normalized Tables

```
students (1) ───────────< bookings (N) ───────────< booking_items (N) >─────────── (1) services
                              │
                              ├───< slots (1)
                              │
                              └───< payments (1)
```

1. **`students`**: Resident student directory and authentication credentials.
   * **Primary Key**: `student_id`
   * **Unique Constraints**: `register_no`, `email`
   * **Attributes**: `name`, `register_no`, `phone`, `email`, `password`, `room_no`, `created_at`
   * **Normalization Note**: Eliminates student detail redundancy across multiple laundry bookings.

2. **`services`**: Master catalog of laundry services, rates, and unit classifications.
   * **Primary Key**: `service_id`
   * **Unique Constraint**: `service_name`
   * **Check Constraints**: `unit_price >= 0`, `turnaround_days >= 0`
   * **Attributes**: `service_name`, `unit_price`, `turnaround_days`, `description`, `category`, `unit_type` (`pair` / `piece`), `is_active`
   * **Normalization Note**: Centralizes pricing logic so rate updates do not alter historical records.

3. **`slots`**: Booking time windows and counter capacity limits.
   * **Primary Key**: `slot_id`
   * **Unique Constraint**: `(slot_date, start_time, end_time)` — prevents overlapping duplicate windows.
   * **Check Constraint**: `capacity > 0`
   * **Attributes**: `slot_date`, `start_time`, `end_time`, `capacity`, `status` (`Available`, `Full`, `Maintenance`), `created_at`
   * **Normalization Note**: Decouples daily scheduling from individual student bookings.

4. **`bookings`**: Core laundry reservation records.
   * **Primary Key**: `booking_id`
   * **Unique Constraint**: `pickup_code` (e.g. `LND-2401`)
   * **Foreign Keys**:
     * `student_id` → `students(student_id)` (`ON DELETE RESTRICT ON UPDATE CASCADE`)
     * `slot_id` → `slots(slot_id)` (`ON DELETE RESTRICT ON UPDATE CASCADE`)
   * **Check Constraint**: `total_amount >= 0`
   * **Attributes**: `student_id`, `slot_id`, `booking_date`, `status` (`Pending`, `In Progress`, `Ready for Pickup`, `Completed`, `Cancelled`), `total_amount`, `pickup_code`, `notes`

5. **`booking_items`**: Line items per booking detailing clothes and quantities.
   * **Primary Key**: `item_id`
   * **Foreign Keys**:
     * `booking_id` → `bookings(booking_id)` (`ON DELETE CASCADE ON UPDATE CASCADE`)
     * `service_id` → `services(service_id)` (`ON DELETE RESTRICT ON UPDATE CASCADE`)
   * **Check Constraints**: `quantity > 0`, `unit_price >= 0`, `line_total >= 0`
   * **Attributes**: `booking_id`, `service_id`, `quantity`, `unit_price`, `line_total`
   * **Normalization Note**: Resolves the many-to-many relationship between `bookings` and `services` (1NF compliance).

6. **`payments`**: Payment transaction logs and audit trail.
   * **Primary Key**: `payment_id`
   * **Foreign Key**:
     * `booking_id` → `bookings(booking_id)` (`ON DELETE CASCADE ON UPDATE CASCADE`)
   * **Check Constraint**: `paid_amount > 0`
   * **Attributes**: `booking_id`, `paid_amount`, `payment_date`, `payment_method` (`Cash`, `UPI`, `Student ID Card`, `Online`), `payment_status` (`Paid`, `Pending`, `Failed`, `Refunded`), `transaction_ref`

---

### 2. SQL Views, Stored Procedures, Function & Triggers

| Name | Object Type | Key Responsibility & Logic |
| :--- | :--- | :--- |
| **`vw_booking_summary`** | SQL View | Multi-table join consolidating student profile, room number, slot interval, total clothes count, total bill, and payment status. |
| **`vw_slot_utilization`** | SQL View | Computes real-time booked counts, available capacity, and percentage occupancy per slot interval. |
| **`vw_service_analytics`** | SQL View | Aggregates volume of garments cleaned and total revenue generated per service offering. |
| **`vw_daily_financial_summary`** | SQL View | Daily revenue ledger tracking completed bookings, cancelled bookings, gross billings, and collected payments. |
| **`sp_create_booking`** | Stored Procedure | Atomically validates student and slot existence, verifies counter capacity against active bookings, creates booking record with default `Pending` status, and auto-marks slot as `Full` when capacity is exhausted. |
| **`sp_complete_booking_payment`** | Stored Procedure | Records payment transaction atomically with unique transaction reference. |
| **`fn_slot_available_capacity`** | Stored Function | Deterministic function returning the exact remaining seats (`capacity - booked_count`) for a given `slot_id`. |
| **`trg_after_booking_items_insert`** | SQL Trigger | Automatically recalculates `bookings.total_amount` whenever a line item is inserted. |
| **`trg_after_booking_items_update`** | SQL Trigger | Automatically recalculates `bookings.total_amount` whenever item quantity or unit price changes. |
| **`trg_after_booking_items_delete`** | SQL Trigger | Automatically recalculates `bookings.total_amount` whenever a line item is removed. |

---

## 🧪 Verification & Automated Testing

The repository includes a comprehensive automated test suite (`test_e2e_verification.py`) covering all authentication, authorization, registration, booking, and DBMS constraint logic:

```bash
python test_e2e_verification.py
```

### Verified Test Scenarios (13/13 Passing):
- ✅ **Database Connectivity**: Validates live engine connection (MySQL 8.0 or embedded SQLite fallback).
- ✅ **Demo Users Endpoint**: Validates `/api/auth/demo-users` returns seeded credentials.
- ✅ **Student Authentication**: Student login with College Email & Password (`aditya.cs24@campus.edu`).
- ✅ **Password Rejection**: Rejection of incorrect passwords with HTTP 401.
- ✅ **Email Not Found**: Rejection of nonexistent college emails with HTTP 404.
- ✅ **Student Registration**: Self-registration with college email and subsequent authentication.
- ✅ **Administrator Login**: Admin login via both username (`admin`) and email (`admin@campus.edu`).
- ✅ **Pair / Piece Line Items**: Retrieval of laundry line items classified by pair/piece with pricing.
- ✅ **Admin Workflow Transitions**: Administrative status transitions (`Pending` ➔ `Ready for Pickup`).
- ✅ **Official Receipt Generation**: Verifies receipt generation endpoint (`/api/bookings/{id}`).
- ✅ **Registration Sanity Validation**: Enforces non-empty names, valid emails, and minimum password lengths.
- ✅ **Duplicate Email Protection**: Graceful rejection of duplicate email collisions with HTTP 400 (no 500 crash).
- ✅ **Order States**: Query handling for Completed and Cancelled order states.

---

## 📂 Project Directory Structure

```
hostel_laundry/
├── backend/
│   ├── sql/
│   │   ├── 01_schema.sql              # 3NF DDL, tables, constraints, indexes
│   │   ├── 02_views.sql               # 4 Summary & analytical SQL views
│   │   ├── 03_procedures_triggers.sql # Stored procedures, function & triggers
│   │   ├── 04_seed_data.sql           # Realistic sample seed data
│   │   └── setup_database.sql         # Master database initialization script
│   ├── routers/                       # Modular FastAPI endpoints
│   │   ├── auth.py                    # College email login, registration, demo accounts
│   │   ├── students.py                # Student directory CRUD
│   │   ├── services.py                # Laundry catalog & rates
│   │   ├── slots.py                   # Collection schedules & capacity
│   │   ├── bookings.py                # Booking wizard, pair/piece items & status flow
│   │   ├── payments.py                # Payment records & methods
│   │   ├── reports.py                 # Analytical & KPI views
│   │   └── db_admin.py                # Status & reseed utilities
│   ├── config.py                      # Environment configuration
│   ├── database.py                    # Multi-engine connector (MySQL 8.0 + SQLite fallback)
│   └── main.py                        # FastAPI application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar, Sidebar, NewBookingModal, ReceiptModal
│   │   ├── views/                     # LoginView, DashboardView, BookingsView, SlotsView,
│   │   │                              # StudentsView, ServicesView, ReportsView, DbmsSpecView
│   │   ├── services/                  # api.js client methods
│   │   ├── App.jsx                    # Role-based root state & routing
│   │   ├── App.css                    # Modern styling & responsive design
│   │   └── main.jsx                   # React application bootstrap
│   ├── index.html                     # HTML5 entry
│   └── package.json                   # Vite & React dependencies
├── docs/
│   ├── G01_HostelLaundryManagement_Report.docx # Academic Project Report (Word)
│   ├── G01_HostelLaundryManagement_Report.pdf  # Academic Project Report (PDF)
│   ├── images/                        # High-resolution screenshots & ER diagrams
│   ├── ER_DIAGRAM.md                  # Entity-Relationship diagram & cardinality
│   ├── NORMALIZATION_3NF.md           # Step-by-Step 1NF to 3NF proof
│   └── MOBILE_APP_INTEGRATION.md      # Mobile API integration notes
├── run_dev.py                         # 1-Command dual server launcher
├── test_e2e_verification.py           # Automated test suite (13 passing tests)
├── requirements.txt                   # Python dependencies
└── README.md                          # Master documentation
```

---

## 👥 Suggested Academic Team Deliverables

| Team Member | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Member 1** | Database Architecture | ER Diagram, 3NF Normalization Proof, Schema DDL, Constraints & Indexes |
| **Member 2** | SQL Logic & Programmability | Stored Procedures (`sp_create_booking`), Functions, Triggers, Views & Seed Data |
| **Member 3** | Backend & Security | FastAPI REST endpoints, College Email & Password Authentication, Pydantic validation |
| **Member 4** | Frontend & UI/UX | React 19 UI, Live Stepper, Pair/Piece Breakdown, Printable Receipts, E2E Testing |

---

## 📄 License & Coursework Credits

Developed for the **24CS305 / CS3106 Database Management Systems Laboratory** coursework. Open-source under the [MIT License](https://opensource.org/licenses/MIT).
