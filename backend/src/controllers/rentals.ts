import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as rentalsService from '../services/rentals';
import { generateRentalContractPdf } from '../services/pdfGenerator';

export const downloadRentalContract = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  // Allow both the client who rented AND the business owner
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id }, select: { id: true } });
  const booking = await prisma.booking.findFirst({
    where: {
      id: req.params.id,
      rentalId: { not: null },
      OR: [
        { clientId: req.user.id },
        ...(business ? [{ businessId: business.id }] : []),
      ],
    },
    include: {
      rental: true,
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      business: {
        select: { id: true, name: true, logo: true, email: true, phone: true, address: true, city: true, country: true },
      },
    },
  });
  if (!booking) throw new AppError('Réservation non trouvée', 404);

  try {
    const pdfBuffer = await generateRentalContractPdf(booking as any);
    const filename = `contrat_location_${(booking.bookingNumber || booking.id).toLowerCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    throw new AppError('Erreur lors de la génération du contrat', 500);
  }
});

export const listRentals = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await rentalsService.listRentals(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getRental = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const rental = await rentalsService.getRental(req.user.id, req.params.id);
  res.json({ success: true, data: rental });
});

export const createRental = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const rental = await rentalsService.createRental(req.user.id, req.body);
  res.status(201).json({ success: true, data: rental, message: 'Location créée' });
});

export const updateRental = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const rental = await rentalsService.updateRental(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: rental, message: 'Location mise à jour' });
});

export const deleteRental = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await rentalsService.deleteRental(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const toggleRentalActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const rental = await rentalsService.toggleRentalActive(req.user.id, req.params.id);
  res.json({ success: true, data: rental });
});

export const getRentalStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await rentalsService.getRentalStats(req.user.id);
  res.json({ success: true, data: stats });
});

export const createRentalBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const booking = await rentalsService.createRentalBooking(req.user.id, req.body);
  res.status(201).json({ success: true, data: booking, message: 'Location réservée' });
});

export const prolongRentalBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const booking = await rentalsService.prolongRentalBooking(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: booking, message: 'Location prolongée' });
});
