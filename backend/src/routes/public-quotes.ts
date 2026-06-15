import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

const router = Router();

/**
 * POST /api/public/businesses/:slug/quote-request
 * Public endpoint for clients to submit quote requests without authentication
 */
router.post('/businesses/:slug/quote-request', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { customerName, customerEmail, customerPhone, description, serviceName, notes } = req.body;

    if (!slug || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Champs obligatoires manquants : slug, customerName, customerPhone',
      });
    }

    const business = await prisma.business.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: { id: true, name: true, settings: true },
    }) as any;

    if (!business) {
      return res.status(404).json({ success: false, error: 'Business non trouvé' });
    }

    const d = new Date();
    const quoteNumber = `DEM-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    let clientId: string | null = null;
    if (customerEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } });
      if (existingUser) clientId = existingUser.id;
    }
    if (!clientId && customerPhone) {
      const existingUser = await prisma.user.findUnique({ where: { phone: customerPhone }, select: { id: true } });
      if (existingUser) clientId = existingUser.id;
    }

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        businessId: business.id,
        clientId,
        clientName: customerName,
        clientPhone: customerPhone,
        clientEmail: customerEmail || null,
        title: `Demande de devis${serviceName ? ' - ' + serviceName : ''}`,
        description: description || null,
        notes: '[DEMANDE CLIENT]' + (notes ? '\nNotes: ' + notes : '') + (serviceName ? '\nService: ' + serviceName : ''),
        subtotal: 0,
        totalAmount: 0,
        currency: (business.settings as any)?.currency || 'FCFA',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true, quoteNumber: true, title: true, status: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      data: { quote },
      message: 'Votre demande de devis a été envoyée avec succès. Le professionnel vous contactera sous peu.',
    });
  } catch (error) {
    logger.error('Public quote request error', { error });
    res.status(500).json({ success: false, error: 'Erreur lors de la soumission de la demande de devis' });
  }
});

export default router;
