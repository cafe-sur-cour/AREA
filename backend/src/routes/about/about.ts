import express, { Request, Response } from 'express';
import { serviceRegistry } from '../../services/ServiceRegistry';

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

    const services = serviceRegistry.getAllServices().map(service => ({
      name: service.name,
      actions: service.actions.map(action => ({
        name: action.name,
        description: action.description,
      })),
      reactions: service.reactions.map(reaction => ({
        name: reaction.name,
        description: reaction.description,
      })),
    }));

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
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
