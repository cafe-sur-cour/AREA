import express, { Request, Response } from 'express';
import token from '../../middleware/token';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { extractPayloadFields } from '../../utils/payloadFields';
import { serviceSubscriptionManager } from '../../services/ServiceSubscriptionManager';
import subscriptionRoutes from './subscription';
import { createLog } from '../logs/logs.service';
import { translateService } from '../../utils/translation';
import i18next from 'i18next';

function generateServiceEndpoints(serviceId: string): {
  auth?: string;
  status: string;
  loginStatus?: string;
  subscribe: string;
  unsubscribe: string;
} {
  const service = serviceRegistry.getService(serviceId);
  const supportsLogin = service?.oauth?.supportsLogin ?? false;
  const hasOAuth = service?.oauth?.enabled ?? false;

  return {
    ...(supportsLogin && { auth: `/auth/${serviceId}/login` }),
    status: `/auth/${serviceId}/subscribe/status`,
    ...(hasOAuth && { loginStatus: `/auth/${serviceId}/login/status` }),
    subscribe: `/auth/${serviceId}/subscribe`,
    unsubscribe: `/auth/${serviceId}/unsubscribe`,
  };
}

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

      const allServices = serviceRegistry
        .getAllServices()
        .filter(service => !service.authOnly);

      const servicesWithSubscriptionStatus = await Promise.all(
        allServices.map(async service => {
          const isSubscribed =
            await serviceSubscriptionManager.isUserSubscribed(
              userId,
              service.id
            );

          const endpoints = generateServiceEndpoints(service.id);

          const translatedService = translateService(service, i18next.t);

          return {
            id: service.id,
            name: translatedService.name,
            description: translatedService.description,
            version: service.version,
            icon: service.icon || '',
            isSubscribed,
            endpoints,
          };
        })
      );

      await createLog(200, 'service', `User ID: ${userId} fetch all services`);
      return res.status(200).json({
        services: servicesWithSubscriptionStatus,
      });
    } catch (err) {
      console.error('Error fetching all services:', err);
      await createLog(500, 'service', `Failed to fetch all services`);
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
          const translatedService = service
            ? translateService(service, i18next.t)
            : null;
          return {
            id: subscription.service,
            name: translatedService
              ? translatedService.name
              : subscription.service.charAt(0).toUpperCase() +
                subscription.service.slice(1),
            description: translatedService ? translatedService.description : '',
          };
        });

      await createLog(
        200,
        'service',
        `User ID: ${userId} fetch subscribed services`
      );
      return res.status(200).json({
        services: subscribedServices,
      });
    } catch (err) {
      console.error('Error fetching subscribed services:', err);
      await createLog(500, 'service', `Failed to fetch subscribed services`);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get subscribed services' });
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
 *                             payloadFields:
 *                               type: array
 *                               description: List of available payload fields that can be used from this action
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   path:
 *                                     type: string
 *                                     description: The path to access this field in the payload
 *                                     example: "user.email"
 *                                   type:
 *                                     type: string
 *                                     description: The data type of this field
 *                                     example: "string"
 *                                   description:
 *                                     type: string
 *                                     description: Description of what this field contains
 *                                   example:
 *                                     type: string
 *                                     description: Example value for this field
 *       500:
 *         description: Internal server error
 */
router.get(
  '/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const allServices = serviceRegistry
        .getAllServices()
        .filter(service => !service.authOnly);
      const servicesWithActions = allServices.filter(
        service => service.actions && service.actions.length > 0
      );

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch all services actions`
      );
      return res.status(200).json({
        services: servicesWithActions.map(service => {
          const translatedService = translateService(service, i18next.t);
          return {
            id: service.id,
            name: translatedService.name,
            description: translatedService.description,
            version: service.version,
            actions: translatedService.actions.map(action => ({
              ...action,
              payloadFields: extractPayloadFields(action),
            })),
          };
        }),
      });
    } catch (err) {
      console.error('Error fetching services with actions:', err);
      await createLog(500, 'service', `Failed to fetch services actions`);
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
      const allServices = serviceRegistry
        .getAllServices()
        .filter(service => !service.authOnly);
      const servicesWithReactions = allServices.filter(
        service => service.reactions && service.reactions.length > 0
      );

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch all services reactions`
      );
      return res.status(200).json({
        services: servicesWithReactions.map(service => {
          const translatedService = translateService(service, i18next.t);
          return {
            id: service.id,
            name: translatedService.name,
            description: translatedService.description,
            version: service.version,
            reactions: translatedService.reactions,
          };
        }),
      });
    } catch (err) {
      console.error('Error fetching services with reactions:', err);
      await createLog(500, 'service', `Failed to fetch services reactions`);
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get services reactions' });
    }
  }
);

