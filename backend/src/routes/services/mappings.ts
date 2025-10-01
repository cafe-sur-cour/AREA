import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { mappingService } from './mappings.service';
import type { Action, Reaction } from '../../types/mapping';

const router = express.Router();

function validateMappingRequest(body: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return { isValid: false, errors };
  }

  const bodyObj = body as Record<string, unknown>;

  if (
    bodyObj.name !== undefined &&
    (typeof bodyObj.name !== 'string' || bodyObj.name.trim() === '')
  ) {
    errors.push('Name must be a non-empty string if provided');
  }

  if (!bodyObj.action || typeof bodyObj.action !== 'object') {
    errors.push('Action is required and must be an object');
  } else {
    const action = bodyObj.action as Record<string, unknown>;
    if (!action.type || typeof action.type !== 'string') {
      errors.push('Action type is required and must be a string');
    }
    if (!action.config || typeof action.config !== 'object') {
      errors.push('Action config is required and must be an object');
    }
  }

  if (
    !bodyObj.reactions ||
    !Array.isArray(bodyObj.reactions) ||
    bodyObj.reactions.length === 0
  ) {
    errors.push('Reactions is required and must be a non-empty array');
  } else {
    bodyObj.reactions.forEach((reaction: unknown, index: number) => {
      if (!reaction || typeof reaction !== 'object') {
        errors.push(`Reaction ${index + 1}: must be an object`);
        return;
      }
      const reactionObj = reaction as Record<string, unknown>;
      if (!reactionObj.type || typeof reactionObj.type !== 'string') {
        errors.push(
          `Reaction ${index + 1}: type is required and must be a string`
        );
      }
      if (!reactionObj.config || typeof reactionObj.config !== 'object') {
        errors.push(
          `Reaction ${index + 1}: config is required and must be an object`
        );
      }

      if (reactionObj.delay !== undefined) {
        if (typeof reactionObj.delay !== 'number' || reactionObj.delay < 0) {
          errors.push(
            `Reaction ${index + 1}: delay must be a positive number (seconds)`
          );
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateActionReactionTypes(
  action: Action,
  reactions: Reaction[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const actionDefinition = serviceRegistry.getActionByType(action.type);
  if (!actionDefinition) {
    errors.push(
      `Action type '${action.type}' not found in any registered service`
    );
  }

  reactions.forEach((reaction, index) => {
    const reactionDefinition = serviceRegistry.getReactionByType(reaction.type);
    if (!reactionDefinition) {
      errors.push(
        `Reaction ${index + 1} type '${reaction.type}' not found in any registered service`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * @swagger
 * /api/mappings:
 *   post:
 *     summary: Create a mapping between an action and one or more reactions
 *     tags:
 *       - Mappings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - action
 *               - reactions
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the mapping
 *               description:
 *                 type: string
 *                 description: Optional description of the mapping
 *               action:
 *                 type: object
 *                 required:
 *                   - type
 *                   - config
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Action type in format "service.action"
 *                   config:
 *                     type: object
 *                     description: Action configuration
 *               reactions:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - config
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Reaction type in format "service.reaction"
 *                     config:
 *                       type: object
 *                       description: Reaction configuration
 *                     delay:
 *                       type: number
 *                       description: Optional delay in seconds before executing this reaction
 *                       minimum: 0
 *               is_active:
 *                 type: boolean
 *                 description: Whether the mapping is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Mapping created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mapping:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     action:
 *                       type: object
 *                     reactions:
 *                       type: array
 *                     delay:
 *                       type: number
 *                     is_active:
 *                       type: boolean
 *                     created_by:
 *                       type: number
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request data"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of validation errors
 *       404:
 *         description: Action or reaction type not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid action or reaction types"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of invalid types
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      const validation = validateMappingRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.errors,
        });
      }

      const {
        name,
        description,
        action,
        reactions,
        is_active = true,
      } = req.body;

      const typeValidation = validateActionReactionTypes(action, reactions);
      if (!typeValidation.isValid) {
        return res.status(404).json({
          error: 'Invalid action or reaction types',
          details: typeValidation.errors,
        });
      }

      const savedMapping = await mappingService.createMapping({
        name: name || undefined,
        description,
        action,
        reactions,
        is_active,
        created_by: userId,
      });

      return res.status(201).json({
        mapping: {
          id: savedMapping.id,
          name: savedMapping.name,
          description: savedMapping.description,
          action: savedMapping.action,
          reactions: savedMapping.reactions,
          is_active: savedMapping.is_active,
          created_by: savedMapping.created_by,
          created_at: savedMapping.created_at,
          updated_at: savedMapping.updated_at,
        },
      });
    } catch (err) {
      console.error('Error creating mapping:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/mappings:
 *   get:
 *     summary: Get all mappings for the authenticated user
 *     tags:
 *       - Mappings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mappings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Unique identifier for the mapping
 *                       name:
 *                         type: string
 *                         description: Human-readable name for the mapping
 *                       description:
 *                         type: string
 *                         description: Optional description of the mapping
 *                       action:
 *                         type: object
 *                         description: Action configuration
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Action type in format "service.action"
 *                           config:
 *                             type: object
 *                             description: Action configuration parameters
 *                       reactions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               description: Reaction type in format "service.reaction"
 *                             config:
 *                               type: object
 *                               description: Reaction configuration parameters
 *                             delay:
 *                               type: number
 *                               description: Optional delay in seconds before executing this reaction
 *                               minimum: 0
 *                       is_active:
 *                         type: boolean
 *                         description: Whether the mapping is currently active
 *                       created_by:
 *                         type: integer
 *                         description: ID of the user who created the mapping
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Timestamp when the mapping was created
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Timestamp when the mapping was last updated
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const mappings = await mappingService.getUserMappings(userId);

      return res.status(200).json({
        mappings: mappings.map(mapping => ({
          id: mapping.id,
          name: mapping.name,
          description: mapping.description,
          action: mapping.action,
          reactions: mapping.reactions,
          is_active: mapping.is_active,
          created_by: mapping.created_by,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
        })),
      });
    } catch (err) {
      console.error('Error fetching mappings:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/mappings/{id}:
 *   get:
 *     summary: Get a specific mapping by ID
 *     tags:
 *       - Mappings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the mapping
 *     responses:
 *       200:
 *         description: Mapping details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mapping:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Unique identifier for the mapping
 *                     name:
 *                       type: string
 *                       description: Human-readable name for the mapping
 *                     description:
 *                       type: string
 *                       description: Optional description of the mapping
 *                     action:
 *                       type: object
 *                       description: Action configuration
 *                       properties:
 *                         type:
 *                           type: string
 *                           description: Action type in format "service.action"
 *                         config:
 *                           type: object
 *                           description: Action configuration parameters
 *                     reactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Reaction type in format "service.reaction"
 *                           config:
 *                             type: object
 *                             description: Reaction configuration parameters
 *                           delay:
 *                             type: number
 *                             description: Optional delay in seconds before executing this reaction
 *                             minimum: 0
 *                     is_active:
 *                       type: boolean
 *                       description: Whether the mapping is currently active
 *                     created_by:
 *                       type: integer
 *                       description: ID of the user who created the mapping
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the mapping was created
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the mapping was last updated
 *       400:
 *         description: Invalid mapping ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid mapping ID"
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Mapping not found"
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Mapping ID is required' });
      }

      const mappingId = parseInt(id);

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: 'Invalid mapping ID' });
      }

      const mapping = await mappingService.getMappingById(mappingId, userId);

      if (!mapping) {
        return res.status(404).json({
          error: 'Mapping not found',
        });
      }

      return res.status(200).json({
        mapping: {
          id: mapping.id,
          name: mapping.name,
          description: mapping.description,
          action: mapping.action,
          reactions: mapping.reactions,
          is_active: mapping.is_active,
          created_by: mapping.created_by,
          created_at: mapping.created_at,
          updated_at: mapping.updated_at,
        },
      });
    } catch (err) {
      console.error('Error fetching mapping:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/mappings/{id}:
 *   delete:
 *     summary: Delete a mapping
 *     tags:
 *       - Mappings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the mapping to delete
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mapping deleted successfully"
 *       400:
 *         description: Invalid mapping ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid mapping ID"
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Mapping not found"
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Mapping ID is required' });
      }

      const mappingId = parseInt(id);

      if (isNaN(mappingId)) {
        return res.status(400).json({ error: 'Invalid mapping ID' });
      }

      const deleted = await mappingService.deleteMapping(mappingId, userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Mapping not found',
        });
      }

      return res.status(200).json({
        message: 'Mapping deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting mapping:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
