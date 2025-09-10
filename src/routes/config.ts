import express, { Request, Response } from 'express';
import config from '../config';

const router = express.Router();

router.get('/config', (req: Request, res: Response) => {
  try {
    if (!config.mal.clientId) {
      throw new Error('MAL configuration missing');
    }
    res.json({
      clientId: config.mal.clientId
    });
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

export default router;
