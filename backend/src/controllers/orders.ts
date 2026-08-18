import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';
import * as orderService from '../services/orders';
import { logger } from '../lib/logger';
import { auditEmployeeAction } from '../lib/auditEmployee';

// ===================== BUSINESS ORDERS =====================

export const listBusinessOrders = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.listBusinessOrders(req.user.id, req.query);
    res.json(successResponse(data));
  }
);

export const getBusinessOrder = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.getBusinessOrder(req.user.id, req.params.id);
    res.json(successResponse(data));
  }
);

export const createBusinessOrder = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.createOrder(req.user.id, req.body);

    // Audit trail : tracer la création de commande par employé
    if (req.isEmployee && req.employeeId) {
      auditEmployeeAction({
        businessId: req.employeeBusinessId || '',
        employeeId: req.employeeId,
        action: 'ORDER_CREATED',
        module: 'ORDERS',
        description: `Commande ${data.orderNumber || data.id} créée`,
        metadata: { orderId: data.id, orderNumber: data.orderNumber, totalAmount: data.totalAmount },
        ipAddress: req.ip,
      }).catch(() => {});
    }
    res.status(201).json(successResponse(data));
  }
);

export const updateBusinessOrderStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.updateOrderStatus(
      req.user.id,
      req.params.id,
      req.body.status,
      req.body.reason
    );
    res.json(successResponse(data));
  }
);

export const updateBusinessDeliveryStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.updateDeliveryStatus(
      req.user.id,
      req.params.id,
      req.body.deliveryStatus,
      req.body.notes
    );
    res.json(successResponse(data));
  }
);

export const updateBusinessOrderPayment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.updateOrderPayment(req.user.id, req.params.id, req.body);
    res.json(successResponse(data));
  }
);

export const deleteBusinessOrder = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const orderId = req.params.id;
    await orderService.deleteOrder(req.user.id, orderId);

    // Audit trail : tracer la suppression de commande par employé
    if (req.isEmployee && req.employeeId) {
      auditEmployeeAction({
        businessId: req.employeeBusinessId || '',
        employeeId: req.employeeId,
        action: 'ORDER_DELETED',
        module: 'ORDERS',
        description: `Commande ${orderId} supprimée`,
        metadata: { orderId },
        ipAddress: req.ip,
      }).catch(() => {});
    }

    res.json(successResponse({ message: 'Commande supprimée' }));
  }
);

export const getBusinessOrderStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.getOrderStats(req.user.id);
    res.json(successResponse(data));
  }
);

// ===================== DEBTS =====================

export const listBusinessDebts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.listDebts(req.user.id, req.query);
    res.json(successResponse(data));
  }
);

export const payBusinessDebt = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.payDebt(req.user.id, req.params.id, req.body.amount);
    res.json(successResponse(data));
  }
);

export const settleBusinessDebt = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const data = await orderService.settleDebt(req.user.id, req.params.id);
    res.json(successResponse(data));
  }
);

// ===================== CLIENT ORDERS =====================

export const getMyOrderTimeline = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, buyerId: req.user.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        paidAt: true,
        deliveredAt: true,
        cancelledAt: true,
      },
    });
    if (!order) {
      throw new AppError('Commande introuvable', 404);
    }

    const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
    const currentIdx = statusFlow.indexOf(order.status);

    const timeline = [
      {
        status: 'PENDING',
        label: 'Commande pass\u00e9e',
        date: order.createdAt?.toISOString() || null,
        isActive: true,
      },
      {
        status: 'CONFIRMED',
        label: 'Prise en charge',
        date: order.paidAt?.toISOString() || order.createdAt?.toISOString() || null,
        isActive: currentIdx >= statusFlow.indexOf('CONFIRMED'),
      },
      {
        status: 'PREPARING',
        label: 'En pr\u00e9paration',
        date: null,
        isActive: currentIdx >= statusFlow.indexOf('PREPARING'),
      },
      {
        status: 'SHIPPED',
        label: 'En livraison',
        date: null,
        isActive: currentIdx >= statusFlow.indexOf('SHIPPED'),
      },
      {
        status: 'DELIVERED',
        label: 'Livr\u00e9e',
        date: order.deliveredAt?.toISOString() || null,
        isActive: currentIdx >= statusFlow.indexOf('DELIVERED'),
      },
    ];

    if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
      timeline.push({
        status: order.status,
        label: order.status === 'CANCELLED' ? 'Annul\u00e9e' : 'Rembours\u00e9e',
        date: order.cancelledAt?.toISOString() || null,
        isActive: true,
      });
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        timeline,
      },
    });
  }
);

