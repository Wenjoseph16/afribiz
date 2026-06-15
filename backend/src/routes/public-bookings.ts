import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

const router = Router();

/**
 * GET /api/public/businesses/:slug/booking-info
 * Returns public booking info for a business (name, services, resources, slots)
 */
router.get('/businesses/:slug/booking-info', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const business = await prisma.business.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      select: {
        id: true, name: true, slug: true, description: true, logo: true, coverImage: true,
        phone: true, email: true, address: true, city: true, country: true,
        settings: true, modules: true,
      },
    }) as any;
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business non trouvé' });
    }

    const [services, rooms, resources, slots] = await Promise.all([
      prisma.service.findMany({
        where: { businessId: business.id, isActive: true, deletedAt: null },
        select: { id: true, name: true, description: true, price: true, duration: true, currency: true, category: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.room.findMany({
        where: { businessId: business.id, isActive: true, deletedAt: null },
        select: { id: true, name: true, description: true, price: true, capacity: true, images: true },
      }),
      prisma.bookingResource.findMany({
        where: { businessId: business.id, isActive: true },
        select: { id: true, name: true, type: true, capacity: true, description: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.timeSlot.findMany({
        where: { businessId: business.id, isActive: true },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, resourceId: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
    ]);

    const modules = business.modules || [];
    const bookingsEnabled = modules.includes('BOOKINGS') || modules.includes('ALL');
    const bizSettings = business.settings || {};
    const currency = (bizSettings as any).currency || 'FCFA';

    res.json({
      success: true,
      data: {
        business: {
          id: business.id, name: business.name, slug: business.slug, description: business.description,
          logo: business.logo, coverImage: business.coverImage, phone: business.phone, email: business.email,
          address: business.address, city: business.city, country: business.country,
          currency,
        },
        bookingsEnabled,
        services, rooms, resources, slots,
      },
    });
  } catch (error) {
    logger.error('Public booking info error', { error });
    res.status(500).json({ success: false, error: 'Erreur interne' });
  }
});

/**
 * POST /api/public/bookings
 * Creates a booking without authentication (public-facing)
 */
router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const { businessSlug, title, type, serviceId, roomId, resourceId, startDate, endDate,
      guests, customerName, customerPhone, customerEmail, notes, specialRequests, price, currency } = req.body;

    if (!businessSlug || !startDate || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
    }

    const business = await prisma.business.findFirst({
      where: { slug: businessSlug, deletedAt: null, isActive: true },
      select: { id: true, name: true, settings: true },
    }) as any;
    if (!business) {
      return res.status(404).json({ success: false, error: 'Business non trouvé' });
    }

    const d = new Date();
    const bookingNumber = `PUB-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Find or create guest user
    let clientId: string;
    let existingUser = customerEmail
      ? await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } })
      : null;
    if (!existingUser && customerPhone) {
      existingUser = await prisma.user.findUnique({ where: { phone: customerPhone }, select: { id: true } });
    }
    if (existingUser) {
      clientId = existingUser.id;
    } else {
      const guestEmail = customerEmail || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@afribiz.com`;
      const guest = await prisma.user.create({
        data: {
          firstName: customerName || 'Client',
          lastName: '',
          email: guestEmail,
          passwordHash: 'PUBLIC_GUEST',
          phone: customerPhone || null,
          roles: ['CLIENT'] as any,
        },
      });
      clientId = guest.id;
    }

    // Validate startDate
    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({ success: false, error: 'Date de début invalide' });
    }

    // Check for conflicts on resource/room
    const end = endDate ? new Date(endDate) : null;
    if (end && isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: 'Date de fin invalide' });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        businessId: business.id,
        clientId,
        title: title || `Réservation ${business.name}`,
        type: type || 'SERVICE',
        source: 'AFRIBIZ_SITE',
        startDate: parsedStart,
        endDate: end,
        guests: guests || 1,
        numberOfPeople: guests || 1,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        specialRequests: specialRequests || null,
        notes: notes || null,
        price: price || 0,
        currency: currency || 'FCFA',
        status: 'PENDING',
        serviceId: serviceId || null,
        roomId: roomId || null,
        resourceId: resourceId || null,
      },
    });

    res.status(201).json({
      success: true,
      data: { booking: { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status } },
      message: 'Réservation envoyée avec succès',
    });
  } catch (error) {
    logger.error('Public booking creation error', { error });
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la réservation' });
  }
});

export default router;
