const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../scripts/seed');

/**
 * @openapi
 * /seed/reset:
 *   post:
 *     summary: Reset the database to initial baseline seed state
 *     tags: [Seed]
 *     responses:
 *       200:
 *         description: Database reset and seeded
 */
router.post('/reset', async (req, res, next) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      message: 'Database reset to baseline state: 10 customers, 20 invoices, 30 orders.',
      clockDate: '2026-10-20',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
