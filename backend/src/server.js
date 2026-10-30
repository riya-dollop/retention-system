const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const clockRouter = require('./routes/clock');
const customersRouter = require('./routes/customers');
const paymentsRouter = require('./routes/payments');
const webhookRouter = require('./routes/webhook');
const casesRouter = require('./routes/cases');
const notificationsRouter = require('./routes/notifications');
const seedRouter = require('./routes/seed');
const offersRouter = require('./routes/offers');
const reorderRouter = require('./routes/reorder');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable Cross-Origin Resource Sharing for Next.js frontend (port 3000)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger OpenAPI 3.0 Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wholesale Customer Retention & Payment Follow-up API',
      version: '1.0.0',
      description: 'REST API & Mock WhatsApp Webhook Engine for credit management, stage-based collection, retention offers, and churn prevention.',
      contact: {
        name: 'Technical Assignment Engineering Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Express Server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Retention System API Documentation & Test Platform',
}));

// Route Mounting
app.use('/clock', clockRouter);
app.use('/customers', customersRouter);
app.use('/payments', paymentsRouter);
app.use('/webhook', webhookRouter);
app.use('/cases', casesRouter);
app.use('/notifications', notificationsRouter);
app.use('/seed', seedRouter);
app.use('/offers', offersRouter);
app.use('/reorder', reorderRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Wholesale Retention & Payment Follow-up System',
  });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Backend API Server running at: http://localhost:${PORT}`);
    console.log(`Swagger Interactive Docs:      http://localhost:${PORT}/api-docs`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