export const getMyOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;
  const where: Record<string, any> = { buyerId: req.user.id };
  if (status) where.status = status;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true, business: { select: { name: true, logo: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  res.json(
    successResponse({
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});

export const updateMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
  });
  if (!order) {
    throw new AppError('Commande introuvable', 404);
  }
  const { clientName, deliveryAddress, contactPhone, notes } = req.body;
  const upd: any = {};
  if (clientName !== undefined) upd.contactName = clientName;
  if (deliveryAddress !== undefined) upd.deliveryAddress = deliveryAddress;
  if (contactPhone !== undefined) upd.contactPhone = contactPhone;
  if (notes !== undefined) upd.notes = notes;
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: upd,
    include: { items: true, payments: true, debts: true, business: { select: { name: true } } },
  });
  res.json(successResponse({ order: updated }));
});

export const cancelMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
  });
  if (!order) {
    throw new AppError('Commande introuvable', 404);
  }
  if (['CANCELLED', 'REFUSED', 'REFUNDED', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
    throw new AppError('Cette commande ne peut plus \u00eatre annul\u00e9e', 400);
  }
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason || null },
    include: { items: true, payments: true, debts: true },
  });
  res.json(successResponse({ order: updated, message: 'Commande annul\u00e9e' }));
});

export const getMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
    include: {
      items: true,
      payments: true,
      debts: true,
      business: {
        select: { id: true, name: true, slug: true, logo: true, phone: true, email: true },
      },
    },
  });
  if (!order) {
    throw new AppError('Commande introuvable', 404);
  }
  res.json(successResponse({ order }));
});

// ===================== EXPORT =====================

