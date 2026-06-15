import { Prisma } from '@prisma/client';

type InvoiceWithBusiness = Prisma.InvoiceGetPayload<{
  include: {
    invoiceItems: true;
    client: { select: { id: true; firstName: true; lastName: true; email: true; phone: true } };
    business: {
      select: {
        id: true; name: true; logo: true; email: true; phone: true;
        address: true; city: true; country: true; whatsapp: true;
        website: true; taxId: true; settings: true;
      };
    };
  };
}>;

// ── Rental Contract Types ──
type RentalBookingWithDetails = Prisma.BookingGetPayload<{
  include: {
    rental: true;
    client: { select: { id: true; firstName: true; lastName: true; email: true; phone: true } };
    business: {
      select: {
        id: true; name: true; logo: true; email: true; phone: true;
        address: true; city: true; country: true;
      };
    };
  };
}>;

const FONTS: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }> = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

const LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', SENT: 'Envoyée', PAID: 'Payée',
  PARTIALLY_PAID: 'Partielle', OVERDUE: 'En retard', CANCELLED: 'Annulée',
};

const COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SENT: '#2563eb', PAID: '#16a34a',
  PARTIALLY_PAID: '#d97706', OVERDUE: '#dc2626', CANCELLED: '#dc2626',
};

export async function generateInvoicePdf(invoice: InvoiceWithBusiness): Promise<Buffer> {
  const pdfModule: any = await import('pdfmake');
  const vfsFonts: any = await import('pdfmake/build/vfs_fonts');
  pdfModule.default.vfs = vfsFonts.default || vfsFonts;

  const currency = invoice.currency || 'FCFA';
  const fmt = (amount: any): string => Number(amount || 0).toLocaleString('fr-FR') + ' ' + currency;
  const biz = invoice.business;

  const docDef: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#374151' },
    fonts: FONTS,
    info: {
      title: 'Facture ' + invoice.invoiceNumber,
      author: biz?.name || 'AfriBiz',
    },
    content: [
      // Header: Business info + Invoice info
      {
        columns: [
          {
            width: '60%',
            stack: [
              biz?.logo
                ? { image: biz.logo, width: 120, height: 40, margin: [0, 0, 0, 4] }
                : { text: biz?.name || '', bold: true, fontSize: 18, color: '#1f2937', margin: [0, 0, 0, 4] },
              ...(biz?.name && biz?.logo ? [{ text: biz.name, bold: true, fontSize: 14, color: '#1f2937', margin: [0, 0, 0, 2] }] : []),
              { text: biz?.address || '', fontSize: 9, color: '#6b7280' },
              { text: [biz?.city, biz?.country].filter(Boolean).join(', '), fontSize: 9, color: '#6b7280' },
              ...(biz?.phone ? [{ text: 'Tél: ' + biz.phone, fontSize: 9, color: '#6b7280' }] : []),
              ...(biz?.email ? [{ text: 'Email: ' + biz.email, fontSize: 9, color: '#6b7280' }] : []),
              ...(biz?.taxId ? [{ text: 'N° fiscal: ' + biz.taxId, fontSize: 9, color: '#6b7280' }] : []),
            ].filter(Boolean),
          },
          {
            width: '40%',
            stack: [
              { text: 'FACTURE', bold: true, fontSize: 24, color: '#2563eb', alignment: 'right' },
              { text: 'N° ' + invoice.invoiceNumber, fontSize: 12, bold: true, alignment: 'right', margin: [0, 4, 0, 2] },
              { text: 'Date: ' + new Date(invoice.createdAt).toLocaleDateString('fr-FR'), fontSize: 9, alignment: 'right', color: '#6b7280' },
              ...(invoice.dueDate ? [{ text: 'Échéance: ' + new Date(invoice.dueDate).toLocaleDateString('fr-FR'), fontSize: 9, alignment: 'right', color: '#6b7280' }] : []),
              { text: 'Statut: ' + (LABELS[invoice.status] || invoice.status), fontSize: 9, alignment: 'right', color: COLORS[invoice.status] || '#6b7280' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 8, 0, 12] },

      // Client info
      { text: 'Facturé à', fontSize: 10, bold: true, margin: [0, 0, 0, 4] },
      {
        stack: [
          invoice.clientName ? { text: invoice.clientName, fontSize: 10, bold: true } : {},
          invoice.clientEmail ? { text: invoice.clientEmail, fontSize: 9, color: '#6b7280' } : {},
          invoice.clientPhone ? { text: 'Tél: ' + invoice.clientPhone, fontSize: 9, color: '#6b7280' } : {},
        ].filter((i: any) => Object.keys(i).length > 0),
        margin: [0, 0, 0, 16],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Qté', style: 'tableHeader', alignment: 'center' },
              { text: 'Prix unitaire', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' },
            ],
            ...(invoice.invoiceItems?.length
              ? invoice.invoiceItems.map((item: any) => [
                  { text: item.description || '', fontSize: 9.5 },
                  { text: String(item.quantity || 1), alignment: 'center', fontSize: 9.5 },
                  { text: fmt(item.unitPrice), alignment: 'right', fontSize: 9.5 },
                  { text: fmt(item.total), alignment: 'right', fontSize: 9.5, bold: true },
                ])
              : [[{ text: 'Aucun article', colSpan: 4, alignment: 'center', color: '#9ca3af', fontSize: 9 }, {}, {}, {}]]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#2563eb' : rowIndex % 2 === 0 ? '#f9fafb' : null),
          hLineWidth: (i: number) => (i === 0 || i === 1 ? 0 : 0.5),
          vLineWidth: () => 0,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },

      // Totals
      {
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        table: {
          widths: ['*', 150],
          body: [
            [{ text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [
              { text: 'Sous-total', alignment: 'right', fontSize: 10, color: '#6b7280', border: [false, false, false, false] },
              { text: fmt(invoice.subtotal), alignment: 'right', fontSize: 10, border: [false, false, false, false] },
            ],
            ...(Number(invoice.taxAmount || 0) > 0
              ? [[
                  { text: 'Taxe', alignment: 'right', fontSize: 10, color: '#6b7280', border: [false, false, false, false] },
                  { text: fmt(invoice.taxAmount), alignment: 'right', fontSize: 10, border: [false, false, false, false] },
                ]]
              : []),
            ...(Number(invoice.discountAmount || 0) > 0
              ? [[
                  { text: 'Remise', alignment: 'right', fontSize: 10, color: '#6b7280', border: [false, false, false, false] },
                  { text: '- ' + fmt(invoice.discountAmount), alignment: 'right', fontSize: 10, color: '#dc2626', border: [false, false, false, false] },
                ]]
              : []),
            [
              { text: 'TOTAL', alignment: 'right', fontSize: 14, bold: true, color: '#1f2937', border: [false, false, false, false] },
              { text: fmt(invoice.totalAmount), alignment: 'right', fontSize: 14, bold: true, color: '#2563eb', border: [false, false, false, false] },
            ],
            ...(Number(invoice.amountPaid || 0) > 0
              ? [[
                  { text: 'Payé', alignment: 'right', fontSize: 10, color: '#16a34a', border: [false, false, false, false] },
                  { text: fmt(invoice.amountPaid), alignment: 'right', fontSize: 10, color: '#16a34a', border: [false, false, false, false] },
                ]]
              : []),
            ...(Number(invoice.totalAmount) - Number(invoice.amountPaid || 0) > 0 && Number(invoice.amountPaid || 0) > 0
              ? [[
                  { text: 'Reste à payer', alignment: 'right', fontSize: 10, bold: true, color: '#dc2626', border: [false, false, false, false] },
                  { text: fmt(Number(invoice.totalAmount) - Number(invoice.amountPaid || 0)), alignment: 'right', fontSize: 10, bold: true, color: '#dc2626', border: [false, false, false, false] },
                ]]
              : []),
          ],
        },
        margin: [0, 8, 0, 0],
      },

      // Notes & Terms
      ...(invoice.notes
        ? [{ text: 'Notes', fontSize: 10, bold: true, margin: [0, 16, 0, 4] }, { text: invoice.notes, fontSize: 9, color: '#6b7280' }]
        : []),
      ...(invoice.terms
        ? [{ text: 'Conditions', fontSize: 10, bold: true, margin: [0, 12, 0, 4] }, { text: invoice.terms, fontSize: 9, color: '#6b7280' }]
        : []),
    ],

    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 0, 40, 15],
      stack: [
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }],
          margin: [0, 0, 0, 6],
        },
        {
          columns: [
            {
              width: '60%',
              stack: [
                { text: 'Généré par AfriBiz', fontSize: 8, color: '#6b7280', bold: true },
                { text: 'Document officiel - Fait via la plateforme AfriBiz', fontSize: 7.5, color: '#9ca3af' },
              ],
            },
            {
              width: '40%',
              text: 'Page ' + currentPage + ' / ' + pageCount,
              alignment: 'right',
              fontSize: 8,
              color: '#9ca3af',
            },
          ],
        },
      ],
    }),

    styles: {
      tableHeader: { color: '#ffffff', fontSize: 9, bold: true, alignment: 'center' },
    },
  };

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = pdfModule.default.createPdf(docDef);
      pdfDoc.getBuffer((error: any, buffer: Buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(buffer);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ── Rental Contract PDF ──
export async function generateRentalContractPdf(booking: RentalBookingWithDetails): Promise<Buffer> {
  const pdfModule: any = await import('pdfmake');
  const vfsFonts: any = await import('pdfmake/build/vfs_fonts');
  pdfModule.default.vfs = vfsFonts.default || vfsFonts;

  const fmt = (amount: any): string => Number(amount || 0).toLocaleString('fr-FR') + ' FCFA';
  const biz = booking.business;
  const rental = booking.rental;
  const startDate = new Date(booking.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate = booking.endDate
    ? new Date(booking.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Non spécifiée';
  const days = booking.endDate
    ? Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;
  const clientName = booking.client
    ? `${booking.client.firstName} ${booking.client.lastName}`
    : booking.customerName || 'Client';

  const docDef: any = {
    pageSize: 'A4',
    pageMargins: [50, 60, 50, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#374151', lineHeight: 1.4 },
    fonts: FONTS,
    info: {
      title: `Contrat de location - ${rental?.name || ''}`,
      author: biz?.name || 'AfriBiz',
    },
    content: [
      // Header
      {
        columns: [
          {
            width: '60%',
            stack: [
              biz?.logo
                ? { image: biz.logo, width: 100, height: 35, margin: [0, 0, 0, 4] }
                : { text: biz?.name || '', bold: true, fontSize: 16, color: '#1f2937', margin: [0, 0, 0, 4] },
              { text: biz?.address || '', fontSize: 9, color: '#6b7280' },
              ...(biz?.phone ? [{ text: 'Tél: ' + biz.phone, fontSize: 9, color: '#6b7280' }] : []),
              ...(biz?.email ? [{ text: 'Email: ' + biz.email, fontSize: 9, color: '#6b7280' }] : []),
            ].filter(Boolean),
          },
          {
            width: '40%',
            stack: [
              { text: 'CONTRAT DE LOCATION', bold: true, fontSize: 18, color: '#6366f1', alignment: 'right' },
              { text: 'N° ' + (booking.bookingNumber || booking.id.slice(0, 8).toUpperCase()), fontSize: 11, bold: true, alignment: 'right', margin: [0, 4, 0, 2] },
              { text: 'Date: ' + new Date(booking.createdAt).toLocaleDateString('fr-FR'), fontSize: 9, alignment: 'right', color: '#6b7280' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.5, lineColor: '#6366f1' }], margin: [0, 10, 0, 16] },

      // Title
      { text: 'CONTRAT DE LOCATION', alignment: 'center', fontSize: 16, bold: true, color: '#1f2937', margin: [0, 0, 0, 20] },

      // Parties
      { text: 'Entre les soussignés :', fontSize: 10, margin: [0, 0, 0, 8] },
      {
        stack: [
          { text: [
            { text: 'Le Loueur : ', bold: true },
            { text: biz?.name || 'Le Prestataire' },
          ], fontSize: 10, margin: [0, 0, 0, 4] },
          { text: [
            { text: 'Et le Locataire : ', bold: true },
            { text: clientName },
          ], fontSize: 10, margin: [0, 0, 0, 4] },
        ],
        margin: [0, 0, 0, 16],
      },

      // Objet
      { text: 'Objet du contrat', fontSize: 12, bold: true, color: '#6366f1', margin: [0, 0, 0, 8] },
      {
        stack: [
          { text: `Le présent contrat régit la location du bien suivant :`, fontSize: 10, margin: [0, 0, 0, 4] },
          { text: rental?.name || 'Équipement', fontSize: 10, bold: true, margin: [0, 0, 0, 8] },
          ...(rental?.description ? [{ text: rental.description, fontSize: 9, color: '#6b7280', margin: [0, 0, 0, 8] }] : []),
        ],
        margin: [0, 0, 0, 12],
      },

      // Durée
      { text: 'Durée de la location', fontSize: 12, bold: true, color: '#6366f1', margin: [0, 0, 0, 8] },
      {
        ul: [
          { text: [`Date de début : `, { text: startDate, bold: true }], fontSize: 10, margin: [0, 0, 0, 4] },
          { text: [`Date de fin : `, { text: endDate, bold: true }], fontSize: 10, margin: [0, 0, 0, 4] },
          { text: [`Durée : `, { text: `${days} jour${days > 1 ? 's' : ''}`, bold: true }], fontSize: 10, margin: [0, 0, 0, 4] },
        ],
        margin: [0, 0, 0, 12],
      },

      // Prix
      { text: 'Conditions financières', fontSize: 12, bold: true, color: '#6366f1', margin: [0, 0, 0, 8] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Prix unitaire', color: '#6b7280' }, { text: fmt(rental?.price || 0), alignment: 'right', bold: true }],
            [{ text: 'Durée (jours)', color: '#6b7280' }, { text: String(days), alignment: 'right' }],
            [{ text: 'Montant total', color: '#1f2937', bold: true }, { text: fmt(Number(booking.price)), alignment: 'right', bold: true, color: '#6366f1', fontSize: 12 }],
            ...(rental?.deposit
              ? [[{ text: 'Caution', color: '#6b7280' }, { text: fmt(Number(rental.deposit)), alignment: 'right' }]]
              : []),
          ],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 || i === 2 || i === 3 ? 0.5 : 0),
          vLineWidth: () => 0,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 16],
      },

      // Conditions générales
      { text: 'Conditions générales', fontSize: 12, bold: true, color: '#6366f1', margin: [0, 0, 0, 8] },
      {
        ol: [
          { text: 'Le locataire s\'engage à restituer le bien loué dans l\'état où il lui a été remis.', fontSize: 9.5, margin: [0, 0, 0, 4] },
          { text: 'Tout retard de restitution entraînera des frais supplémentaires équivalents au prix journalier.', fontSize: 9.5, margin: [0, 0, 0, 4] },
          { text: 'Le locataire est responsable des dommages causés au bien loué pendant la durée de la location.', fontSize: 9.5, margin: [0, 0, 0, 4] },
          ...(rental?.deposit
            ? [{ text: 'La caution sera restituée dans les 72h suivant la restitution du bien, sous réserve de son bon état.', fontSize: 9.5, margin: [0, 0, 0, 4] }]
            : []),
          { text: 'Le non-respect des conditions peut entraîner la résiliation immédiate du contrat sans remboursement.', fontSize: 9.5, margin: [0, 0, 0, 4] },
          { text: 'Tout litige sera soumis à la juridiction compétente du lieu du siège social du loueur.', fontSize: 9.5, margin: [0, 0, 0, 4] },
        ],
        margin: [0, 0, 0, 20],
      },

      // Signatures
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }], margin: [0, 0, 0, 20] },
      {
        columns: [
          {
            width: '45%',
            stack: [
              { text: 'Le Loueur', bold: true, fontSize: 10, margin: [0, 0, 0, 4] },
              { text: biz?.name || '', fontSize: 9, color: '#6b7280', margin: [0, 0, 0, 20] },
              { text: 'Signature : ___________________', fontSize: 9, color: '#6b7280' },
            ],
          },
          {
            width: '10%',
            text: '',
          },
          {
            width: '45%',
            stack: [
              { text: 'Le Locataire', bold: true, fontSize: 10, margin: [0, 0, 0, 4] },
              { text: clientName, fontSize: 9, color: '#6b7280', margin: [0, 0, 0, 20] },
              { text: 'Signature : ___________________', fontSize: 9, color: '#6b7280' },
            ],
          },
        ],
      },
    ],

    footer: (currentPage: number, pageCount: number) => ({
      margin: [50, 0, 50, 15],
      stack: [
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: '#d1d5db' }],
          margin: [0, 0, 0, 6],
        },
        {
          columns: [
            {
              width: '60%',
              stack: [
                { text: 'Généré par AfriBiz', fontSize: 8, color: '#6b7280', bold: true },
                { text: 'Contrat de location - Document officiel', fontSize: 7.5, color: '#9ca3af' },
              ],
            },
            {
              width: '40%',
              text: 'Page ' + currentPage + ' / ' + pageCount,
              alignment: 'right',
              fontSize: 8,
              color: '#9ca3af',
            },
          ],
        },
      ],
    }),
  };

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = pdfModule.default.createPdf(docDef);
      pdfDoc.getBuffer((error: any, buffer: Buffer) => {
        if (error) reject(error);
        else resolve(buffer);
      });
    } catch (err) {
      reject(err);
    }
  });
}
