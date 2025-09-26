import express from 'express';
import { webhookLoader } from './WebhookLoader';

const router = express.Router();

/**
 * @swagger
 * /webhooks/{service}:
 *   post:
 *     summary: Receive webhooks from external services
 *     tags:
 *       - Webhooks
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: The service name (e.g., github, discord)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 *       404:
 *         description: Webhook not found
 */
router.post(
  '/:service',
  async (req: express.Request, res: express.Response) => {
    const { service } = req.params;
    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }
    const handler = webhookLoader.getHandler(service);

    if (!handler) {
      return res.status(404).json({ error: `Webhook handler for service '${service}' not found` });
    }

    try {
      await handler.handle(req, res);
    } catch (error) {
      console.error(`Error handling webhook for service '${service}':`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
