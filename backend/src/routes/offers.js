const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');

const offersConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/offers.json'), 'utf8'));

/**
 * @openapi
 * /offers:
 *   get:
 *     summary: Get configured offers and customer-granted offers
 *     tags: [Offers]
 */
router.get('/', async (req, res, next) => {
  try {
    const grantedRes = await pool.query(`
      SELECT co.*, c.name AS customer_name, c.phone AS customer_phone
      FROM customer_offers co
      JOIN customers c ON c.id = co.customer_id
      ORDER BY co.id DESC;
    `);

    res.json({
      configuredOffers: offersConfig.offers,
      grantedOffers: grantedRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
