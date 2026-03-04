// routes/attendance.js
const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// ── Check In ───────────────────────────────────────────────
router.post('/checkin', auth('employee'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();

    // Prevent duplicate check-in
    const [existing] = await db.query(
      'SELECT id, check_in, check_out FROM attendance WHERE employee_id = ? AND date = ?',
      [req.user.id, today]
    );

    if (existing.length && existing[0].check_in)
      return res.status(409).json({ error: 'Already checked in today' });

    if (existing.length) {
      await db.query('UPDATE attendance SET check_in = ? WHERE id = ?', [now, existing[0].id]);
    } else {
      await db.query(
        'INSERT INTO attendance (employee_id, date, check_in) VALUES (?, ?, ?)',
        [req.user.id, today, now]
      );
    }

    res.json({ success: true, check_in: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Check Out ──────────────────────────────────────────────
router.post('/checkout', auth('employee'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now   = new Date();

    const [rows] = await db.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [req.user.id, today]
    );

    if (!rows.length || !rows[0].check_in)
      return res.status(400).json({ error: 'Not checked in yet' });
    if (rows[0].check_out)
      return res.status(409).json({ error: 'Already checked out today' });

    await db.query('UPDATE attendance SET check_out = ? WHERE id = ?', [now, rows[0].id]);

    res.json({ success: true, check_out: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Today's record for logged-in employee ─────────────────
router.get('/today', auth('employee'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [req.user.id, today]
    );
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── Employee's own history ─────────────────────────────────
router.get('/history', auth('employee'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const [rows] = await db.query(
      `SELECT date, check_in, check_out, duration_minutes
       FROM attendance WHERE employee_id = ?
       ORDER BY date DESC LIMIT ?`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── HR: All attendance for a date ─────────────────────────
router.get('/hr/daily', auth('hr'), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const dept = req.query.dept;

    let q = `
      SELECT a.*, e.employee_id, e.name, e.email, e.role, e.avatar,
             d.name AS department
      FROM employees e
      LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = ?
      LEFT JOIN departments d ON e.dept_id = d.id
      WHERE e.is_active = 1`;
    const params = [date];

    if (dept && dept !== 'All') { q += ' AND d.name = ?'; params.push(dept); }
    q += ' ORDER BY e.name';

    const [rows] = await db.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── HR: All records with optional filters ─────────────────
router.get('/hr/all', auth('hr'), async (req, res) => {
  try {
    const { date, dept, emp_id } = req.query;
    let q = `
      SELECT a.date, a.check_in, a.check_out, a.duration_minutes,
             e.employee_id, e.name, e.role, e.avatar, d.name AS department
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.dept_id = d.id
      WHERE 1=1`;
    const params = [];

    if (date)   { q += ' AND a.date = ?';       params.push(date); }
    if (dept && dept !== 'All') { q += ' AND d.name = ?'; params.push(dept); }
    if (emp_id) { q += ' AND e.employee_id = ?'; params.push(emp_id); }
    q += ' ORDER BY a.date DESC, e.name LIMIT 200';

    const [rows] = await db.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── HR: Stats summary ─────────────────────────────────────
router.get('/hr/stats', auth('hr'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM employees WHERE is_active=1');
    const [[{ present }]] = await db.query(
      'SELECT COUNT(*) AS present FROM attendance WHERE date=? AND check_in IS NOT NULL', [today]);
    const [[{ active_now }]] = await db.query(
      'SELECT COUNT(*) AS active_now FROM attendance WHERE date=? AND check_in IS NOT NULL AND check_out IS NULL', [today]);
    const [[{ on_time }]] = await db.query(
      'SELECT COUNT(*) AS on_time FROM attendance WHERE date=? AND check_in IS NOT NULL AND HOUR(check_in)<10', [today]);

    res.json({ total, present, absent: total - present, active_now, on_time, late: present - on_time });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
