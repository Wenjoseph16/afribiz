import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

type UssdMenuItem = {
  id: string;
  label: string;
  action?: string;
  children?: UssdMenuItem[];
};

const DEFAULT_MENU: UssdMenuItem[] = [
  {
    id: '1',
    label: 'Consulter mon solde',
    action: 'BALANCE',
  },
  {
    id: '2',
    label: 'Mes commandes',
    children: [
      { id: '2.1', label: 'Dernière commande', action: 'LAST_ORDER' },
      { id: '2.2', label: 'Historique', action: 'ORDER_HISTORY' },
    ],
  },
  {
    id: '3',
    label: 'Produits',
    children: [
      { id: '3.1', label: 'Rechercher un produit', action: 'SEARCH_PRODUCT' },
      { id: '3.2', label: 'Promotions', action: 'PROMOTIONS' },
    ],
  },
  {
    id: '4',
    label: 'Support',
    action: 'SUPPORT',
  },
];

function renderMenu(items: UssdMenuItem[], title: string = 'Menu principal'): string {
  let output = `CON ${title}\n`;
  items.forEach((item, index) => {
    output += `${index + 1}. ${item.label}\n`;
  });
  output += '0. Quitter';
  return output;
}

export async function handleUssdSession(phoneNumber: string, text: string): Promise<string> {
  try {
    if (!text || text === '') {
      const session = await prisma.whatsAppSession.findFirst({
        where: { clientPhone: phoneNumber },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (session) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { lastMessageAt: new Date() },
        });
      }

      return renderMenu(DEFAULT_MENU);
    }

    const parts = text.split('*');
    const currentInput = parts[parts.length - 1];
    const input = parseInt(currentInput, 10);

    if (isNaN(input)) {
      return 'CON Entrée invalide. Veuillez réessayer.\n0. Retour';
    }

    if (input === 0) {
      return "END Merci d'avoir utilisé AfriBiz. À bientôt !";
    }

    let currentMenu: UssdMenuItem[] = DEFAULT_MENU;

    for (let i = 0; i < parts.length - 1; i++) {
      const idx = parseInt(parts[i], 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= currentMenu.length) {
        return 'CON Option invalide.\n0. Retour';
      }
      const selected = currentMenu[idx];
      if (selected.children) {
        currentMenu = selected.children;
      } else {
        return handleAction(selected.action || '');
      }
    }

    const selectedIdx = input - 1;
    if (selectedIdx < 0 || selectedIdx >= currentMenu.length) {
      return 'CON Option invalide.\n0. Retour';
    }

    const selected = currentMenu[selectedIdx];
    if (selected.children) {
      return renderMenu(selected.children, selected.label);
    }

    return handleAction(selected.action || '');
  } catch (err) {
    logger.error('USSD error:', err);
    return 'END Une erreur est survenue. Veuillez réessayer plus tard.';
  }
}

function handleAction(action: string): string {
  switch (action) {
    case 'BALANCE':
      return 'END Votre solde actuel est de 0 FCFA.\nMerci de votre confiance.';
    case 'LAST_ORDER':
      return 'END Votre dernière commande: #N/A\nAucune commande récente.';
    case 'ORDER_HISTORY':
      return 'END Historique des commandes:\n- Aucune commande\nMerci de votre confiance.';
    case 'SEARCH_PRODUCT':
      return 'CON Entrez le nom du produit à rechercher:\n0. Retour';
    case 'PROMOTIONS':
      return 'END Promotions en cours:\n- Aucune promotion active actuellement.\nMerci de votre confiance.';
    case 'SUPPORT':
      return 'END Contactez notre support:\nTél: +225 00 00 00 00\nEmail: support@afribiz.com\nNous vous répondrons dans les plus brefs délais.';
    default:
      return 'END Action non reconnue. Merci de votre confiance.';
  }
}
