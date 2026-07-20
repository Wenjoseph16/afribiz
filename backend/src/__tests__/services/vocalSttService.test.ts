import { mockPrisma } from '../setup';
import {
  transcribeAudio,
  matchVoiceCommand,
  logTranscription,
} from '../../services/vocalSttService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('vocalSttService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.GOOGLE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
  });

  describe('transcribeAudio', () => {
    it('should return simulated transcription when no API key', async () => {
      const r = await transcribeAudio(Buffer.from('test'), 'audio/wav');
      expect(r.text).toContain('simulée');
      expect(r.confidence).toBe(0);
    });

    it('should call Azure STT when AZURE_SPEECH_KEY is set', async () => {
      process.env.AZURE_SPEECH_KEY = 'azure-key';
      process.env.AZURE_SPEECH_REGION = 'westeurope';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ DisplayText: 'Hello', NBest: [{ Confidence: 0.95 }] }),
      } as any);
      const r = await transcribeAudio(Buffer.from('audio'), 'audio/wav');
      expect(r.text).toBe('Hello');
      expect(r.confidence).toBe(0.95);
    });

    it('should call Google STT when GOOGLE_SPEECH_KEY is set', async () => {
      process.env.GOOGLE_SPEECH_KEY = 'google-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [{ alternatives: [{ transcript: 'Bonjour', confidence: 0.9 }] }],
        }),
      } as any);
      const r = await transcribeAudio(Buffer.from('audio'), 'audio/wav');
      expect(r.text).toBe('Bonjour');
      expect(r.confidence).toBe(0.9);
    });

    it('should throw on Azure API error', async () => {
      process.env.AZURE_SPEECH_KEY = 'azure-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      } as any);
      await expect(transcribeAudio(Buffer.from('test'), 'audio/wav')).rejects.toThrow(
        'Azure STT error'
      );
    });
  });

  describe('matchVoiceCommand', () => {
    it('should return matched command', async () => {
      jest.spyOn(mockPrisma.voiceCommand, 'findMany').mockResolvedValue([
        { command: 'bonjour', action: 'GREET' },
        { command: 'aide', action: 'HELP' },
      ] as any);
      const r = await matchVoiceCommand('Bonjour comment ça va');
      expect(r.command).toBe('bonjour');
      expect(r.action).toBe('GREET');
      expect(r.response).toContain('reconnue');
    });

    it('should return null when no match', async () => {
      jest
        .spyOn(mockPrisma.voiceCommand, 'findMany')
        .mockResolvedValue([{ command: 'bonjour', action: 'GREET' }] as any);
      const r = await matchVoiceCommand('au revoir');
      expect(r.command).toBeNull();
      expect(r.action).toBeNull();
      expect(r.response).toContain('non reconnue');
    });
  });

  describe('logTranscription', () => {
    it('should create a voice query log', async () => {
      jest.spyOn(mockPrisma.voiceQuery, 'create').mockResolvedValue({ id: 'vq-1' } as any);
      const r = await logTranscription('b1', 'u1', 'Hello', 0.95, 'fr');
      expect(r).toBeDefined();
      expect(mockPrisma.voiceQuery.create).toHaveBeenCalled();
    });
  });
});
