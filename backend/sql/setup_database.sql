-- ====================================================================
-- Campus Laundry Slot Booking and Billing System
-- Master Database Initialization Script
-- Run this script in MySQL Workbench or via:
-- mysql -u root -p < setup_database.sql
-- ====================================================================

SOURCE 01_schema.sql;
SOURCE 02_views.sql;
SOURCE 03_procedures_triggers.sql;
SOURCE 04_seed_data.sql;

SELECT 'Database and sample seed data successfully initialized!' AS status;
