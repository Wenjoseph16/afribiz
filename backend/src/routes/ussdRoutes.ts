import { Router, Request, Response } from 'express';
import { handleUssdSession } from '../services/ussdService';

const router = Router();

router.post('/session', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, text } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber required' });
    }

    const response = await handleUssdSession(phoneNumber, text || '');
    res.json({ success: true, data: { response } });
  } catch {
    res.status(500).json({ success: false, error: 'USSD session failed' });
  }
});

router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, text } = req.body;

    const response = await handleUssdSession(phoneNumber, text || '');
    res.contentType('text/plain').send(response);
  } catch {
    res.contentType('text/plain').send('END Une erreur est survenue.');
  }
});

export default router;
