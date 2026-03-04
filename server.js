// server.js — Ram Infosys Employee Portal API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/employees',  require('./routes/employees'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀  Ram Infosys API running on http://localhost:${PORT}`));
