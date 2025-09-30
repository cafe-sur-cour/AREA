---
sidebar_position: 4
---

# Create API Routes

This guide explains how to create and implement new API routes in the AREA platform backend using Express.js, TypeScript, and Swagger documentation.

## Overview

API routes in AREA follow RESTful conventions and include comprehensive Swagger documentation, authentication, validation, and error handling. All routes are automatically documented and accessible through the Swagger UI.

**Swagger Documentation**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

## Prerequisites

- Understanding of RESTful API design
- Knowledge of Express.js and TypeScript
- Familiarity with Swagger/OpenAPI specification
- Basic understanding of authentication and middleware

## Route Structure and Organization

### Directory Structure

```
backend/src/routes/
├── auth/           # Authentication routes
├── user/           # User management routes
├── api/            # General API endpoints
├── about/          # System information
├── github/         # GitHub-specific routes
├── services/       # Service configuration routes
├── webhooks/       # Webhook management routes
└── your-feature/   # Your new feature routes
```

## Step-by-Step Route Creation

### 1. Create Route File

Create a new route file in the appropriate directory:

**File**: `backend/src/routes/your-feature/your-feature.ts`

```typescript
import express, { Request, Response } from 'express';
import { AppDataSource } from '../../config/db';
import { authenticateToken } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { YourEntity } from '../../config/entity/YourEntity';
import { body, param, query } from 'express-validator';

const router = express.Router();

router.get(
  '/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('is_active').optional().isBoolean().toBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, is_active } = req.query;
      const userId = (req as any).user.id;

      const repository = AppDataSource.getRepository(YourEntity);
      const queryBuilder = repository.createQueryBuilder('entity')
        .where('entity.user_id = :userId', { userId });

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(entity.name ILIKE :search OR entity.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (is_active !== undefined) {
        queryBuilder.andWhere('entity.is_active = :is_active', { is_active });
      }

      // Apply pagination
      const skip = ((page as number) - 1) * (limit as number);
      queryBuilder.skip(skip).take(limit as number);

      // Add ordering
      queryBuilder.orderBy('entity.created_at', 'DESC');

      const [entities, total] = await queryBuilder.getManyAndCount();

      res.json({
        data: entities,
        pagination: {
          page: page as number,
          limit: limit as number,
          total,
          totalPages: Math.ceil(total / (limit as number)),
        },
      });
    } catch (error) {
      console.error('Error fetching entities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/',
  authenticateToken,
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
    body('description')
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, description, is_active = true } = req.body;
      const userId = (req as any).user.id;

      const repository = AppDataSource.getRepository(YourEntity);

      // Check for duplicate names (if applicable)
      const existingEntity = await repository.findOne({
        where: { name, user_id: userId },
      });

      if (existingEntity) {
        return res.status(400).json({
          error: 'Validation failed',
          details: [{ field: 'name', message: 'Entity name already exists' }],
        });
      }

      // Create new entity
      const entity = new YourEntity();
      entity.name = name;
      entity.description = description;
      entity.is_active = is_active;
      entity.user_id = userId;

      const savedEntity = await repository.save(entity);

      res.status(201).json(savedEntity);
    } catch (error) {
      console.error('Error creating entity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/:id',
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const repository = AppDataSource.getRepository(YourEntity);
      const entity = await repository.findOne({
        where: { id: parseInt(id), user_id: userId },
      });

      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      res.json(entity);
    } catch (error) {
      console.error('Error fetching entity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be between 1 and 1000 characters'),
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const updateData = req.body;

      const repository = AppDataSource.getRepository(YourEntity);
      const entity = await repository.findOne({
        where: { id: parseInt(id), user_id: userId },
      });

      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      // Check for duplicate names if name is being updated
      if (updateData.name && updateData.name !== entity.name) {
        const existingEntity = await repository.findOne({
          where: { name: updateData.name, user_id: userId },
        });

        if (existingEntity) {
          return res.status(400).json({
            error: 'Validation failed',
            details: [{ field: 'name', message: 'Entity name already exists' }],
          });
        }
      }

      // Update entity
      Object.assign(entity, updateData);
      entity.updated_at = new Date();

      const updatedEntity = await repository.save(entity);

      res.json(updatedEntity);
    } catch (error) {
      console.error('Error updating entity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete(
  '/:id',
  authenticateToken,
  [param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const repository = AppDataSource.getRepository(YourEntity);
      const entity = await repository.findOne({
        where: { id: parseInt(id), user_id: userId },
      });

      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      await repository.remove(entity);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting entity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
```

### 2. Create Middleware (if needed)

Create custom middleware for your routes:

**File**: `backend/src/middleware/yourFeatureMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/db';
import { YourEntity } from '../config/entity/YourEntity';

export const checkEntityOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const repository = AppDataSource.getRepository(YourEntity);
    const entity = await repository.findOne({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Attach entity to request for use in route handler
    (req as any).entity = entity;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateEntityAccess = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user.roles.includes(requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Access validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};
```

### 3. Register Routes in Main Application

Add your routes to the main application:

**File**: `backend/index.ts`

```typescript
import yourFeatureRoutes from './src/routes/your-feature/your-feature';

// Register routes
app.use('/api/your-feature', yourFeatureRoutes);
```

### 4. Add Route Tests

Create comprehensive tests for your routes:

