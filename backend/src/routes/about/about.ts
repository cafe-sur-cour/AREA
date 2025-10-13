import express, { Request, Response } from 'express';
import { serviceRegistry } from '../../services/ServiceRegistry';
import { translateService } from '../../utils/translation';
import i18next from 'i18next';

const router = express.Router();

/**
 * @swagger
 * /about.json:
 *   get:
 *     summary: Get information about the server and its services
 *     tags:
 *       - Info
 *     responses:
 *       200:
 *         description: Server information
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
 *                 server:
 *                   type: object
 *                   properties:
 *                     current_time:
 *                       type: number
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           icon:
 *                             type: string
 *                             description: SVG icon representation of the service
 *                           actions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                           reactions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 description:
 *                                   type: string
 */
const getClientIP = (req: Request): string => {
  const ip =
    req.ip || (req.socket ? req.socket.remoteAddress : undefined) || 'unknown';
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientHost = getClientIP(req);

    const currentTime = Math.floor(Date.now() / 1000);

    const lang = (req.query.lang as string) || 'en';
    await i18next.changeLanguage(lang);

    const services = serviceRegistry.getAllServices().map(service => {
      const translatedService = translateService(service, i18next.t);
      return {
        name: translatedService.name,
        icon: translatedService.icon,
        actions: (translatedService.actions as unknown[]).map(
          (action: unknown) => ({
            name: (action as Record<string, unknown>).name as string,
            description: (action as Record<string, unknown>)
              .description as string,
          })
        ),
        reactions: (translatedService.reactions as unknown[]).map(
          (reaction: unknown) => ({
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

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error in about route' });
  }
});

export default router;
