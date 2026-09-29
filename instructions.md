# Recommended DBMS Mini Project

## Campus Laundry Slot Booking and Billing System

**Recommended stack:** Python Tkinter + MySQL + `mysql-connector-python`

This is the best fast-to-build option because it has a simple real-world workflow, a small number of screens, clear table relationships, and an easy way to demonstrate every required DBMS feature. It is less overused than a library or hospital-management project, so it is also less likely to clash with another group's title.

## Problem Statement

Students need a simple way to reserve laundry slots, submit clothes for a selected service, and track payment and pickup status. Staff need to manage available slots, services, bookings, and daily collection.

## Core Modules

1. **Student management** - add, view, edit, delete, and search students.
2. **Laundry service management** - manage service names, prices, and turnaround time.
3. **Slot management** - create date/time slots and set capacity.
4. **Booking management** - create and update a student's laundry booking; record quantity and service.
5. **Payment and reports** - record payment status and show daily bookings/revenue.

## Database Design: 5 Tables

| Table | Purpose | Important columns |
| --- | --- | --- |
| `students` | Student details | `student_id` (PK), name, register_no (UNIQUE), phone, email |
| `services` | Laundry services and prices | `service_id` (PK), service_name (UNIQUE), unit_price, turnaround_days |
| `slots` | Available collection/drop-off slots | `slot_id` (PK), slot_date, start_time, end_time, capacity |
| `bookings` | Main booking record | `booking_id` (PK), student_id (FK), slot_id (FK), booking_date, status, total_amount |
| `booking_items` | Services and quantities in each booking | `item_id` (PK), booking_id (FK), service_id (FK), quantity, line_total |

**Optional sixth table:** `payments(payment_id, booking_id, paid_amount, payment_date, payment_method, payment_status)`. Add this only if the group has time; otherwise keep payment fields in `bookings`.

## How It Meets the Assignment Requirements

| Requirement | Simple implementation |
| --- | --- |
| 4-5 related tables | The five tables above use foreign keys. |
| 3NF | Student, service, slot, booking, and booking-item data are separated. |
| Constraints | PK, FK, NOT NULL, UNIQUE register number, CHECK quantity > 0, DEFAULT status. |
| CRUD from front end | Tkinter forms for Students, Services, Slots, and Bookings. |
| Search/filter | Find bookings by student name, date, or status. |
| JOIN + aggregate + GROUP BY | Daily revenue and number of bookings by service/date. |
| View | `vw_booking_summary` joins student, slot, booking, and item details. |
| Stored procedure | `sp_create_booking` inserts a booking after checking slot capacity. |
| Trigger | After insert/update/delete on `booking_items`, recalculate `bookings.total_amount`. |
| Input validation | Required fields, numeric quantity/phone, valid date, and no booking after slot capacity is full. |

## Minimum Screens

1. Login (simple Admin/User login; desirable, not mandatory)
2. Dashboard
3. Students
4. Services
5. Slots
6. Create/View Bookings
7. Reports

Keep the interface basic: Tkinter `Entry`, `Combobox`, `Button`, and `Treeview` are sufficient. Good screenshots and correctly working database operations matter more than a complex design.

## Fast Development Plan

1. Create the MySQL database and all tables with constraints.
2. Insert at least 10 sample rows in each major table.
3. Write and test the view, stored procedure, trigger, and report queries in MySQL first.
4. Build Tkinter screens one at a time: Students -> Services -> Slots -> Bookings -> Reports.
5. Add validation and take screenshots as each screen works.
6. Draw the ER diagram and write the 3NF explanation from the final schema.

## Suggested Team Split (3-4 Members)

| Member | Responsibility |
| --- | --- |
| 1 | ER diagram, relational schema, normalization, DDL/constraints |
| 2 | MySQL sample data, joins, view, procedure, trigger, report queries |
| 3 | Python Tkinter forms and MySQL connectivity |
| 4 | Testing, screenshots, report formatting, and integration support |

## Suggested Project Title for Approval

**Campus Laundry Slot Booking and Billing System using Python Tkinter and MySQL**

Before submitting the title, confirm that no other group has chosen it. If it is already taken, use: **Hostel Laundry Service Management System**.

## Why Not a Bigger Project?

Avoid hospital, e-commerce, social-media, or full hostel-management systems when time is short. They create too many roles, rules, and screens. This project stays small while still demonstrating the database concepts on which the marks are based: relationships, normalization, constraints, joins, aggregates, a view, a stored procedure, and a trigger.
