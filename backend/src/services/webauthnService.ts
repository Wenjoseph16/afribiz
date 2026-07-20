import crypto from 'crypto';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

export class WebAuthnService {
  static async generateRegistrationOptions(userId: string): Promise<{
    challenge: string;
    rp: { name: string; id: string };
    user: { id: string; name: string; displayName: string };
    pubKeyCredParams: { type: string; alg: number }[];
    authenticatorSelection: {
      authenticatorAttachment: string;
      requireResidentKey: boolean;
      residentKey: string;
      userVerification: string;
    };
    excludeCredentials: { type: string; id: string }[];
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const existing = await prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true },
    });

    return {
      challenge: crypto.randomBytes(32).toString('base64url'),
      rp: {
        name: 'AfriBiz',
        id: new URL(process.env.FRONTEND_URL || 'http://localhost:3000').hostname,
      },
      user: { id: userId, name: user.email, displayName: `${user.firstName} ${user.lastName}` },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: existing.map((c) => ({ type: 'public-key', id: c.credentialId })),
    };
  }

  static async verifyAndRegister(
    userId: string,
    credential: {
      id: string;
      rawId: string;
      response: { clientDataJSON: string; attestationObject: string };
    },
    deviceName?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const existing = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: credential.id },
    });
    if (existing) throw new AppError('Credential already registered', 409);

    const publicKey = Buffer.from(credential.response.attestationObject, 'base64');

    await prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey,
        counter: BigInt(0),
        transports: [],
        deviceName: deviceName || 'WebAuthn Device',
        backedUp: false,
      },
    });

    logger.info(`WebAuthn credential registered for user ${userId}`);
  }

  static async getCredentials(
    userId: string
  ): Promise<
    { id: string; deviceName: string | null; createdAt: Date; lastUsedAt: Date | null }[]
  > {
    const creds = await prisma.webAuthnCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, credentialId: true, deviceName: true, createdAt: true, lastUsedAt: true },
    });

    return creds.map((c) => ({
      id: c.credentialId,
      deviceName: c.deviceName,
      createdAt: c.createdAt,
      lastUsedAt: c.lastUsedAt,
    }));
  }

  static async removeCredential(userId: string, credentialId: string): Promise<void> {
    const cred = await prisma.webAuthnCredential.findUnique({ where: { credentialId } });
    if (!cred || cred.userId !== userId) throw new AppError('Credential not found', 404);

    await prisma.webAuthnCredential.delete({ where: { credentialId } });
    logger.info(`WebAuthn credential ${credentialId} removed for user ${userId}`);
  }
}