/**
 * @swagger
 * /api/services/subscribed/actions:
 *   get:
 *     summary: Get all services with actions that the user is subscribed to
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscribed services with actions
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
 *                             inputSchema:
 *                               type: object
 *                               description: Schema defining the input data structure for action execution
 *                             metadata:
 *                               type: object
 *                               description: Additional metadata for the action
 *                             payloadFields:
 *                               type: array
 *                               description: List of available payload fields that can be used from this action
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   path:
 *                                     type: string
 *                                     description: The path to access this field in the payload
 *                                     example: "user.email"
 *                                   type:
 *                                     type: string
 *                                     description: The data type of this field
 *                                     example: "string"
 *                                   description:
 *                                     type: string
 *                                     description: Description of what this field contains
 *                                   example:
 *                                     type: string
 *                                     description: Example value for this field
 *       500:
 *         description: Internal server error
 */
router.get(
  '/subscribed/actions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const auth = req.auth as { id: number; email: string };
      const userId = auth.id;

      const userSubscriptions =
        await serviceSubscriptionManager.getUserSubscriptions(userId);
      const subscribedServiceIds = userSubscriptions
        .filter(subscription => subscription.subscribed)
        .map(subscription => subscription.service);

      const alwaysSubscribedServiceIds = serviceRegistry
        .getAllServices()
        .filter(service => service.alwaysSubscribed)
        .map(service => service.id);

      const allSubscribedServiceIds = [
        ...new Set([...subscribedServiceIds, ...alwaysSubscribedServiceIds]),
      ];

      const allServices = serviceRegistry
        .getAllServices()
        .filter(
          service =>
            !service.authOnly && allSubscribedServiceIds.includes(service.id)
        );
      const servicesWithActions = allServices.filter(
        service => service.actions && service.actions.length > 0
      );

      await createLog(
        200,
        'service',
        `User ID: ${userId} fetch subscribed services actions`
      );
      return res.status(200).json({
        services: servicesWithActions.map(service => {
          const translatedService = translateService(service, i18next.t);
          return {
            id: service.id,
            name: translatedService.name,
            description: translatedService.description,
            version: service.version,
            actions: translatedService.actions.map(action => ({
              ...action,
              payloadFields: extractPayloadFields(action),
            })),
          };
        }),
      });
    } catch (err) {
      await createLog(
        500,
        'service',
        `Failed to fetch subscribed services actions`
      );
      console.error('Error fetching subscribed services with actions:', err);
      return res.status(500).json({
        error: 'Internal Server Error in get subscribed services actions',
      });
    }
  }
);

/**
 * @swagger
 * /api/services/subscribed/reactions:
 *   get:
 *     summary: Get all services with reactions that the user is subscribed to
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscribed services with reactions
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
 *                             outputSchema:
 *                               type: object
 *                               description: Schema defining the output data structure for reaction execution
 *                             metadata:
 *                               type: object
 *                               description: Additional metadata for the reaction
 *       500:
 *         description: Internal server error
 */
