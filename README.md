# 🧺 Campus Laundry Slot Booking and Billing System

> A full-stack DBMS mini-project built with **Python (FastAPI)**, **MySQL 8.0**, and a **Modern Responsive React SPA**, designed to easily scale into mobile apps.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MySQL 8.0](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement
Students in university hostels need an organized, automated way to reserve laundry slots, submit specific garments for washing, steam ironing, or dry cleaning, and monitor their order and pickup status. 

Hostel laundry management requires:
* Managing daily slot capacity to prevent overcrowding and machine burnout.
* Dynamic price tallying per service category.
* Accurate daily financial and occupancy reporting.

---

## 🚀 Key Features

* **3NF Relational Database**: Strictly normalized 6-table schema with referential integrity and checks.
* **SQL Stored Procedures & Triggers**:
  * `sp_create_booking`: Atomically checks slot capacity and enforces booking limits.
  * Triggers: Automatically recalculate `bookings.total_amount` whenever items are added, modified, or removed.
* **SQL Views**: Consolidates complex multi-table joins (`vw_booking_summary`, `vw_slot_utilization`, `vw_daily_financial_summary`).
* **Interactive REST API**: Built with FastAPI with interactive Swagger UI documentation at `/docs`.
* **Mobile-Ready**: Clean JSON REST endpoints and responsive mobile-first UI patterns (bottom-nav, modal sheets, touch targets).
* **Zero-Friction Fallback**: Connects directly to **MySQL 8.0**, with automatic SQLite fallback for rapid team testing without local MySQL passwords.

---

## 🏗️ Architecture

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
│   ├── config.py                     # Environment configuration
│   ├── database.py                   # Multi-engine connector (MySQL + SQLite fallback)
│   └── main.py                       # FastAPI application entrypoint
├── frontend/
│   ├── src/                          # Modern React UI
│   ├── index.html                    # Responsive HTML5 entry
│   └── package.json                  # Vite & React dependencies
├── docs/
│   ├── ER_DIAGRAM.md                 # Entity-Relationship diagram & cardinality
│   └── NORMALIZATION_3NF.md          # Step-by-step 1NF to 3NF proof
├── .env.example                      # Sample configuration template
└── instructions.md                   # Project assignment specification
```

---

## 🛠️ Quick Start Guide for Team Members

### 1. Clone the Repository
```bash
git clone https://github.com/souladitya087/hostel-laundry.git
cd hostel-laundry
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```
*(Optional: If you have MySQL Server 8.0 running locally, set your `DB_PASSWORD` in `.env`. Otherwise, the system automatically uses the zero-config SQLite mode).*

### 3. Backend Setup
```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Start backend server
python -m uvicorn backend.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`  
Swagger Documentation: `http://localhost:8000/docs`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Web Application will be running at: `http://localhost:5173`

---

## 👥 Suggested Academic Team Split

| Member | Focus Area | Deliverables |
| :--- | :--- | :--- |
| **Member 1** | Database Architecture | ER Diagram, 3NF Normalization Proof, Schema DDL |
| **Member 2** | SQL Logic & Queries | Stored procedures, triggers, views, and seed data |
| **Member 3** | Backend & APIs | FastAPI routes, data validation, business logic |
| **Member 4** | Frontend & Testing | UI components, slot picker, billing views, testing |
