import express, { Request, Response } from 'express';
import { ActionService } from './action.service';
import { serviceRegistry } from '../../services/ServiceRegistry';

const router = express.Router();
const actionService = new ActionService();

/**
 * @swagger
 * /api/actions:
 *   get:
 *     summary: Get all available actions
 *     tags:
 *       - Actions
 *     responses:
 *       200:
 *         description: List of all actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 actions:
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
 *                       inputSchema:
 *                         type: object
 *                       metadata:
 *                         type: object
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const actions = actionService.getAllActions();

    const enrichedActions = actions.map(action => {
      const serviceId = action.id.split('.')[0];
      if (!serviceId) {
        throw new Error(`Invalid action ID format: ${action.id}`);
      }
      const service = serviceRegistry.getService(serviceId);

      return {
        id: action.id,
        name: action.name,
        description: action.description,
        service: service?.name || serviceId,
        serviceId: serviceId,
        configSchema: action.configSchema,
        inputSchema: action.inputSchema,
        metadata: action.metadata,
      };
    });

    return res.status(200).json({
      actions: enrichedActions,
      count: enrichedActions.length,
    });
  } catch (err) {
    console.error('Error fetching actions:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/actions/service/{serviceId}:
 *   get:
 *     summary: Get actions for a specific service
 *     tags:
 *       - Actions
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The service ID
 *     responses:
 *       200:
 *         description: List of actions for the specified service
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
 *                 actions:
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
 *                       inputSchema:
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

      const actions = actionService.getActionsByService(serviceId);

      return res.status(200).json({
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
        },
        actions: actions.map(action => ({
          id: action.id,
          name: action.name,
          description: action.description,
          configSchema: action.configSchema,
          inputSchema: action.inputSchema,
          metadata: action.metadata,
        })),
        count: actions.length,
      });
    } catch (err) {
      console.error('Error fetching actions for service:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/actions/grouped:
 *   get:
 *     summary: Get all actions grouped by service
 *     tags:
 *       - Actions
 *     responses:
 *       200:
 *         description: Actions grouped by service
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
 *                       actions:
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
      const groupedActions = actionService.getActionsGroupedByService();
      const services: Record<string, unknown> = {};

      Object.entries(groupedActions).forEach(([serviceId, actions]) => {
        const service = serviceRegistry.getService(serviceId);
        services[serviceId] = {
          service: {
            id: serviceId,
            name: service?.name || serviceId,
            description: service?.description || '',
            version: service?.version || '1.0.0',
          },
          actions: actions.map(action => ({
            id: action.id,
            name: action.name,
            description: action.description,
            configSchema: action.configSchema,
            inputSchema: action.inputSchema,
            metadata: action.metadata,
          })),
          count: actions.length,
        };
      });

      return res.status(200).json({
        services,
        totalServices: Object.keys(services).length,
        totalActions: Object.values(groupedActions).reduce(
          (sum, actions) => sum + actions.length,
          0
        ),
      });
    } catch (err) {
      console.error('Error fetching grouped actions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/actions/{actionType}:
 *   get:
 *     summary: Get a specific action by type
 *     tags:
 *       - Actions
 *     parameters:
 *       - in: path
 *         name: actionType
 *         required: true
 *         schema:
 *           type: string
 *         description: The action type (e.g., github.push)
 *     responses:
 *       200:
 *         description: Action details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 action:
 *                   type: object
 *       404:
 *         description: Action not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:actionType',
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { actionType } = req.params;

      if (!actionType) {
        return res.status(400).json({ error: 'Action type is required' });
      }

      const action = actionService.getActionByType(actionType);
      if (!action) {
        return res.status(404).json({ error: 'Action not found' });
      }

      const serviceId = actionType.split('.')[0];
      if (!serviceId) {
        return res.status(400).json({ error: 'Invalid action type format' });
      }
      const service = serviceRegistry.getService(serviceId);

      return res.status(200).json({
        action: {
          id: action.id,
          name: action.name,
          description: action.description,
          service: service?.name || serviceId,
          serviceId: serviceId,
          configSchema: action.configSchema,
          inputSchema: action.inputSchema,
          metadata: action.metadata,
        },
      });
    } catch (err) {
      console.error('Error fetching action:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
