const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ParkU API Documentation',
      version: '1.0.0',
      description: 'Documentación completa de la API del sistema de parqueaderos ParkU',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api-parku-production.up.railway.app',
        description: 'Servidor de producción (Railway)',
      },
    ],
  },
  // Rutas donde Swagger buscará los comentarios JSDoc
  apis: ['./src/routes/*.js', './src/controllers/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = (app, port) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📖 Documentación disponible en http://localhost:${port}/api-docs`);
};

module.exports = { swaggerDocs };