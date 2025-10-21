import express, { Request, Response } from 'express';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { translateService } from '../../utils/translation';
import { createLog } from '../logs/logs.service';
import i18next from 'i18next';

const router = express.Router();

/**
 * @swagger
 * /about.json:
 *   get:
 *     summary: Get information about the server and its services
 *     description: Returns server information including current time, client host, and detailed information about all available services with their actions and reactions. Supports internationalization through the lang query parameter.
 *     tags:
 *       - Info
 *     parameters:
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, fr]
 *           default: en
 *         description: Language for service names and descriptions (en = English, fr = French)
 *         example: en
 *     responses:
 *       200:
 *         description: Server information with services details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   type: object
 *                   properties:
 *                     host:
 *                       type: string
 *                       description: Client IP address
 *                       example: "192.168.1.1"
 *                 server:
 *                   type: object
 *                   properties:
 *                     current_time:
 *                       type: integer
 *                       description: Current server time as Unix timestamp
 *                       example: 1697123456
 *                     services:
 *                       type: array
 *                       description: List of all available services
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Unique identifier of the service
 *                             example: "github"
 *                           name:
 *                             type: string
 *                             description: Human-readable name of the service
 *                             example: "GitHub"
 *                           icon:
 *                             type: string
 *                             description: SVG icon representation of the service
 *                             example: "<svg>...</svg>"
 *                           actions:
 *                             type: array
 *                             description: List of actions provided by this service
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   description: Unique identifier for the action
 *                                   example: "github.push"
 *                                 name:
 *                                   type: string
 *                                   description: Human-readable name of the action
 *                                   example: "GitHub Push"
 *                                 description:
 *                                   type: string
 *                                   description: Description of what the action does
 *                                   example: "Triggers when a push event occurs on a selected repository"
 *                           reactions:
 *                             type: array
 *                             description: List of reactions provided by this service
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   description: Unique identifier for the reaction
 *                                   example: "github.create_issue"
 *                                 name:
 *                                   type: string
 *                                   description: Human-readable name of the reaction
 *                                   example: "Create GitHub Issue"
 *                                 description:
 *                                   type: string
 *                                   description: Description of what the reaction does
 *                                   example: "Creates a new issue in the specified repository"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error in about route"
 */
const getClientIP = (req: Request): string => {
  const ip =
    req.ip || (req.socket ? req.socket.remoteAddress : undefined) || 'unknown';
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

const getParisTimestamp = (): number => {
  const now = new Date();
  const parisFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parisParts = parisFormatter.formatToParts(now);
  const year = parseInt(parisParts.find(p => p.type === 'year')!.value);
  const month = parseInt(parisParts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parisParts.find(p => p.type === 'day')!.value);
  const hour = parseInt(parisParts.find(p => p.type === 'hour')!.value);
  const minute = parseInt(parisParts.find(p => p.type === 'minute')!.value);
  const second = parseInt(parisParts.find(p => p.type === 'second')!.value);

  const parisDate = new Date(year, month, day, hour, minute, second);
  return Math.floor(parisDate.getTime() / 1000);
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientHost = getClientIP(req);

    const currentTime = getParisTimestamp();

    const lang = (req.query.lang as string) || 'en';
    await i18next.changeLanguage(lang);

    const services = serviceRegistry
      .getAllServices()
      .filter(service => !service.authOnly)
      .map(service => {
        const translatedService = translateService(service, i18next.t);
        return {
          name: translatedService.name,
          icon: translatedService.icon,
          id: translatedService.id,
          actions: (translatedService.actions as unknown[]).map(
            (action: unknown) => ({
              id: (action as Record<string, unknown>).id as number,
              name: (action as Record<string, unknown>).name as string,
              description: (action as Record<string, unknown>)
                .description as string,
            })
          ),
          reactions: (translatedService.reactions as unknown[]).map(
            (reaction: unknown) => ({
              id: (reaction as Record<string, unknown>).id as number,
              name: (reaction as Record<string, unknown>).name as string,
              description: (reaction as Record<string, unknown>)
                .description as string,
            })
          ),
        };
      });

    const response = {
      client: {
        host: clientHost,
      },
      server: {
        current_time: currentTime,
        services,
      },
    };

    await createLog(200, 'about', response.client.host);
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    await createLog(
      500,
      'about',
      err instanceof Error ? err.message : 'Unknown error'
    );
    res.status(500).json({ error: 'Internal Server Error in about route' });
  }
});

export default router;
