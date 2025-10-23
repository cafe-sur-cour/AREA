import express, { Request, Response } from 'express';
import { AppDataSource } from '../../config/db';
const router = express.Router();

/**
 * @swagger
 * /api/info/health:
 *   get:
 *     summary: Check the API health status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description:API is healthy
 */
router.get(
  '/health',
  async (_req: Request, res: Response): Promise<Response> => {
    return res.status(200).json({ status: 'OK' });
  }
);

/**
 * @swagger
 * /api/info/health-db:
 *   get:
 *     summary: Check the database status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: the database is healthy
 */
router.get(
  '/health-db',
  async (_req: Request, res: Response): Promise<Response> => {
    try {
      await AppDataSource.query('SELECT 1');
      return res.status(200).json({ database: 'OK' });
    } catch (err) {
      console.error('Database connection error:', err);
      const errorMessage =
        err instanceof Error ? err.message : String(err || 'Unknown error');
      return res.status(500).json({ database: 'Error', error: errorMessage });
    }
  }
);

export default router;
