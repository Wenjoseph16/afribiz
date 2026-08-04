import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JWTPayload } from '../lib/jwt';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { presenceService } from './presenceService';

const isVercel = !!process.env.VERCEL;

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

/**
 * Force la déconnexion de tous les sockets d'un utilisateur (utilisé au logout
 * pour garantir que la présence décrémente même si un socket client survit).
 */
export function forceDisconnectUser(userId: string): void {
  if (!io) return;
  io.sockets.sockets.forEach((s) => {
    const u = (s as any).user;
    if (u && u.id === userId) s.disconnect(true);
  });
}

export function initSocket(httpServer: HttpServer): Server | null {
  if (isVercel) {
    logger.info('Socket.IO désactivé (environnement Vercel serverless)');
    return null;
  }

  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentification requise'));
      }
      const decoded = verifyAccessToken(token as string) as JWTPayload;
      (socket as any).user = {
        id: decoded.id,
        email: decoded.email,
        primaryRole: decoded.primaryRole,
        roles: decoded.roles || [],
      };
      next();
    } catch {
      next(new Error('Token invalide ou expiré'));
    }
  });

  // Diffuse le compteur de présence aux admins connectés (room admin:alerts)
  // → version allégée (count + byRole), sans la liste des userId (PII)
  function broadcastPresence() {
    io?.to('admin:alerts').emit('admin:presence:update', presenceService.getPresenceSummary());
  }

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user.id;

    socket.join(`user:${userId}`);
    presenceService.registerConnection(userId, socket.id, user.primaryRole);
    broadcastPresence();
    logger.debug(`Socket connected: ${user.email} (${userId})`);

    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Tableau de bord business : rejoindre/quitter la room temps réel du commerce
    socket.on('join:business', (businessId: string) => {
      socket.join(`business:${businessId}`);
      logger.debug(`Socket joined business room: ${businessId} (${user.email})`);
    });

    socket.on('leave:business', (businessId: string) => {
      socket.leave(`business:${businessId}`);
    });

    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        email: user.email,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId,
      });
    });

    // Live Commerce events
    socket.on('live:join', (liveId: string) => {
      socket.join(`live:${liveId}`);
      io?.to(`live:${liveId}`).emit('live:user-joined', { userId, email: user.email });
    });

    socket.on('live:leave', (liveId: string) => {
      socket.leave(`live:${liveId}`);
      io?.to(`live:${liveId}`).emit('live:user-left', { userId });
    });

    socket.on('live:chat', (data: { liveId: string; message: string; userName: string }) => {
      const chat = {
        userId,
        userName: data.userName,
        message: data.message,
        createdAt: new Date().toISOString(),
      };
      io?.to(`live:${data.liveId}`).emit('live:chat-message', chat);
    });

    socket.on('live:reaction', (data: { liveId: string; emoji: string }) => {
      io?.to(`live:${data.liveId}`).emit('live:reaction', {
        userId,
        emoji: data.emoji,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('live:viewer-count', (liveId: string) => {
      const room = io?.sockets.adapter.rooms.get(`live:${liveId}`);
      const count = room ? room.size : 0;
      io?.to(`live:${liveId}`).emit('live:viewer-count-update', { liveId, count });
    });

    // Admin rejoint la room d'alertes système + reçoit l'état de présence courant
    if (user.roles?.includes('ADMIN')) {
      socket.join('admin:alerts');
      socket.emit('admin:presence:update', presenceService.getPresenceSummary());
      logger.debug(`Admin socket joined admin:alerts room: ${user.email}`);
    }

    socket.on('disconnect', (reason) => {
      presenceService.unregisterConnection(userId, socket.id);
      broadcastPresence();
      logger.debug(`Socket disconnected: ${user.email} (${reason})`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}
