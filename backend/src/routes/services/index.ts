import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { serviceRegistry } from '../../services/ServiceRegistry';

const router = express.Router();

/**
 * @swagger
 * /api/services/actions:
 *   get:
 *     summary: Get all services that expose actions
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services with actions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the service
 *                       name:
 *                         type: string
 *                         description: Human-readable name of the service
 *                       description:
 *                         type: string
 *                         description: Description of the service
 *                       version:
 *                         type: string
 *                         description: Version of the service
 *                       actions:
 *                         type: array
 *                         description: List of actions provided by this service
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               description: Unique identifier for the action (format: service.action)
 *                             name:
 *                               type: string
 *                               description: Human-readable name of the action
 *                             description:
 *                               type: string
 *                               description: Description of what the action does
 *                             configSchema:
 *                               type: object
 *                               description: Schema defining the configuration fields required for this action
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   description: Name of the configuration schema
 *                                 description:
 *                                   type: string
 *                                   description: Description of the configuration schema
 *                                 fields:
 *                                   type: array
 *                                   description: List of configuration fields
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       name:
 *                                         type: string
 *                                         description: Field name
 *                                       type:
 *                                         type: string
 *                                         enum: [text, email, textarea, select, checkbox, number]
 *                                         description: Type of the field
 *                                       label:
 *                                         type: string
 *                                         description: Human-readable label for the field
 *                                       required:
 *                                         type: boolean
 *                                         description: Whether this field is required
 *                                       placeholder:
 *                                         type: string
 *                                         description: Placeholder text for the field
 *                                       options:
 *                                         type: array
 *                                         description: Available options for select fields
 *                                         items:
 *                                           type: object
 *                                           properties:
 *                                             value:
 *                                               type: string
 *                                               description: Option value
 *                                             label:
 *                                               type: string
 *                                               description: Option label
 *                                       default:
 *                                         type: string
 *                                         description: Default value for the field
 *                             inputSchema:
 *                               type: object
 *                               description: Schema defining the input data structure for action execution
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                   enum: [object]
 *                                 properties:
 *                                   type: object
 *                                   description: Input properties schema
 *                                 required:
 *                                   type: array
 *                                   description: List of required input properties
 *                                   items:
 *                                     type: string
 *                             metadata:
 *                               type: object
 *                               description: Additional metadata for the action
 *                               properties:
 *                                 category:
 *                                   type: string
 *                                   description: Category this action belongs to
 *                                 tags:
 *                                   type: array
 *                                   description: Tags associated with this action
 *                                   items:
 *                                     type: string
 *                                 icon:
 *                                   type: string
 *                                   description: Icon identifier for UI display
 *                                 color:
 *                                   type: string
 *                                   description: Color identifier for UI display
 *                                 requiresAuth:
 *                                   type: boolean
 *                                   description: Whether this action requires authentication
 *                                 webhookPattern:
 *                                   type: string
 *                                   description: Webhook pattern for triggering this action
 *       500:
 *         description: Internal server error
 */
