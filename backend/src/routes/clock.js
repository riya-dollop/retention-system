const express = require('express');
const router = express.Router();
const clockService = require('../services/clock');

/**
 * @openapi
 * /clock:
 *   get:
 *     summary: Get current simulated date
 *     tags: [Clock]
 *     responses:
 *       200:
 *         description: Current fake clock date
 */
router.get('/', async (req, res, next) => {
  try {
    const currentDate = await clockService.getCurrentDate();
    res.json({ currentDate });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /clock/advance:
 *   post:
 *     summary: Advance the simulated clock forward and run the stage engine
 *     tags: [Clock]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of days to fast forward
 *     responses:
 *       200:
 *         description: Clock advanced successfully with audit summary
 */
router.post('/advance', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || req.body.days || 1, 10);
    const result = await clockService.advanceClock(days);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

