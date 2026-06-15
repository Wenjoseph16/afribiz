'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * WhatsAppShare
 *
 * Composant de partage WhatsApp qui génère un lien wa.me
 * avec un message pré-rempli selon le type de contenu.
 */

type WhatsAppMessageType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_REFUSED'
  | 'ORDER_READY'
  | 'ORDER_SHIPPED'
  | 'PROMOTION'
  | 'PRODUCT_SHARE'
  | 'BUSINESS_SHARE';

interface WhatsAppShareProps {
  phone: string;
  messageType: WhatsAppMessageType;
  params: {
    businessName: string;
    orderNumber?: string;
    totalAmount?: string;
    customerName?: string;
    items?: Array<{ name: string; quantity: number }>;
    reason?: string;
    publicUrl?: string;
  };
  variant?: 'icon' | 'button';
  fullWidth?: boolean;
  className?: string;
}

function buildMessage(type: WhatsAppMessageType, params: WhatsAppShareProps['params']): string {
  const { businessName, orderNumber, totalAmount, customerName, items, reason, publicUrl } = params;

  const itemLines = items && items.length > 0
    ? items.slice(0, 5).map(i => `• ${i.quantity}× ${i.name}`).join('\n') + (items.length > 5 ? `\n… et ${items.length - 5} autres` : '')
    : '';

  switch (type) {
    case 'ORDER_CONFIRMED':
      return `✅ *Commande confirmée - ${businessName}*\n\n`
        + (orderNumber ? `N° ${orderNumber}\n` : '')
        + (customerName ? `Client: ${customerName}\n` : '')
        + (totalAmount ? `Montant: ${totalAmount}\n` : '')
        + (itemLines ? `\n_Articles:_\n${itemLines}\n` : '')
        + '\nMerci pour votre commande 🙏'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'ORDER_REFUSED':
      return `❌ *Commande refusée - ${businessName}*\n\n`
        + (orderNumber ? `N° ${orderNumber}\n` : '')
        + (reason ? `Motif: ${reason}\n\n` : '\n')
        + 'Veuillez nous contacter pour plus d\'informations.'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'ORDER_READY':
      return `📦 *Commande prête - ${businessName}*\n\n`
        + (orderNumber ? `N° ${orderNumber}\n` : '')
        + (customerName ? `Client: ${customerName}\n` : '')
        + '\nVotre commande est prête à être retirée ou livrée ! 🎉'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'ORDER_SHIPPED':
      return `🚚 *Commande expédiée - ${businessName}*\n\n`
        + (orderNumber ? `N° ${orderNumber}\n` : '')
        + (customerName ? `Client: ${customerName}\n` : '')
        + '\nVotre commande est en route ! Suivez-la en temps réel.'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'PROMOTION':
      return `🔥 *Promotion spéciale - ${businessName}* 🔥\n\n`
        + (totalAmount ? `💰 ${totalAmount}\n\n` : '')
        + 'Ne manquez pas cette offre exceptionnelle !\nCommandez dès maintenant 🛍️'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'PRODUCT_SHARE':
      return `🛒 *${businessName}*\n\n`
        + (totalAmount ? `Prix: ${totalAmount}\n\n` : '')
        + 'Découvrez ce produit sur AfriBiz !'
        + (publicUrl ? `\n${publicUrl}` : '');

    case 'BUSINESS_SHARE':
      return `🏪 *${businessName}*\n\n`
        + 'Découvrez mon business sur AfriBiz ! Commandez en ligne, réservez des services et plus encore 🚀'
        + (publicUrl ? `\n${publicUrl}` : '');

    default:
      return `Découvrez ${businessName} sur AfriBiz !${publicUrl ? `\n${publicUrl}` : ''}`;
  }
}

export default function WhatsAppShare({
  phone,
  messageType,
  params,
  variant = 'button',
  fullWidth = false,
  className,
}: WhatsAppShareProps) {
  const handleShare = () => {
    if (!phone) return;
    const message = buildMessage(messageType, params);
    const cleaned = phone.replace(/[+\s\-()]/g, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!phone) return null;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        className={cn(
          'p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 hover:text-emerald-700 border border-emerald-200 dark:border-emerald-800 transition-all hover:scale-105 active:scale-95',
          className
        )}
        title="Partager sur WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      fullWidth={fullWidth}
      onClick={handleShare}
      className={cn(
        'text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30',
        className
      )}
    >
      <MessageCircle className="h-4 w-4 mr-1.5" />
      Partager sur WhatsApp
    </Button>
  );
}
