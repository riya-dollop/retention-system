const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Retrieve staff and escalation notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, salesperson, manager]
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = `
      SELECT n.*, c.name AS customer_name, c.phone AS customer_phone
      FROM notifications n
      LEFT JOIN customers c ON c.id = n.customer_id
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ' WHERE n.recipient_role = $1';
      params.push(role);
    }

    query += ' ORDER BY n.id DESC;';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(`
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      RETURNING *;
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