**File**: `backend/tests/routes/your-feature.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../index';
import { AppDataSource } from '../../src/config/db';
import { User } from '../../src/config/entity/User';
import { YourEntity } from '../../src/config/entity/YourEntity';
import jwt from 'jsonwebtoken';

describe('Your Feature Routes', () => {
  let authToken: string;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    
    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = new User();
    testUser.email = 'test@example.com';
    testUser.name = 'Test User';
    testUser.password_hash = 'hashed_password';
    await userRepo.save(testUser);

    // Generate auth token
    authToken = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'test');
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('GET /api/your-feature', () => {
    it('should return paginated entities', async () => {
      const response = await request(app)
        .get('/api/your-feature')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/your-feature')
        .expect(401);
    });
  });

  describe('POST /api/your-feature', () => {
    it('should create a new entity', async () => {
      const entityData = {
        name: 'Test Entity',
        description: 'Test description',
        is_active: true,
      };

      const response = await request(app)
        .post('/api/your-feature')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      expect(response.body.name).toBe(entityData.name);
      expect(response.body.description).toBe(entityData.description);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/your-feature')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
```

## Authentication and Authorization

### JWT Authentication Middleware

```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || '', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = user;
    next();
  });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

## Request Validation

### Validation Middleware

```typescript
// backend/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
      })),
    });
  }
  
  next();
};
```

## Error Handling

### Global Error Handler

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.message,
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message }),
  });
};
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Apply rate limiting
const createEntityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many entity creation requests from this IP',
});

router.post('/', createEntityLimiter, authenticateToken, /* ... */);
```

## API Versioning

```typescript
// Version 1 routes
app.use('/api/v1/your-feature', yourFeatureV1Routes);

// Version 2 routes (with backward compatibility)
app.use('/api/v2/your-feature', yourFeatureV2Routes);

// Default to latest version
app.use('/api/your-feature', yourFeatureV2Routes);
```

## Swagger Configuration

The Swagger documentation is automatically generated from JSDoc comments. Key components:

**File**: `backend/src/routes/docs/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AREA API',
      version: '1.0.0',
      description: 'AREA Platform API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
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
  },
  apis: ['./src/routes/**/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
```

## Best Practices

:::tip Route Development Best Practices

1. **RESTful Design**: Follow REST conventions for URL structure
2. **Consistent Response Format**: Maintain consistent JSON response structure
3. **Error Handling**: Implement comprehensive error handling
4. **Validation**: Validate all input data
5. **Authentication**: Secure all routes that require authentication
6. **Documentation**: Document all endpoints with Swagger
7. **Testing**: Write comprehensive tests for all routes
8. **Pagination**: Implement pagination for list endpoints
9. **Rate Limiting**: Apply rate limiting where appropriate
10. **Logging**: Log important operations and errors

:::

### Response Format Standards

```typescript
// Success responses
{
  "data": { /* entity or array */ },
  "message": "Optional success message"
}

// Error responses
{
  "error": "Error description",
  "details": "Additional error details (optional)"
}

// Paginated responses
{
  "data": [ /* array of entities */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Common Route Patterns

### Search and Filtering

```typescript
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { search, category, status, sort = 'created_at', order = 'DESC' } = req.query;
  
  const queryBuilder = repository.createQueryBuilder('entity');
  
  if (search) {
    queryBuilder.andWhere('entity.name ILIKE :search', { search: `%${search}%` });
  }
  
  if (category) {
    queryBuilder.andWhere('entity.category = :category', { category });
  }
  
  if (status) {
    queryBuilder.andWhere('entity.status = :status', { status });
  }
  
  queryBuilder.orderBy(`entity.${sort}`, order as 'ASC' | 'DESC');
  
  const entities = await queryBuilder.getMany();
  res.json({ data: entities });
});
```

### Bulk Operations

```typescript
router.post('/bulk', authenticateToken, async (req: Request, res: Response) => {
  const { action, ids } = req.body;
  
  const repository = AppDataSource.getRepository(YourEntity);
  
  switch (action) {
    case 'delete':
      await repository.delete({ id: In(ids), user_id: userId });
      break;
    case 'activate':
      await repository.update({ id: In(ids), user_id: userId }, { is_active: true });
      break;
    case 'deactivate':
      await repository.update({ id: In(ids), user_id: userId }, { is_active: false });
      break;
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
  
  res.json({ message: `Bulk ${action} completed successfully` });
});
```

## Testing Your Routes

### Manual Testing with curl

```bash
# Test GET endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/your-feature

# Test POST endpoint
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Entity","description":"Test description"}' \
     http://localhost:3000/api/your-feature

# Test with query parameters
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/api/your-feature?page=1&limit=5&search=test"
```

### Using Postman

1. Import the OpenAPI specification from `http://localhost:8080/api-docs.json`
2. Set up environment variables for base URL and auth token
3. Test all endpoints with various scenarios

## Troubleshooting

### Common Issues

1. **Route not found (404)**: Check route registration in main app
2. **Authentication failures**: Verify JWT token format and validity
3. **Validation errors**: Check request body format and validation rules
4. **Database errors**: Verify entity relationships and constraints
5. **CORS issues**: Ensure CORS is configured for your frontend domain

### Debugging Tips

```typescript
// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    user: (req as any).user?.id
  });
  next();
});
```

## Next Steps

After creating your API routes:

1. Test all endpoints thoroughly
2. Add comprehensive error handling
3. Implement proper logging and monitoring
4. Create frontend integration
5. Add performance optimizations (caching, indexing)
6. Document any special requirements or limitations

For more information about the overall architecture, see [Project Architecture](../building.md).