export const exportOrdersCSV = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await orderService.listBusinessOrders(req.user.id, {
      ...req.query,
      limit: '10000',
    });
    const orders = (data as any).orders || (data as any).data || [];

    const header = 'Numéro,Client,Téléphone,Montant,Statut,Type,Source,Date,Payé\n';
    const rows = orders.map((o: any) =>
      [
        o.orderNumber,
        `"${(o.contactName || o.buyer?.firstName || '').replace(/"/g, '""')}"`,
        o.contactPhone || '',
        o.totalAmount,
        o.status,
        o.type,
        o.source,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '',
        o.paymentStatus || '',
      ].join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=commandes-${Date.now()}.csv`);
    res.status(200).send('\uFEFF' + header + rows.join('\n'));
  }
);

export const exportOrderInvoicePDF = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        business: { select: { name: true, logo: true, address: true, phone: true, email: true } },
      },
    });
    if (!order) throw new AppError('Commande introuvable', 404);
    if (order.business?.name !== (req as any).businessName && order.buyerId !== req.user.id) {
      throw new AppError('Accès refusé', 403);
    }

    try {
      const pdfModule: any = await import('pdfmake');
      const vfsFonts: any = await import('pdfmake/build/vfs_fonts');

      const fonts = {
        Roboto: {
          normal: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
          bold: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5vAw.ttf',
          italics: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu52xP.ttf',
          bolditalics: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmSU5vAw.ttf',
        },
      };
      const printer = new pdfModule(fonts);
      if (vfsFonts?.default) printer.setVirtualFileSystem(vfsFonts.default);

      const itemsBody = order.items.map((i, idx) => [
        { text: (idx + 1).toString(), style: 'tableCell' },
        { text: i.name, style: 'tableCell' },
        { text: i.quantity.toString(), style: 'tableCellCenter' },
        {
          text: `${Number(i.unitPrice).toLocaleString('fr-FR')} ${order.currency}`,
          style: 'tableCellRight',
        },
        {
          text: `${Number(i.total).toLocaleString('fr-FR')} ${order.currency}`,
          style: 'tableCellRight',
        },
      ]);

      const clientName =
        `${order.buyer?.firstName || ''} ${order.buyer?.lastName || ''}`.trim() ||
        order.contactName ||
        'Client';
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: [
          { text: 'FACTURE', style: 'header' },
          { text: `N° ${order.orderNumber}`, style: 'subheader' },
          {
            text: `Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`,
            style: 'label',
          },
          { text: `Statut: ${order.status}`, style: 'label', margin: [0, 0, 0, 20] },
          { text: 'Client', style: 'sectionTitle' },
          { text: `Nom: ${clientName}`, style: 'label' },
          { text: `Email: ${order.buyer?.email || ''}`, style: 'label' },
          {
            text: `Tél: ${order.contactPhone || order.buyer?.phone || ''}`,
            style: 'label',
            margin: [0, 0, 0, 20],
          },
          { text: 'Entreprise', style: 'sectionTitle' },
          { text: `${order.business?.name || ''}`, style: 'label' },
          { text: `${order.business?.address || ''}`, style: 'label' },
          { text: `${order.business?.phone || ''}`, style: 'label' },
          { text: `${order.business?.email || ''}`, style: 'label', margin: [0, 0, 0, 20] },
          { text: 'Articles', style: 'sectionTitle' },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: '#', style: 'tableHeader' },
                  { text: 'Article', style: 'tableHeader' },
                  { text: 'Qté', style: 'tableHeaderCenter' },
                  { text: 'Prix unitaire', style: 'tableHeaderRight' },
                  { text: 'Total', style: 'tableHeaderRight' },
                ],
                ...itemsBody,
              ],
            },
            layout: 'headerLineOnly',
            margin: [0, 0, 0, 20],
          },
          {
            text: `Sous-total: ${Number(order.subtotal || order.totalAmount).toLocaleString('fr-FR')} ${order.currency}`,
            style: 'totalLine',
          },
          ...(Number(order.taxAmount) > 0
            ? [
                {
                  text: `Taxe: ${Number(order.taxAmount).toLocaleString('fr-FR')} ${order.currency}`,
                  style: 'totalLine',
                },
              ]
            : []),
          ...(Number(order.deliveryFee) > 0
            ? [
                {
                  text: `Livraison: ${Number(order.deliveryFee).toLocaleString('fr-FR')} ${order.currency}`,
                  style: 'totalLine',
                },
              ]
            : []),
          ...(Number(order.discountAmount) > 0
            ? [
                {
                  text: `Remise: -${Number(order.discountAmount).toLocaleString('fr-FR')} ${order.currency}`,
                  style: 'totalLine',
                },
              ]
            : []),
          {
            text: `Total: ${Number(order.totalAmount).toLocaleString('fr-FR')} ${order.currency}`,
            style: 'totalBold',
            margin: [0, 10, 0, 0],
          },
        ],
        styles: {
          header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          subheader: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          sectionTitle: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
          label: { fontSize: 10, margin: [0, 1, 0, 1] },
          tableHeader: { fontSize: 10, bold: true, fillColor: '#f3f4f6' },
          tableHeaderCenter: {
            fontSize: 10,
            bold: true,
            alignment: 'center',
            fillColor: '#f3f4f6',
          },
          tableHeaderRight: { fontSize: 10, bold: true, alignment: 'right', fillColor: '#f3f4f6' },
          tableCell: { fontSize: 9, margin: [4, 4, 4, 4] },
          tableCellCenter: { fontSize: 9, alignment: 'center', margin: [4, 4, 4, 4] },
          tableCellRight: { fontSize: 9, alignment: 'right', margin: [4, 4, 4, 4] },
          totalLine: { fontSize: 10, alignment: 'right', margin: [0, 2, 0, 2] },
          totalBold: { fontSize: 12, bold: true, alignment: 'right' },
        },
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=facture-${order.orderNumber}.pdf`
        );
        res.status(200).send(buffer);
      });
      pdfDoc.end();
    } catch (err) {
      logger.warn('PDF generation failed', { error: (err as Error).message });
      res.status(501).json(successResponse(null, 'Génération PDF indisponible'));
    }
  }
);
