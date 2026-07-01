// OpenAPI 3.0 specification for the Spotbot API
// Served at GET /api/docs

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Spotbot API',
    version: '1.0.0',
    description:
      'Spotbot API for influencer audience fraud detection. ' +
      'Programmatically scan Instagram and YouTube accounts ' +
      'and retrieve fraud scores.',
    contact: {
      name: 'Spotbot Support',
      email: 'support@spotbot.io',
    },
  },
  servers: [
    {
      url: 'https://api.spotbot.io',
      description: 'Production',
    },
    {
      url: 'http://localhost:8000',
      description: 'Development',
    },
  ],
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for programmatic access (Pro/Enterprise)',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from login',
      },
    },
    schemas: {
      Scan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'completed', 'failed'],
          },
          platform: {
            type: 'string',
            enum: ['instagram', 'youtube'],
          },
          handle: { type: 'string' },
          fraudScore: { type: 'integer', minimum: 0, maximum: 100 },
          riskLevel: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
          realReach: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/scans': {
      post: {
        summary: 'Create a new scan',
        description:
          'Initiate a fraud analysis scan for an Instagram or YouTube account.',
        tags: ['Scans'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['platform', 'handle'],
                properties: {
                  platform: {
                    type: 'string',
                    enum: ['instagram', 'youtube'],
                    example: 'instagram',
                  },
                  handle: {
                    type: 'string',
                    example: 'cristiano',
                    description: 'Handle without @ prefix',
                  },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: 'Scan created and queued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', example: 'pending' },
                    pollUrl: { type: 'string' },
                  },
                },
              },
            },
          },
          402: { description: 'Scan quota exceeded' },
          429: { description: 'Rate limit exceeded' },
        },
      },
      get: {
        summary: 'List scans',
        description: 'Get a paginated list of scans.',
        tags: ['Scans'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 100 },
          },
          {
            name: 'platform',
            in: 'query',
            schema: { type: 'string', enum: ['instagram', 'youtube'] },
          },
          {
            name: 'riskLevel',
            in: 'query',
            schema: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        ],
        responses: {
          200: {
            description: 'Paginated scan list',
          },
        },
      },
    },
    '/api/scans/{id}': {
      get: {
        summary: 'Get scan result',
        description:
          'Get the full fraud analysis result for a scan. ' +
          'Poll this endpoint until status is "completed".',
        tags: ['Scans'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Scan result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Scan' },
              },
            },
          },
          404: { description: 'Scan not found' },
        },
      },
    },
  },
}