router.get(
  '/subscribed/reactions',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const auth = req.auth as { id: number; email: string };
      const userId = auth.id;

      const userSubscriptions =
        await serviceSubscriptionManager.getUserSubscriptions(userId);
      const subscribedServiceIds = userSubscriptions
        .filter(subscription => subscription.subscribed)
        .map(subscription => subscription.service);

      const alwaysSubscribedServiceIds = serviceRegistry
        .getAllServices()
        .filter(service => service.alwaysSubscribed)
        .map(service => service.id);

      const allSubscribedServiceIds = [
        ...new Set([...subscribedServiceIds, ...alwaysSubscribedServiceIds]),
      ];

      const allServices = serviceRegistry
        .getAllServices()
        .filter(
          service =>
            !service.authOnly && allSubscribedServiceIds.includes(service.id)
        );
      const servicesWithReactions = allServices.filter(
        service => service.reactions && service.reactions.length > 0
      );

      await createLog(
        200,
        'service',
        `User ID: ${userId} fetch subscribed services reactions`
      );
      return res.status(200).json({
        services: servicesWithReactions.map(service => {
          const translatedService = translateService(service, i18next.t);
          return {
            id: service.id,
            name: translatedService.name,
            description: translatedService.description,
            version: service.version,
            reactions: translatedService.reactions,
          };
        }),
      });
    } catch (err) {
      console.error('Error fetching subscribed services with reactions:', err);
      await createLog(
        500,
        'service',
        `Failed to fetch subscribed services reactions`
      );
      return res.status(500).json({
        error: 'Internal Server Error in get subscribed services reactions',
      });
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
 *                       payloadFields:
 *                         type: array
 *                         description: List of available payload fields that can be used from this action
 *                         items:
 *                           type: object
 *                           properties:
 *                             path:
 *                               type: string
 *                               description: The path to access this field in the payload
 *                               example: "user.email"
 *                             type:
 *                               type: string
 *                               description: The data type of this field
 *                               example: "string"
 *                             description:
 *                               type: string
 *                               description: Description of what this field contains
 *                             example:
 *                               type: string
 *                               description: Example value for this field
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
        await createLog(
          400,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch actions without ID`
        );
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        await createLog(
          404,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch actions for non-existing service`
        );
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      const translatedService = translateService(service, i18next.t);

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch actions for service ID: ${id}`
      );
      return res.status(200).json({
        service_id: service.id,
        service_name: translatedService.name,
        actions: translatedService.actions.map(action => ({
          ...action,
          payloadFields: extractPayloadFields(action),
        })),
      });
    } catch (err) {
      console.error('Error fetching service actions:', err);
      await createLog(
        500,
        'service',
        `Failed to fetch service actions for service ID: ${req.params.id}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get id actions' });
    }
  }
);

/**
 * @swagger
 * /api/services/{serivce}/actions/{id}:
 *   get:
 *     summary: Get a specific actions of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: Service name
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Action id
 *     responses:
 *       200:
 *         description: Action for the service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 action:
 *                   type: object
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
 *                       payloadFields:
 *                         type: array
 *                         description: List of available payload fields that can be used from this action
 *                         items:
 *                           type: object
 *                           properties:
 *                             path:
 *                               type: string
 *                               description: The path to access this field in the payload
 *                               example: "user.email"
 *                             type:
 *                               type: string
 *                               description: The data type of this field
 *                               example: "string"
 *                             description:
 *                               type: string
 *                               description: Description of what this field contains
 *                             example:
 *                               type: string
 *                               description: Example value for this field
 *       400:
 *         description: Bad request - missing service ID or action id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service ID and action id is required"
 *       404:
 *         description: Action or service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Action or service not found"
 *                 service_id:
 *                   type: string
 *                   description: The requested Action or service ID
 *       500:
 *         description: Internal server error
 */

