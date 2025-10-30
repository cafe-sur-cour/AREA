import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { serviceRegistry } from '../../services/ServiceRegistry';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the user',
              example: 1,
            },
            name: {
              type: 'string',
              description: "User's full name",
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: "User's email address",
              example: 'john.doe@example.com',
            },
            is_admin: {
              type: 'boolean',
              description: 'Whether the user has admin privileges',
              example: false,
            },
            picture: {
              type: 'string',
              description: "URL to user's profile picture",
              example: 'https://example.com/picture.jpg',
            },
            bio: {
              type: 'string',
              description: "User's biography",
              example: 'Software developer passionate about technology',
            },
            email_verified: {
              type: 'boolean',
              description: "Whether the user's email has been verified",
              example: true,
            },
            timezone: {
              type: 'string',
              description: "User's timezone",
              example: 'UTC',
            },
            language: {
              type: 'string',
              description: "User's preferred language",
              example: 'en',
            },
            theme: {
              type: 'string',
              description: "User's preferred theme",
              example: 'light',
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user account is active',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2023-01-01T00:00:00.000Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last account update timestamp',
              example: '2023-01-01T00:00:00.000Z',
            },
            last_login_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
              example: '2023-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/webhooks/**/*.ts'],
};

function generateOAuthPaths() {
  const paths: Record<string, unknown> = {};
  const services = serviceRegistry.getAllServices();

  for (const service of services) {
    if (!service.oauth?.enabled) continue;

    const serviceId = service.id;
    const serviceName = service.name;
    const supportsLogin = service.oauth.supportsLogin ?? false;

    if (supportsLogin) {
      paths[`/api/auth/${serviceId}/login`] = {
        get: {
          summary: `Initiate ${serviceName} OAuth authorization for login/register`,
          tags: ['OAuth'],
          description: `Redirects user to ${serviceName} for OAuth authorization. This route is used for login/register when user is not authenticated.`,
          parameters: [
            {
              name: 'is_mobile',
              in: 'query',
              required: false,
              description:
                'Indicates if the request originates from mobile client',
              schema: {
                type: 'boolean',
              },
            },
          ],
          responses: {
            302: {
              description: `Redirect to ${serviceName} authorization page`,
            },
            500: {
              description: 'Internal Server Error',
            },
          },
        },
      };
    }

    paths[`/api/auth/${serviceId}/callback`] = {
      get: {
        summary: `Handle ${serviceName} OAuth callback`,
        tags: ['OAuth'],
        description: supportsLogin
          ? `Exchanges authorization code for access token and handles authentication. Automatically determines whether to perform login/register or service connection based on user authentication status.`
          : `Handles ${serviceName} service connection. Requires user to be authenticated before connecting.`,
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            description: `Authorization code from ${serviceName}`,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'state',
            in: 'query',
            required: false,
            description: 'State parameter for CSRF protection',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'OAuth successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  oneOf: supportsLogin
                    ? [
                        {
                          description: 'Login/Register response',
                          properties: {
                            token: {
                              type: 'string',
                            },
                            user: {
                              type: 'object',
                            },
                          },
                        },
                        {
                          description: 'Service connection response',
                          properties: {
                            message: {
                              type: 'string',
                            },
                            user: {
                              type: 'object',
                            },
                          },
                        },
                      ]
                    : [
                        {
                          description: 'Service connection response',
                          properties: {
                            message: {
                              type: 'string',
                            },
                          },
                        },
                      ],
                },
              },
            },
          },
          400: {
            description: 'Bad Request - Missing parameters',
          },
          401: {
            description: supportsLogin
              ? undefined
              : `Unauthorized - ${serviceName} requires authentication`,
          },
          500: {
            description: 'Internal Server Error',
          },
        },
      },
    };
  }

  return paths;
}

const baseSpecs = swaggerJsdoc(options) as {
  paths?: Record<string, unknown>;
  [key: string]: unknown;
};

export const setupSwagger = (app: Express) => {
  const getSpecs = () => {
    const oauthPaths = generateOAuthPaths();
    return {
      ...baseSpecs,
      paths: {
        ...(baseSpecs.paths || {}),
        ...oauthPaths,
      },
    };
  };

  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', (req, res) => {
    const specs = getSpecs();
    res.send(swaggerUi.generateHTML(specs));
  });
};
