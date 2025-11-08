/**
 * Swagger/OpenAPI Configuration
 * 
 * This module configures Swagger for API documentation
 * using JSDoc comments in route files.
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Topapi - Production API',
      version: '1.0.0',
      description: 'A production-ready Node.js API with Express and Supabase integration',
      contact: {
        name: 'API Support',
        email: 'support@topapi.com',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'API Server',
      },
      {
        url: 'https://phpstack-868870-5982515.cloudwaysapps.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./api/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
