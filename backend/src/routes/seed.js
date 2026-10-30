const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const seedScriptPath = fs.existsSync(path.join(__dirname, '../../scripts/seed.js'))
  ? path.join(__dirname, '../../scripts/seed.js')
  : path.join(__dirname, '../scripts/seed.js');

const { seedDatabase } = require(seedScriptPath);

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
