// routes/employees.js  — HR-only CRUD for employee records
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../db');
const auth   = require('../middleware/auth');

// helper: next employee ID
async function nextEmpId() {
  const [[row]] = await db.query(
    "SELECT employee_id FROM employees ORDER BY id DESC LIMIT 1"
  );
  if (!row) return 'EMP001';
  const num = parseInt(row.employee_id.replace('EMP', '')) + 1;
  return 'EMP' + String(num).padStart(3, '0');
}

// ── List all employees ─────────────────────────────────────
router.get('/', auth('hr'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.employee_id, e.name, e.email, e.role,
             e.phone, e.avatar, e.is_active, e.created_at,
             d.name AS department, d.id AS dept_id
      FROM employees e
      LEFT JOIN departments d ON e.dept_id = d.id
      ORDER BY e.name`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── Get single employee ────────────────────────────────────
router.get('/:id', auth('hr'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, d.name AS department
      FROM employees e LEFT JOIN departments d ON e.dept_id = d.id
      WHERE e.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const { password_hash, ...emp } = rows[0];
    res.json(emp);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── Add employee ───────────────────────────────────────────
router.post('/', auth('hr'), async (req, res) => {
  try {
    const { name, email, password, dept_id, role, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, password required' });

    const employee_id   = await nextEmpId();
    const password_hash = await bcrypt.hash(password, 12);
    const avatar        = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const [result] = await db.query(
      `INSERT INTO employees (employee_id, name, email, password_hash, dept_id, role, phone, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, name, email, password_hash, dept_id || null, role || 'Employee', phone || null, avatar]
    );

    res.status(201).json({ success: true, employee_id, id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update employee ────────────────────────────────────────
router.put('/:id', auth('hr'), async (req, res) => {
  try {
    const { name, email, dept_id, role, phone, is_active, password } = req.body;
    const fields = [];
    const vals   = [];

    if (name !== undefined)      { fields.push('name=?');      vals.push(name); }
    if (email !== undefined)     { fields.push('email=?');     vals.push(email); }
    if (dept_id !== undefined)   { fields.push('dept_id=?');   vals.push(dept_id); }
    if (role !== undefined)      { fields.push('role=?');      vals.push(role); }
    if (phone !== undefined)     { fields.push('phone=?');     vals.push(phone); }
    if (is_active !== undefined) { fields.push('is_active=?'); vals.push(is_active); }
    if (password)                { fields.push('password_hash=?'); vals.push(await bcrypt.hash(password, 12)); }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    vals.push(req.params.id);
    await db.query(`UPDATE employees SET ${fields.join(',')} WHERE id=?`, vals);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── Deactivate / delete ────────────────────────────────────
router.delete('/:id', auth('hr'), async (req, res) => {
  try {
    await db.query('UPDATE employees SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── List departments ───────────────────────────────────────
router.get('/meta/departments', auth('hr'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
