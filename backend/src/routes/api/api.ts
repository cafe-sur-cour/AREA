import express, { Request, Response } from 'express';
import { AppDataSource } from '../../config/db';
import i18next from 'i18next';
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

/**
 * @swagger
 * /api/language:
 *   get:
 *     summary: Get the current language
 *     tags:
 *       - Language
 *     responses:
 *       200:
 *         description: Current language
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                   enum: [en, fr]
 *                   example: en
 */
router.get('/language', async (_req: Request, res: Response): Promise<void> => {
  try {
    const currentLang = i18next.language || 'en';
    res.status(200).json({ language: currentLang });
  } catch (err) {
    console.error('Error getting language:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /api/language:
 *   post:
 *     summary: Set the language
 *     tags:
 *       - Language
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, fr]
 *                 example: fr
 *     responses:
 *       200:
 *         description: Language set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                   enum: [en, fr]
 *                   example: fr
 *       400:
 *         description: Invalid language
 *       500:
 *         description: Internal server error
 */
router.post('/language', async (req: Request, res: Response): Promise<void> => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'fr'].includes(language)) {
      res.status(400).json({ error: 'Invalid language. Must be "en" or "fr"' });
      return;
    }

    await i18next.changeLanguage(language);
    console.log(`🌐 Language changed to: ${language}`);
    res.status(200).json({ language });
  } catch (err) {
    console.error('Error setting language:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
