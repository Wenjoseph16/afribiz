import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { transcribeAudio, matchVoiceCommand, logTranscription } from '../services/vocalSttService';

const router = Router();

router.post('/transcribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const audioBuffer = req.body?.audio ? Buffer.from(req.body.audio, 'base64') : undefined;
    const mimeType = req.body?.mimeType || 'audio/wav';
    const language = req.body?.language || 'fr';

    if (!audioBuffer) {
      return res.status(400).json({ success: false, error: 'audio (base64) required' });
    }

    const result = await transcribeAudio(audioBuffer, mimeType, language);

    res.json({
      success: true,
      data: {
        text: result.text,
        confidence: result.confidence,
        language: result.language,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Transcription failed' });
  }
});

router.post('/command', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'text required' });
    }

    const match = await matchVoiceCommand(text);
    res.json({ success: true, data: match });
  } catch {
    res.status(500).json({ success: false, error: 'Command matching failed' });
  }
});

router.post('/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { audio, mimeType, language } = req.body;

    if (!audio) {
      return res.status(400).json({ success: false, error: 'audio (base64) required' });
    }

    const audioBuffer = Buffer.from(audio, 'base64');
    const transcription = await transcribeAudio(
      audioBuffer,
      mimeType || 'audio/wav',
      language || 'fr'
    );
    const match = await matchVoiceCommand(transcription.text);
    const user = (req as any).user;

    if (user) {
      const business = await (
        await import('../lib/db')
      ).prisma.business.findFirst({
      where: { ownerId: user.id },
        select: { id: true },
      });
      if (business) {
        await logTranscription(
          business.id,
          user.id,
          transcription.text,
          transcription.confidence,
          transcription.language
        );
      }
    }

    res.json({
      success: true,
      data: {
        transcription: transcription.text,
        confidence: transcription.confidence,
        command: match,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Voice processing failed' });
  }
});

export default router;
