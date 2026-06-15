import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfriBiz API',
      version: '1.0.0',
      description: [
        'API REST de la plateforme AfriBiz.',
        '',
        '## Fonctionnalites',
        '- Authentification (JWT, 2FA)',
        '- Gestion de business (produits, services, commandes)',
        '- Marketplace de modules developpeur',
        '- Publicites (AfriBiz Ads)',
        '- Social Commerce (Stories, Shorts, Lives)',
        '- Paiements (Mobile Money, Escrow)',
        '- Analytics & Data Hub',
        '- Messagerie & Notifications',
      ].join('\n'),
      contact: { name: 'Support AfriBiz', email: 'support@afribiz.com' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Developpement local' },
      { url: 'https://api.afribiz.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        csrfToken: { type: 'apiKey', in: 'header', name: 'x-csrf-token' },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }, { csrfToken: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification' },
      { name: 'Business', description: 'Profil business' },
      { name: 'Produits', description: 'Catalogue produits' },
      { name: 'Commandes', description: 'Commandes clients' },
      { name: 'Paiements', description: 'Paiements' },
      { name: 'Publicites', description: 'AfriBiz Ads' },
      { name: 'Favoris', description: 'Favoris utilisateurs' },
      { name: 'Marketplace', description: 'Modules developpeur' },
      { name: 'Stories', description: 'Stories ephemeres' },
      { name: 'Admin', description: 'Administration' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './dist/routes/*.js', './dist/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
