-- ============================================================
--  Ram Infosys Employee Portal — MySQL Schema
--  Run this file once to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS ram_infosys CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ram_infosys;

-- ─── Departments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO departments (name) VALUES
  ('Engineering'), ('Design'), ('Marketing'),
  ('Sales'), ('HR'), ('Finance'), ('Operations');

-- ─── Employees ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   VARCHAR(20)  NOT NULL UNIQUE,   -- e.g. EMP001
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dept_id       INT,
  role          VARCHAR(100) DEFAULT 'Employee',
  phone         VARCHAR(20),
  avatar        VARCHAR(10),                    -- initials
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ─── HR Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Attendance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date        DATE NOT NULL,
  check_in    DATETIME,
  check_out   DATETIME,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL
         THEN TIMESTAMPDIFF(MINUTE, check_in, check_out)
         ELSE NULL END
  ) STORED,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_date (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ─── Seed: Default HR Admin ──────────────────────────────────
-- Password: hr@Admin2024  (bcrypt hash below is for that password)
INSERT IGNORE INTO hr_users (username, email, password_hash, full_name) VALUES
(
  'hradmin',
  'hr@raminfosys.in',
  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui',
  'HR Administrator'
);

-- ─── Seed: Sample Employees ──────────────────────────────────
-- Password for all: pass@123  (bcrypt hash below)
INSERT IGNORE INTO employees (employee_id, name, email, password_hash, dept_id, role, phone, avatar) VALUES
('EMP001', 'Arjun Sharma',   'arjun@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'Senior Developer',  '9876543210', 'AS'),
('EMP002', 'Priya Nair',     'priya@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 2, 'UI/UX Designer',    '9876543211', 'PN'),
('EMP003', 'Rohan Mehta',    'rohan@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'Backend Developer', '9876543212', 'RM'),
('EMP004', 'Sneha Patel',    'sneha@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 3, 'Marketing Manager', '9876543213', 'SP'),
('EMP005', 'Kiran Reddy',    'kiran@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 4, 'Sales Executive',   '9876543214', 'KR'),
('EMP006', 'Divya Krishnan', 'divya@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'QA Engineer',       '9876543215', 'DK');
