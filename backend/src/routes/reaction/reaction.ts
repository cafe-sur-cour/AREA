import express, { Request, Response } from 'express';
import { ReactionService } from './reaction.service';
import { serviceRegistry } from '../../services/ServiceRegistry';

const router = express.Router();
const reactionService = new ReactionService();

/**
 * @swagger
 * /api/reactions:
 *   get:
 *     summary: Get all available reactions
 *     tags:
 *       - Reactions
 *     responses:
 *       200:
 *         description: List of all reactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       service:
 *                         type: string
 *                       configSchema:
 *                         type: object
 *                       outputSchema:
 *                         type: object
 *                       metadata:
 *                         type: object
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const reactions = reactionService.getAllReactions();

    const enrichedReactions = reactions.map(reaction => {
      const serviceId = reaction.id.split('.')[0];
      if (!serviceId) {
        throw new Error(`Invalid reaction ID format: ${reaction.id}`);
      }
      const service = serviceRegistry.getService(serviceId);

      return {
        id: reaction.id,
        name: reaction.name,
        description: reaction.description,
        service: service?.name || serviceId,
        serviceId: serviceId,
        configSchema: reaction.configSchema,
        outputSchema: reaction.outputSchema,
        metadata: reaction.metadata,
      };
    });

    return res.status(200).json({
      reactions: enrichedReactions,
      count: enrichedReactions.length,
    });
  } catch (err) {
    console.error('Error fetching reactions:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/reactions/service/{serviceId}:
 *   get:
 *     summary: Get reactions for a specific service
 *     tags:
 *       - Reactions
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     responses:
 *       200:
 *         description: List of reactions for the specified service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                 reactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       configSchema:
 *                         type: object
 *                       outputSchema:
 *                         type: object
 *                       metadata:
 *                         type: object
 *       404:
 *         description: Service not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/service/:serviceId',
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { serviceId } = req.params;

      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const reactions = reactionService.getReactionsByService(serviceId);

      return res.status(200).json({
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
        },
        reactions: reactions.map(reaction => ({
          id: reaction.id,
          name: reaction.name,
          description: reaction.description,
          configSchema: reaction.configSchema,
          outputSchema: reaction.outputSchema,
          metadata: reaction.metadata,
        })),
        count: reactions.length,
      });
    } catch (err) {
      console.error('Error fetching reactions for service:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/reactions/grouped:
 *   get:
 *     summary: Get all reactions grouped by service
 *     tags:
 *       - Reactions
 *     responses:
 *       200:
 *         description: Reactions grouped by service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       service:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       reactions:
 *                         type: array
 *                         items:
 *                           type: object
 *       500:
 *         description: Internal server error
 */
router.get(
  '/grouped',
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const groupedReactions = reactionService.getReactionsGroupedByService();
      const services: Record<string, any> = {};

      Object.entries(groupedReactions).forEach(([serviceId, reactions]) => {
        const service = serviceRegistry.getService(serviceId);
        services[serviceId] = {
          service: {
            id: serviceId,
            name: service?.name || serviceId,
            description: service?.description || '',
            version: service?.version || '1.0.0',
          },
          reactions: reactions.map(reaction => ({
            id: reaction.id,
            name: reaction.name,
            description: reaction.description,
            configSchema: reaction.configSchema,
            outputSchema: reaction.outputSchema,
            metadata: reaction.metadata,
          })),
          count: reactions.length,
        };
      });

      return res.status(200).json({
        services,
        totalServices: Object.keys(services).length,
        totalReactions: Object.values(groupedReactions).reduce(
          (sum, reactions) => sum + reactions.length,
          0
        ),
      });
    } catch (err) {
      console.error('Error fetching grouped reactions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/reactions/{reactionType}:
 *   get:
 *     summary: Get a specific reaction by type
 *     tags:
 *       - Reactions
 *     parameters:
 *       - in: path
 *         name: reactionType
 *         required: true
 *         schema:
 *           type: string
 *         description: The reaction type (e.g., github.create_issue)
 *     responses:
 *       200:
 *         description: Reaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reaction:
 *                   type: object
 *       404:
 *         description: Reaction not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:reactionType',
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { reactionType } = req.params;

      if (!reactionType) {
        return res.status(400).json({ error: 'Reaction type is required' });
      }

      const reaction = reactionService.getReactionByType(reactionType);
      if (!reaction) {
        return res.status(404).json({ error: 'Reaction not found' });
      }

      const serviceId = reactionType.split('.')[0];
      if (!serviceId) {
        return res.status(400).json({ error: 'Invalid reaction type format' });
      }
      const service = serviceRegistry.getService(serviceId);

      return res.status(200).json({
        reaction: {
          id: reaction.id,
          name: reaction.name,
          description: reaction.description,
          service: service?.name || serviceId,
          serviceId: serviceId,
          configSchema: reaction.configSchema,
          outputSchema: reaction.outputSchema,
          metadata: reaction.metadata,
        },
      });
    } catch (err) {
      console.error('Error fetching reaction:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
