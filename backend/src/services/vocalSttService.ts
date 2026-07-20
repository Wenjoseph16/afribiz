import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export type TranscriptionResult = {
  text: string;
  confidence: number;
  language: string;
};

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  language: string = 'fr'
): Promise<TranscriptionResult> {
  const apiKey = process.env.AZURE_SPEECH_KEY || process.env.GOOGLE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || 'westeurope';

  if (!apiKey) {
    logger.info('[Vocal STT] No speech API key configured — returning simulated transcription');
    return {
      text: '[Transcription simulée — API de reconnaissance vocale non configurée]',
      confidence: 0,
      language,
    };
  }

  try {
    if (process.env.AZURE_SPEECH_KEY) {
      return await transcribeWithAzure(audioBuffer, mimeType, language, apiKey, region);
    }
    return await transcribeWithGoogle(audioBuffer, mimeType, language, apiKey);
  } catch (err: any) {
    logger.error('[Vocal STT] Transcription failed:', err.message);
    throw err;
  }
}

async function transcribeWithAzure(
  audioBuffer: Buffer,
  mimeType: string,
  language: string,
  apiKey: string,
  region: string
): Promise<TranscriptionResult> {
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}&format=detailed`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': mimeType || 'audio/wav',
      Accept: 'application/json',
    },
    body: audioBuffer as any,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Azure STT error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  return {
    text: data.DisplayText || '',
    confidence: data.NBest?.[0]?.Confidence || 0,
    language,
  };
}

async function transcribeWithGoogle(
  audioBuffer: Buffer,
  mimeType: string,
  language: string,
  apiKey: string
): Promise<TranscriptionResult> {
  const base64Audio = audioBuffer.toString('base64');

  const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      config: {
        encoding: mimeType === 'audio/webm' ? 'WEBM_OPUS' : 'LINEAR16',
        languageCode: language,
        model: 'default',
      },
      audio: { content: base64Audio },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google STT error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const transcript =
    data.results?.map((r: any) => r.alternatives?.[0]?.transcript || '').join(' ') || '';

  return {
    text: transcript,
    confidence: data.results?.[0]?.alternatives?.[0]?.confidence || 0,
    language,
  };
}

export async function matchVoiceCommand(text: string): Promise<{
  command: string | null;
  action: string | null;
  response: string;
}> {
  const voiceCommands = await prisma.voiceCommand.findMany({
    where: { isActive: true },
    select: { command: true, action: true },
  });

  const lowerText = text.toLowerCase();
  const matched = voiceCommands.find((vc) => lowerText.includes(vc.command.toLowerCase()));

  if (matched) {
    return {
      command: matched.command,
      action: matched.action,
      response: `Commande "${matched.command}" reconnue (action: ${matched.action})`,
    };
  }

  return {
    command: null,
    action: null,
    response: 'Commande non reconnue',
  };
}

export async function logTranscription(
  businessId: string,
  userId: string,
  text: string,
  confidence: number,
  language: string
) {
  return prisma.voiceQuery.create({
    data: {
      businessId,
      query: text,
      language,
      action: 'STT',
      response: JSON.stringify({ confidence }),
      deviceInfo: 'vocal-stt',
    } as any,
  });
}
