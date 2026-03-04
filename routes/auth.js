// routes/auth.js
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

// ── Employee Login ─────────────────────────────────────────
router.post('/employee/login', async (req, res) => {
  try {
    const { employee_id, password } = req.body;
    if (!employee_id || !password)
      return res.status(400).json({ error: 'employee_id and password required' });

    const [rows] = await db.query(
      `SELECT e.*, d.name AS department
       FROM employees e
       LEFT JOIN departments d ON e.dept_id = d.id
       WHERE e.employee_id = ? AND e.is_active = 1`,
      [employee_id.toUpperCase()]
    );

    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const emp = rows[0];

    const ok = await bcrypt.compare(password, emp.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ id: emp.id, employee_id: emp.employee_id, role: 'employee' });

    res.json({
      token,
      employee: {
        id:          emp.id,
        employee_id: emp.employee_id,
        name:        emp.name,
        email:       emp.email,
        department:  emp.department,
        role:        emp.role,
        phone:       emp.phone,
        avatar:      emp.avatar || emp.name.split(' ').map(w => w[0]).join('').toUpperCase(),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── HR Login ───────────────────────────────────────────────
router.post('/hr/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const [rows] = await db.query(
      'SELECT * FROM hr_users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const hr = rows[0];

    const ok = await bcrypt.compare(password, hr.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign({ id: hr.id, email: hr.email, role: 'hr' });

    res.json({
      token,
      hr: { id: hr.id, email: hr.email, full_name: hr.full_name, username: hr.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
