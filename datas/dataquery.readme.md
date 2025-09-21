# PostgreSQL Database Query Commands

## 🔌 **Connection Commands**

### Connect to Database
```bash
# Connect to manufacturing_db
psql -U postgres -d manufacturing_db

# Enter password when prompted: admin
```

### Exit Database
```sql
\q
```

## 📋 **Schema & Structure Commands**

### List All Tables
```sql
\dt
```

### View Table Structure
```sql
-- Users table structure
\d users

-- OTP verification table structure
\d otp_verification

-- List all columns in users table
\d+ users
```

### View Database Information
```sql
-- Current database
SELECT current_database();

-- Database size
SELECT pg_size_pretty(pg_database_size('manufacturing_db'));

-- All databases
\l
```

## 👥 **User Management Queries**

### View All Users
```sql
SELECT * FROM users;
```

### View Users (Safe - No Password Hash)
```sql
SELECT user_id, username, email, role, created_at, last_login 
FROM users 
ORDER BY created_at DESC;
```

### Count Users
```sql
SELECT COUNT(*) as total_users FROM users;
```

### Users by Role
```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;
```

### Latest Registered Users
```sql
SELECT username, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Find User by Email
```sql
SELECT user_id, username, email, role 
FROM users 
WHERE email = 'admin@company.com';
```

### Active Users (Logged in Recently)
```sql
SELECT username, email, last_login 
FROM users 
WHERE last_login > NOW() - INTERVAL '7 days' 
ORDER BY last_login DESC;
```

## 🔐 **OTP Verification Queries**

### View All OTP Records
```sql
SELECT * FROM otp_verification;
```

### Active OTP Codes
```sql
SELECT o.otp_code, u.email, o.expiry_time, o.used
FROM otp_verification o
JOIN users u ON o.user_id = u.user_id
WHERE o.expiry_time > NOW() AND o.used = FALSE;
```

### OTP History for User
```sql
SELECT o.otp_code, o.expiry_time, o.used, o.created_at
FROM otp_verification o
JOIN users u ON o.user_id = u.user_id
WHERE u.email = 'user@example.com'
ORDER BY o.created_at DESC;
```

## 🛠️ **Data Manipulation Commands**

### Insert Test User
```sql
INSERT INTO users (username, email, password_hash, role) 
VALUES ('testuser', 'test@company.com', '$2b$10$hashedpassword', 'manager');
```

### Update User Role
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### Update Last Login
```sql
UPDATE users 
SET last_login = CURRENT_TIMESTAMP 
WHERE user_id = 1;
```

### Delete User (Careful!)
```sql
-- Delete OTP records first (foreign key constraint)
DELETE FROM otp_verification WHERE user_id = 1;

-- Then delete user
DELETE FROM users WHERE user_id = 1;
```

## 📊 **Analytics Queries**

### User Registration Trends
```sql
SELECT 
    DATE(created_at) as registration_date,
    COUNT(*) as new_users
FROM users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;
```

### Role Distribution
```sql
SELECT 
    role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
FROM users 
GROUP BY role;
```

### Login Activity
```sql
SELECT 
    DATE(last_login) as login_date,
    COUNT(*) as active_users
FROM users 
WHERE last_login IS NOT NULL
GROUP BY DATE(last_login)
ORDER BY login_date DESC
LIMIT 10;
```

## 🔍 **Debugging Queries**

### Check Table Constraints
```sql
-- View all constraints on users table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;
```

### Check Indexes
```sql
-- View indexes on users table
\d+ users
```

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🧹 **Maintenance Commands**

### Clean Expired OTPs
```sql
DELETE FROM otp_verification 
WHERE expiry_time < NOW() OR used = TRUE;
```

### Reset All User Passwords (Development Only)
```sql
-- DO NOT RUN IN PRODUCTION!
UPDATE users 
SET password_hash = '$2b$10$defaulthash' 
WHERE role = 'operator';
```

### Backup Commands
```bash
# Backup database
pg_dump -U postgres -d manufacturing_db > backup.sql

# Restore database
psql -U postgres -d manufacturing_db < backup.sql
```

## 🚀 **Quick Reference**

### Most Used Commands
```sql
-- Connect
psql -U postgres -d manufacturing_db

-- List tables
\dt

-- View users
SELECT username, email, role FROM users;

-- Count users
SELECT COUNT(*) FROM users;

-- Exit
\q
```

### Emergency Commands
```sql
-- Create admin user
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@company.com', '$2b$10$hashedpassword', 'admin');

-- Reset user role
UPDATE users SET role = 'admin' WHERE email = 'user@company.com';

-- Clear all OTPs
DELETE FROM otp_verification;
```

---

**⚠️ Warning:** Always backup your database before running DELETE or UPDATE commands in production!