const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const caseService = require('../services/cases');
const clockService = require('../services/clock');

/**
 * @openapi
 * /cases:
 *   get:
 *     summary: List all cases with owner, status, customer details, and timeline
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: List of cases
 */
router.get('/', async (req, res, next) => {
  try {
    const cases = await caseService.getAllCases();
    res.json(cases);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /cases/{id}:
 *   patch:
 *     summary: Update case status or append timeline note
 *     tags: [Cases]
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const caseId = parseInt(req.params.id, 10);
    const { status, note, owner } = req.body;
    const currentDate = await clockService.getCurrentDate();

    const existingRes = await pool.query('SELECT * FROM cases WHERE id = $1;', [caseId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const c = existingRes.rows[0];
    const timeline = c.timeline || [];

    if (note || status) {
      timeline.push({
        date: currentDate,
        event: status ? `status_${status}` : 'note_added',
        note: note || `Case status changed to ${status}`,
      });
    }

    const updatedStatus = status || c.status;
    const updatedOwner = owner || c.owner;

    const updateRes = await pool.query(`
      UPDATE cases
      SET status = $1, owner = $2, timeline = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [updatedStatus, updatedOwner, JSON.stringify(timeline), caseId]);

    res.json(updateRes.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

