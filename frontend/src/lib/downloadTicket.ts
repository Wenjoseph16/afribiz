interface TicketData {
  title: string;
  number: string;
  date: string;
  time?: string;
  location?: string;
  businessName?: string;
  qrCodeUrl?: string;
  type: 'event' | 'training';
  seatInfo?: string;
  notes?: string;
}

export function generateTicketHTML(ticket: TicketData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Billet - ${ticket.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
    .ticket { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; width: 100%; overflow: hidden; }
    .ticket-header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 24px; text-align: center; }
    .ticket-header h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .ticket-header p { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
    .ticket-body { padding: 24px; }
    .ticket-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .ticket-row:last-child { border-bottom: none; }
    .ticket-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .ticket-value { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px; }
    .ticket-qr { text-align: center; padding: 24px; border-top: 2px dashed #e5e5e5; }
    .ticket-qr img { width: 150px; height: 150px; }
    .ticket-qr p { font-size: 10px; color: #999; margin-top: 8px; font-family: monospace; }
    .ticket-footer { text-align: center; padding: 16px; background: #fafafa; font-size: 10px; color: #bbb; }
    @media print { body { background: white; padding: 0; } .ticket { box-shadow: none; border: 1px solid #ddd; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <p>${ticket.type === 'event' ? "Billet d'événement" : 'Attestation de formation'}</p>
      <h1>${ticket.title}</h1>
    </div>
    <div class="ticket-body">
      <div class="ticket-row">
        <div><div class="ticket-label">Référence</div><div class="ticket-value">${ticket.number}</div></div>
        <div><div class="ticket-label">Date</div><div class="ticket-value">${ticket.date}</div></div>
      </div>
      ${ticket.time ? `<div class="ticket-row"><div><div class="ticket-label">Horaire</div><div class="ticket-value">${ticket.time}</div></div></div>` : ''}
      ${ticket.location ? `<div class="ticket-row"><div><div class="ticket-label">Lieu</div><div class="ticket-value">${ticket.location}</div></div></div>` : ''}
      ${ticket.businessName ? `<div class="ticket-row"><div><div class="ticket-label">${ticket.type === 'event' ? 'Organisateur' : 'Formateur'}</div><div class="ticket-value">${ticket.businessName}</div></div></div>` : ''}
      ${ticket.seatInfo ? `<div class="ticket-row"><div><div class="ticket-label">Place</div><div class="ticket-value">${ticket.seatInfo}</div></div></div>` : ''}
      ${ticket.notes ? `<div class="ticket-row"><div><div class="ticket-label">Notes</div><div class="ticket-value">${ticket.notes}</div></div></div>` : ''}
    </div>
    ${
      ticket.qrCodeUrl
        ? `
    <div class="ticket-qr">
      <img src="${ticket.qrCodeUrl}" alt="QR Code" />
      <p>Présentez ce billet à l'entrée</p>
    </div>`
        : ''
    }
    <div class="ticket-footer">AfriBiz · ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;
}

export function printTicket(ticket: TicketData): void {
  const html = generateTicketHTML(ticket);
  const printWindow = window.open('', '_blank', 'width=500,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

export function downloadTicketAsHTML(ticket: TicketData): void {
  const html = generateTicketHTML(ticket);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `billet_${ticket.number.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
