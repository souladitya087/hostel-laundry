# Database Normalization Proof (1NF to 3NF)

## Campus Laundry Slot Booking and Billing System

This document outlines the step-by-step normalization process for the database, proving that the schema satisfies **Third Normal Form (3NF)** without data redundancy or update anomalies.

---

### Unnormalized Form (UNF)
Consider a single flat spreadsheet record storing a laundry receipt:

`UNF = { booking_id, booking_date, student_name, student_register_no, student_phone, student_email, student_room, slot_date, slot_time, slot_capacity, [service_name, unit_price, quantity, line_total], total_amount, payment_method, payment_status }`

**Anomalies in UNF:**
* Repeating groups for services and clothes within the same booking.
* High redundancy of student and slot details on repeated bookings.
* Deletion anomaly: Deleting a booking deletes student contact details.

---

### First Normal Form (1NF)
> **Definition:** A relation is in 1NF if and only if all underlying domains contain only atomic (indivisible) values, and there are no repeating groups.

**Steps Taken:**
1. Eliminating multi-valued repeating attributes (`service_name`, `quantity`, `line_total`) into a separate relation: `BOOKING_ITEMS`.
2. Establishing a composite key (`booking_id, item_id`) or synthetic primary key `item_id`.
3. Ensuring every field contains atomic values (e.g., student name, dates, times).

---

### Second Normal Form (2NF)
> **Definition:** A relation is in 2NF if and only if it is in 1NF and no non-prime attribute is partially dependent on any candidate key of the table (i.e., No Partial Dependency).

**Steps Taken:**
* In `BOOKING_ITEMS`, `service_name` and standard `unit_price` depended only on `service_id`, not on `(booking_id, item_id)`.
* We decomposed `SERVICES` into its own table:
  - `SERVICES(service_id, service_name, unit_price, turnaround_days)`
* Now all non-key attributes in `BOOKING_ITEMS` (`quantity`, `line_total`, `unit_price_at_booking`) depend fully on the primary key `item_id`.

---

### Third Normal Form (3NF)
> **Definition:** A relation is in 3NF if and only if it is in 2NF and no non-prime attribute is transitively dependent on the primary key (i.e., $X \to Y$ only when $X$ is a superkey, or $Y$ is a prime attribute).

**Steps Taken:**
1. **Student Attributes in Booking**:
   - In `BOOKINGS`, `booking_id -> student_id`, and `student_id -> {name, register_no, phone, email, room_no}`.
   - This was a transitive dependency: `booking_id -> student_details`.
   - **Resolution**: Extracted `STUDENTS(student_id, name, register_no, phone, email, room_no)`.
2. **Slot Attributes in Booking**:
   - `booking_id -> slot_id`, and `slot_id -> {slot_date, start_time, end_time, capacity}`.
   - **Resolution**: Extracted `SLOTS(slot_id, slot_date, start_time, end_time, capacity, status)`.
3. **Payment Details**:
   - Separated into `PAYMENTS(payment_id, booking_id, paid_amount, payment_date, payment_method, payment_status, transaction_ref)`.

---

### Final 3NF Relations Summary

1. `STUDENTS` ($\underline{\text{student\_id}}$, name, register\_no, phone, email, room\_no)
2. `SERVICES` ($\underline{\text{service\_id}}$, service\_name, unit\_price, turnaround\_days, description, category, is\_active)
3. `SLOTS` ($\underline{\text{slot\_id}}$, slot\_date, start\_time, end\_time, capacity, status)
4. `BOOKINGS` ($\underline{\text{booking\_id}}$, $\text{student\_id}^*$, $\text{slot\_id}^*$, booking\_date, status, total\_amount, pickup\_code, notes)
5. `BOOKING_ITEMS` ($\underline{\text{item\_id}}$, $\text{booking\_id}^*$, $\text{service\_id}^*$, quantity, unit\_price, line\_total)
6. `PAYMENTS` ($\underline{\text{payment\_id}}$, $\text{booking\_id}^*$, paid\_amount, payment\_date, payment\_method, payment\_status, transaction\_ref)

All tables have non-key attributes that are dependent on the key, the whole key, and nothing but the key. Hence, the database is strictly in **Third Normal Form (3NF)**.
