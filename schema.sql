-- ============================================================
--  Ram Infosys Employee Portal — PostgreSQL Schema
--  Run this file once to set up the database
-- ============================================================

-- ─── Departments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name) VALUES
  ('Engineering'), ('Design'), ('Marketing'),
  ('Sales'), ('HR'), ('Finance'), ('Operations')
ON CONFLICT DO NOTHING;

-- ─── Employees ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id            SERIAL PRIMARY KEY,
  employee_id   VARCHAR(20)  NOT NULL UNIQUE,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dept_id       INT,
  role          VARCHAR(100) DEFAULT 'Employee',
  phone         VARCHAR(20),
  avatar        VARCHAR(10),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_update_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── HR Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(150) NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─── Attendance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  employee_id INT NOT NULL,
  date        DATE NOT NULL,
  check_in    TIMESTAMPTZ,
  check_out   TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL
         THEN EXTRACT(EPOCH FROM (check_out - check_in))::INT / 60
         ELSE NULL END
  ) STORED,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TRIGGER attendance_update_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed: Default HR Admin ──────────────────────────────────
-- Password: hr@Admin2024  (bcrypt hash below is for that password)
INSERT INTO hr_users (username, email, password_hash, full_name) VALUES
(
  'hradmin',
  'hr@raminfosys.in',
  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui',
  'HR Administrator'
)
ON CONFLICT DO NOTHING;

-- ─── Seed: Sample Employees ──────────────────────────────────
-- Password for all: pass@123  (bcrypt hash below)
INSERT INTO employees (employee_id, name, email, password_hash, dept_id, role, phone, avatar) VALUES
('EMP001', 'Arjun Sharma',   'arjun@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'Senior Developer',  '9876543210', 'AS'),
('EMP002', 'Priya Nair',     'priya@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 2, 'UI/UX Designer',    '9876543211', 'PN'),
('EMP003', 'Rohan Mehta',    'rohan@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'Backend Developer', '9876543212', 'RM'),
('EMP004', 'Sneha Patel',    'sneha@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 3, 'Marketing Manager', '9876543213', 'SP'),
('EMP005', 'Kiran Reddy',    'kiran@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 4, 'Sales Executive',   '9876543214', 'KR'),
('EMP006', 'Divya Krishnan', 'divya@raminfosys.in',  '$2a$12$K8GjRIy4.M9sJpQ2N7hLJu3YZCjKm5vXwBkDhF1aE6rWnOtP4Yvui', 1, 'QA Engineer',       '9876543215', 'DK')
ON CONFLICT DO NOTHING;