router.get(
  '/:serviceName/actions/:id',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { serviceName, id } = req.params;

      if (!serviceName || !id) {
        await createLog(
          400,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch actions without ID`
        );
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(serviceName);

      if (!service || !service.actions.find(element => element.id === id)) {
        await createLog(
          404,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch non-existing action ${id} for service ${serviceName}`
        );
        return res.status(404).json({
          error: 'Service name or id not found',
          service_id: serviceName,
          id: id,
        });
      }

      const action = service.actions.find(element => element.id === id);
      const translatedService = translateService(service, i18next.t);
      const translatedAction = translatedService.actions.find(
        element => element.id === id
      );

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch action ${id} for service ${serviceName}`
      );
      return res.status(200).json({
        serviceId: service.id,
        ...translatedAction,
        payloadFields: extractPayloadFields(action!),
      });
    } catch (err) {
      console.error('Error fetching service actions:', err);
      await createLog(
        500,
        'service',
        `Failed to fetch service actions for service ID: ${req.params.serviceName} and action ID: ${req.params.id}`
      );
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
        await createLog(
          400,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch reactions without ID`
        );
        return res.status(400).json({ error: 'Service ID is required' });
      }

      const service = serviceRegistry.getService(id);

      if (!service) {
        await createLog(
          404,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch reactions for non-existing service`
        );
        return res.status(404).json({
          error: 'Service not found',
          service_id: id,
        });
      }

      const translatedService = translateService(service, i18next.t);

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch reactions for service ID: ${id}`
      );
      return res.status(200).json({
        service_id: service.id,
        service_name: translatedService.name,
        reactions: translatedService.reactions,
      });
    } catch (err) {
      console.error('Error fetching service reactions:', err);
      await createLog(
        500,
        'service',
        `Failed to fetch service reactions for service ID: ${req.params.id}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get id reactions' });
    }
  }
);

/**
 * @swagger
 * /api/services/{serviceName}/reactions/{id}:
 *   get:
 *     summary: Get specific reaction of a specific service
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceName
 *         required: true
 *         schema:
 *           type: string
 *         description: Service name
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reaction ID
 *     responses:
 *       200:
 *         description: Reactions for the service
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
 *                 reaction:
 *                   type: object
 *                   description: Reactions provided by this service
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
 *         description: Bad request - missing service name or Reaction ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service name and Reaction ID is required"
 *       404:
 *         description: Service or reaction not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Service or reaction not found"
 *                 service_id:
 *                   type: string
 *                   description: The requested service name
 *       500:
 *         description: Internal server error
 */

router.get(
  '/:serviceName/reactions/:id',
  token,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { serviceName, id } = req.params;

      if (!id || !serviceName) {
        await createLog(
          400,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch reactions without ID`
        );
        return res
          .status(400)
          .json({ error: 'Service ID and Reaction ID is required' });
      }

      const service = serviceRegistry.getService(serviceName);

      if (!service || !service.reactions.find(element => element.id === id)) {
        await createLog(
          404,
          'service',
          `User ID: ${(req.auth as { id: number }).id} fetch non-existing reaction ${id} for service ${serviceName}`
        );
        return res.status(404).json({
          error: 'Service or reaction not found',
          service_id: serviceName,
          reaction_id: id,
        });
      }

      const translatedService = translateService(service, i18next.t);
      const translatedReaction = translatedService.reactions.find(
        element => element.id === id
      );

      await createLog(
        200,
        'service',
        `User ID: ${(req.auth as { id: number }).id} fetch reaction ${id} for service ${serviceName}`
      );
      return res.status(200).json({
        serviceId: service.id,
        ...translatedReaction,
      });
    } catch (err) {
      console.error('Error fetching service reactions:', err);
      await createLog(
        500,
        'service',
        `Failed to fetch service reactions for service ID: ${req.params.serviceName} and reaction ID: ${req.params.id}`
      );
      return res
        .status(500)
        .json({ error: 'Internal Server Error in get id reactions' });
    }
  }
);

export default router;
