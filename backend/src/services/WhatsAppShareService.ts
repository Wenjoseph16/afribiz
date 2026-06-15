import { logger } from '../lib/logger';

const WHATSAPP_BASE = 'https://wa.me';

export type WhatsAppMessageType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_REFUSED'
  | 'ORDER_READY'
  | 'ORDER_SHIPPED'
  | 'PROMOTION'
  | 'PRODUCT_SHARE'
  | 'BUSINESS_SHARE';

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/[+\s\-()]/g, '');
  const encoded = encodeURIComponent(message);
  return WHATSAPP_BASE + '/' + cleaned + '?text=' + encoded;
}

export function buildOrderMessage(
  type: WhatsAppMessageType,
  params: {
    businessName: string;
    orderNumber?: string;
    totalAmount?: string;
    customerName?: string;
    items?: Array<{ name: string; quantity: number }>;
    reason?: string;
    publicUrl?: string;
  }
): string {
  const { businessName, orderNumber, totalAmount, customerName, items, reason, publicUrl } = params;

  switch (type) {
    case 'ORDER_CONFIRMED':
      return '✅ *Commande confirmée - ' + businessName + '*\n\n'
        + (orderNumber ? 'N° ' + orderNumber + '\n' : '')
        + (customerName ? 'Client: ' + customerName + '\n' : '')
        + (totalAmount ? 'Montant: ' + totalAmount + '\n' : '')
        + (items && items.length > 0
          ? '\n_Articles:_\n' + items.slice(0, 5).map(i => '• ' + i.quantity + '× ' + i.name).join('\n') + (items.length > 5 ? '\n… et ' + (items.length - 5) + ' autres' : '') + '\n'
          : '')
        + '\nMerci pour votre commande 🙏'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'ORDER_REFUSED':
      return '❌ *Commande refusée - ' + businessName + '*\n\n'
        + (orderNumber ? 'N° ' + orderNumber + '\n' : '')
        + (reason ? 'Motif: ' + reason + '\n\n' : '\n')
        + 'Veuillez nous contacter pour plus d\'informations.'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'ORDER_READY':
      return '📦 *Commande prête - ' + businessName + '*\n\n'
        + (orderNumber ? 'N° ' + orderNumber + '\n' : '')
        + (customerName ? 'Client: ' + customerName + '\n' : '')
        + '\nVotre commande est prête à être retirée ou livrée ! 🎉'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'ORDER_SHIPPED':
      return '🚚 *Commande expédiée - ' + businessName + '*\n\n'
        + (orderNumber ? 'N° ' + orderNumber + '\n' : '')
        + (customerName ? 'Client: ' + customerName + '\n' : '')
        + '\nVotre commande est en route ! Suivez-la en temps réel.'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'PROMOTION':
      return '🔥 *Promotion spéciale - ' + businessName + '* 🔥\n\n'
        + (totalAmount ? '💰 ' + totalAmount + '\n\n' : '')
        + 'Ne manquez pas cette offre exceptionnelle !\n'
        + 'Commandez dès maintenant 🛍️'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'PRODUCT_SHARE':
      return '🛒 *' + businessName + '*\n\n'
        + (totalAmount ? 'Prix: ' + totalAmount + '\n\n' : '')
        + 'Découvrez ce produit sur AfriBiz !'
        + (publicUrl ? '\n' + publicUrl : '');

    case 'BUSINESS_SHARE':
      return '🏪 *' + businessName + '*\n\n'
        + 'Découvrez mon business sur AfriBiz ! Commandez en ligne, réservez des services et plus encore 🚀'
        + (publicUrl ? '\n' + publicUrl : '');

    default:
      return 'Découvrez ' + businessName + ' sur AfriBiz !' + (publicUrl ? '\n' + publicUrl : '');
  }
}

export function generateOrderWhatsAppLink(
  phone: string,
  type: WhatsAppMessageType,
  params: {
    businessName: string;
    orderNumber?: string;
    totalAmount?: string;
    customerName?: string;
    items?: Array<{ name: string; quantity: number }>;
    reason?: string;
    publicUrl?: string;
  }
): string {
  const message = buildOrderMessage(type, params);
  return generateWhatsAppLink(phone, message);
}

export function generateBusinessShareLink(phone: string, businessName: string, publicUrl: string): string {
  return generateWhatsAppLink(
    phone,
    '🏪 *' + businessName + '*\n\nDécouvrez mon business sur AfriBiz ! Commandez en ligne, réservez des services et plus encore 🚀\n' + publicUrl
  );
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string }> {
  const cleaned = phone.replace(/[+\s\-()]/g, '');
  logger.info('[WhatsAppShare] Envoi à ' + cleaned + ': ' + message.substring(0, 80) + '...');
  return { success: true, messageId: 'simulated_' + Date.now() };
}
