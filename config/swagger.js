const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NJCabinets API',
      version: '8.2.3',
      description: 'Cabinet quotation and order management system API - A full-stack solution for contractors and administrators to manage cabinet quotes, customers, manufacturers, and orders.',
      contact: {
        name: 'NJCabinets Support',
        url: process.env.APP_URL || 'http://localhost:8080',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:8080',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'contractor', 'user'] },
            group_id: { type: 'integer' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            notes: { type: 'string' },
            group_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Manufacturer: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            logo: { type: 'string' },
            website: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Proposal: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            customer_id: { type: 'integer' },
            manufacturer_id: { type: 'integer' },
            status: { type: 'string', enum: ['draft', 'pending', 'approved', 'rejected'] },
            total: { type: 'number', format: 'float' },
            notes: { type: 'string' },
            group_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Manufacturers', description: 'Manufacturer and catalog management' },
      { name: 'Proposals', description: 'Proposal/Quote management' },
      { name: 'Users', description: 'User management' },
      { name: 'Locations', description: 'Location management' },
      { name: 'Taxes', description: 'Tax configuration' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Customization', description: 'Application customization' },
      { name: 'Global Modifications', description: 'Global modification templates' },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