router.get(
  '/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const allServices = serviceRegistry.getAllServices();
      const servicesWithActions = allServices.filter(
        service => service.actions && service.actions.length > 0
      );

      return res.status(200).json({
        services: servicesWithActions.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
          actions: service.actions,
        })),
      });
    } catch (err) {
      console.error('Error fetching services with actions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/reactions:
 *   get:
 *     summary: Get all services that expose reactions
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services with reactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the service
 *                       name:
 *                         type: string
 *                         description: Human-readable name of the service
 *                       description:
 *                         type: string
 *                         description: Description of the service
 *                       version:
 *                         type: string
 *                         description: Version of the service
 *                       reactions:
 *                         type: array
 *                         description: List of reactions provided by this service
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               description: Unique identifier for the reaction (format: service.reaction)
 *                             name:
 *                               type: string
 *                               description: Human-readable name of the reaction
 *                             description:
 *                               type: string
 *                               description: Description of what the reaction does
 *                             configSchema:
 *                               type: object
 *                               description: Schema defining the configuration fields required for this reaction
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   description: Name of the configuration schema
 *                                 description:
 *                                   type: string
 *                                   description: Description of the configuration schema
 *                                 fields:
 *                                   type: array
 *                                   description: List of configuration fields
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       name:
 *                                         type: string
 *                                         description: Field name
 *                                       type:
 *                                         type: string
 *                                         enum: [text, email, textarea, select, checkbox, number]
 *                                         description: Type of the field
 *                                       label:
 *                                         type: string
 *                                         description: Human-readable label for the field
 *                                       required:
 *                                         type: boolean
 *                                         description: Whether this field is required
 *                                       placeholder:
 *                                         type: string
 *                                         description: Placeholder text for the field
 *                                       options:
 *                                         type: array
 *                                         description: Available options for select fields
 *                                         items:
 *                                           type: object
 *                                           properties:
 *                                             value:
 *                                               type: string
 *                                               description: Option value
 *                                             label:
 *                                               type: string
 *                                               description: Option label
 *                                       default:
 *                                         type: string
 *                                         description: Default value for the field
 *                             outputSchema:
 *                               type: object
 *                               description: Schema defining the output data structure for reaction execution
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                   enum: [object]
 *                                 properties:
 *                                   type: object
 *                                   description: Output properties schema
 *                                 required:
 *                                   type: array
 *                                   description: List of required output properties
 *                                   items:
 *                                     type: string
 *                             metadata:
 *                               type: object
 *                               description: Additional metadata for the reaction
 *                               properties:
 *                                 category:
 *                                   type: string
 *                                   description: Category this reaction belongs to
 *                                 tags:
 *                                   type: array
 *                                   description: Tags associated with this reaction
 *                                   items:
 *                                     type: string
 *                                 icon:
 *                                   type: string
 *                                   description: Icon identifier for UI display
 *                                 color:
 *                                   type: string
 *                                   description: Color identifier for UI display
 *                                 requiresAuth:
 *                                   type: boolean
 *                                   description: Whether this reaction requires authentication
 *                                 estimatedDuration:
 *                                   type: number
 *                                   description: Estimated execution duration in seconds
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reactions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const allServices = serviceRegistry.getAllServices();
      const servicesWithReactions = allServices.filter(
        service => service.reactions && service.reactions.length > 0
      );

      return res.status(200).json({
        services: servicesWithReactions.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          version: service.version,
          reactions: service.reactions,
        })),
      });
    } catch (err) {
      console.error('Error fetching services with reactions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/{id}/actions:
 *   get:
 *     summary: Get all actions of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: List of actions for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service_id:
 *                   type: string
 *                   description: Unique identifier of the service
 *                 service_name:
 *                   type: string
 *                   description: Human-readable name of the service
 *                 actions:
 *                   type: array
 *                   description: List of actions provided by this service
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the action (format: service.action)
 *                       name:
 *                         type: string
 *                         description: Human-readable name of the action
 *                       description:
 *                         type: string
 *                         description: Description of what the action does
 *                       configSchema:
 *                         type: object
 *                         description: Schema defining the configuration fields required for this action
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Name of the configuration schema
 *                           description:
 *                             type: string
 *                             description: Description of the configuration schema
 *                           fields:
 *                             type: array
 *                             description: List of configuration fields
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   description: Field name
 *                                 type:
 *                                   type: string
 *                                   enum: [text, email, textarea, select, checkbox, number]
 *                                   description: Type of the field
 *                                 label:
 *                                   type: string
 *                                   description: Human-readable label for the field
 *                                 required:
 *                                   type: boolean
 *                                   description: Whether this field is required
 *                                 placeholder:
 *                                   type: string
 *                                   description: Placeholder text for the field
 *                                 options:
 *                                   type: array
 *                                   description: Available options for select fields
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       value:
 *                                         type: string
 *                                         description: Option value
 *                                       label:
 *                                         type: string
 *                                         description: Option label
 *                                 default:
 *                                   type: string
 *                                   description: Default value for the field
 *                       inputSchema:
 *                         type: object
 *                         description: Schema defining the input data structure for action execution
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [object]
 *                           properties:
 *                             type: object
 *                             description: Input properties schema
 *                           required:
 *                             type: array
 *                             description: List of required input properties
 *                             items:
 *                               type: string
 *                       metadata:
 *                         type: object
 *                         description: Additional metadata for the action
 *                         properties:
 *                           category:
 *                             type: string
 *                             description: Category this action belongs to
 *                           tags:
 *                             type: array
 *                             description: Tags associated with this action
 *                             items:
 *                               type: string
 *                           icon:
 *                             type: string
 *                             description: Icon identifier for UI display
 *                           color:
 *                             type: string
 *                             description: Color identifier for UI display
 *                           requiresAuth:
 *                             type: boolean
 *                             description: Whether this action requires authentication
 *                           webhookPattern:
 *                             type: string
 *                             description: Webhook pattern for triggering this action
 *       400:
 *         description: Bad request - missing service ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service ID is required"
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service not found"
 *                 service_id:
 *                   type: string
 *                   description: The requested service ID
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      return res.status(200).json({
        service_id: service.id,
        service_name: service.name,
        actions: service.actions,
      });
    } catch (err) {
      console.error('Error fetching service actions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

/**
 * @swagger
 * /api/services/{id}/reactions:
 *   get:
 *     summary: Get all reactions of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: List of reactions for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 service_id:
 *                   type: string
 *                   description: Unique identifier of the service
 *                 service_name:
 *                   type: string
 *                   description: Human-readable name of the service
 *                 reactions:
 *                   type: array
 *                   description: List of reactions provided by this service
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the reaction (format: service.reaction)
 *                       name:
 *                         type: string
 *                         description: Human-readable name of the reaction
 *                       description:
 *                         type: string
 *                         description: Description of what the reaction does
 *                       configSchema:
 *                         type: object
 *                         description: Schema defining the configuration fields required for this reaction
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Name of the configuration schema
 *                           description:
 *                             type: string
 *                             description: Description of the configuration schema
 *                           fields:
 *                             type: array
 *                             description: List of configuration fields
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   description: Field name
 *                                 type:
 *                                   type: string
 *                                   enum: [text, email, textarea, select, checkbox, number]
 *                                   description: Type of the field
 *                                 label:
 *                                   type: string
 *                                   description: Human-readable label for the field
 *                                 required:
 *                                   type: boolean
 *                                   description: Whether this field is required
 *                                 placeholder:
 *                                   type: string
 *                                   description: Placeholder text for the field
 *                                 options:
 *                                   type: array
 *                                   description: Available options for select fields
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       value:
 *                                         type: string
 *                                         description: Option value
 *                                       label:
 *                                         type: string
 *                                         description: Option label
 *                                 default:
 *                                   type: string
 *                                   description: Default value for the field
 *                       outputSchema:
 *                         type: object
 *                         description: Schema defining the output data structure for reaction execution
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [object]
 *                           properties:
 *                             type: object
 *                             description: Output properties schema
 *                           required:
 *                             type: array
 *                             description: List of required output properties
 *                             items:
 *                               type: string
 *                       metadata:
 *                         type: object
 *                         description: Additional metadata for the reaction
 *                         properties:
 *                           category:
 *                             type: string
 *                             description: Category this reaction belongs to
 *                           tags:
 *                             type: array
 *                             description: Tags associated with this reaction
 *                             items:
 *                               type: string
 *                           icon:
 *                             type: string
 *                             description: Icon identifier for UI display
 *                           color:
 *                             type: string
 *                             description: Color identifier for UI display
 *                           requiresAuth:
 *                             type: boolean
 *                             description: Whether this reaction requires authentication
 *                           estimatedDuration:
 *                             type: number
 *                             description: Estimated execution duration in seconds
 *       400:
 *         description: Bad request - missing service ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service ID is required"
 *       404:
 *         description: Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service not found"
 *                 service_id:
 *                   type: string
 *                   description: The requested service ID
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id/reactions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      return res.status(200).json({
        service_id: service.id,
        service_name: service.name,
        reactions: service.reactions,
      });
    } catch (err) {
      console.error('Error fetching service reactions:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

export default router;
