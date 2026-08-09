const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const buildSwaggerSpec = (port) => {
  const productionUrl = process.env.API_URL || 'https://api-parku-production.up.railway.app';

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
          url: `http://localhost:${port}`,
          description: 'Servidor de desarrollo',
        },
        {
          url: productionUrl,
          description: 'Servidor de producción (Railway)',
        },
      ],
    },
    // Rutas donde Swagger buscará los comentarios JSDoc
    apis: ['./src/routes/*.js', './src/controllers/*.js'],
  };

  return swaggerJsdoc(options);
};

const swaggerDocs = (app, port) => {
  const swaggerSpec = buildSwaggerSpec(port);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📖 Documentación disponible en http://localhost:${port}/api-docs`);
};

module.exports = { swaggerDocs };