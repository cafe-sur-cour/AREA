import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';
import subscriptionRoutes from './subscription';

const serviceEndpoints: Record<
  string,
  {
    auth: string;
    status: string;
    loginStatus: string;
    subscribe: string;
    unsubscribe: string;
  }
> = {
  github: {
    auth: '/auth/github/login',
    status: '/github/subscribe/status',
    loginStatus: '/github/login/status',
    subscribe: '/auth/github/subscribe',
    unsubscribe: '/github/unsubscribe',
  },
  google: {
    auth: '/auth/google/login',
    status: '/google/subscribe/status',
    loginStatus: '/google/login/status',
    subscribe: '/auth/google/subscribe',
    unsubscribe: '/google/unsubscribe',
  },
  spotify: {
    auth: '/auth/spotify/subscribe',
    status: '/spotify/subscribe/status',
    loginStatus: '/spotify/login/status',
    subscribe: '/auth/spotify/subscribe',
    unsubscribe: '/spotify/unsubscribe',
  },
  timer: {
    auth: '',
    status: '/services/timer/subscribe/status',
    loginStatus: '',
    subscribe: '/auth/timer/subscribe',
    unsubscribe: '',
  },
};

const router = express.Router();
router.use('/auth', subscriptionRoutes);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all available services with subscription status
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all services with subscription information
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
 *                       icon:
 *                         type: string
 *                         description: SVG icon for the service
 *                       isSubscribed:
 *                         type: boolean
 *                         description: Whether the user is subscribed to this service
 *                       endpoints:
 *                         type: object
 *                         properties:
 *                           auth:
 *                             type: string
 *                             description: Authentication endpoint URL
 *                           status:
 *                             type: string
 *                             description: Subscription status endpoint URL
 *                           loginStatus:
 *                             type: string
 *                             description: Login status endpoint URL
 *                           subscribe:
 *                             type: string
 *                             description: Subscribe endpoint URL
 *                           unsubscribe:
 *                             type: string
 *                             description: Unsubscribe endpoint URL
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const auth = req.auth as { id: number; email: string };
      const userId = auth.id;

      const allServices = serviceRegistry.getAllServices();

      const servicesWithSubscriptionStatus = await Promise.all(
        allServices.map(async service => {
          const isSubscribed =
            await serviceSubscriptionManager.isUserSubscribed(
              userId,
              service.id
            );

          const endpoints = serviceEndpoints[service.id] || {
            auth: '',
            status: '',
            loginStatus: '',
            subscribe: '',
            unsubscribe: '',
          };

          return {
            id: service.id,
            name: service.name,
            description: service.description,
            version: service.version,
            icon: service.icon || '',
            isSubscribed,
            endpoints,
          };
        })
      );

      return res.status(200).json({
        services: servicesWithSubscriptionStatus,
      });
    } catch (err) {
      console.error('Error fetching all services:', err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get all services' });
    }
  }
);

/**
 * @swagger
 * /api/services/subscribed:
 *   get:
 *     summary: Get all services the user is subscribed to
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscribed services
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
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/subscribed',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const basicUserInfo = req.auth as { id: number; email: string };
      const userId = basicUserInfo.id;

      const userSubscriptions =
        await serviceSubscriptionManager.getUserSubscriptions(userId);

      const subscribedServices = userSubscriptions
        .filter(subscription => subscription.subscribed)
        .map(subscription => {
          const service = serviceRegistry.getService(subscription.service);
          return {
            id: subscription.service,
            name: service
              ? service.name
              : subscription.service.charAt(0).toUpperCase() +
                subscription.service.slice(1),
            description: service ? service.description : '',
          };
        });

      return res.status(200).json({
        services: subscribedServices,
      });
    } catch (err) {
      console.error('Error fetching subscribed services:', err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get subscribed services' });
    }
  }
);

/**
 * @swagger
 * /api/services/timer/subscribe/status:
 *   get:
 *     summary: Get timer subscription status
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timer subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *                   description: Whether the user is subscribed to timer
 *                 oauth_connected:
 *                   type: boolean
 *                   description: Always true for timer (no OAuth required)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/timer/subscribe/status',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = (req.auth as { id: number }).id;

      console.log(`🔄 [STATUS] Checking timer subscription status for user ${userId}`);
      const subscription = await serviceSubscriptionManager.getUserSubscription(
        userId,
        'timer'
      );

      const isSubscribed = subscription?.subscribed || false;
      console.log(`✅ [STATUS] Timer subscription status for user ${userId}: subscribed=${isSubscribed}`);

      if (!isSubscribed) {
        return res.status(404).json({
          subscribed: false,
          oauth_connected: true,
          can_create_webhooks: false,
          message: 'Not subscribed to Timer events',
        });
      }

      return res.status(200).json({
        subscribed: true,
        oauth_connected: true,
        can_create_webhooks: true,
        subscribed_at: subscription?.subscribed_at || null,
        unsubscribed_at: subscription?.unsubscribed_at || null,
      });
    } catch (err) {
      console.error(`❌ [STATUS] Error fetching timer subscription status for user ${(req.auth as { id: number }).id}:`, err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in timer subscribe status' });
    }
  }
);

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
 *                               description: "Unique identifier for the action (format: service.action)"
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
 *                                         description: Type of the field
 *                                         enum:
 *                                           - text
 *                                           - email
 *                                           - textarea
 *                                           - select
 *                                           - checkbox
 *                                           - number
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
 *                                   enum:
 *                                     - object
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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get services actions' });
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
 *                               description: "Unique identifier for the reaction (format: service.reaction)"
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
 *                                         description: Type of the field
 *                                         enum:
 *                                           - text
 *                                           - email
 *                                           - textarea
 *                                           - select
 *                                           - checkbox
 *                                           - number
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
 *                                   enum:
 *                                     - object
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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get services reactions' });
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
 *                         description: "Unique identifier for the action (format: service.action)"
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
 *                                   description: Type of the field
 *                                   enum:
 *                                     - text
 *                                     - email
 *                                     - textarea
 *                                     - select
 *                                     - checkbox
 *                                     - number
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
 *                             enum:
 *                               - object
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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get id actions' });
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
 *                         description: "Unique identifier for the reaction (format: service.reaction)"
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
 *                                   description: Type of the field
 *                                   enum:
 *                                     - text
 *                                     - email
 *                                     - textarea
 *                                     - select
 *                                     - checkbox
 *                                     - number
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
 *                             enum:
 *                               - object
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
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get id reactions' });
    }
  }
);

export default router;
