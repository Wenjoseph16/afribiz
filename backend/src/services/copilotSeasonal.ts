export interface SeasonalEvent {
  name: string;
  date: string; // MM-DD format
  countries: string[];
  type: 'religious' | 'national' | 'commercial' | 'school';
  suggestions: string[];
}

interface SeasonalOpportunity {
  event: string;
  eventDate: string;
  daysUntil: number;
  type: string;
  suggestion: string;
  action?: string;
}

interface SeasonalResult {
  businessId: string;
  opportunities: SeasonalOpportunity[];
}

const WEST_AFRICAN_CALENDAR: SeasonalEvent[] = [
  {
    name: 'Tabaski (Aïd el-Kébir)',
    date: '06-07',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'religious',
    suggestions: [
      'Proposez des offres spéciales pour les préparatifs de Tabaski',
      'Mettez en avant vos produits saisonniers (habits, accessoires, alimentation)',
      'Créez des packs familiaux pour les célébrations',
    ],
  },
  {
    name: 'Korité (Aïd el-Fitr)',
    date: '03-30',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'religious',
    suggestions: [
      'Préparez des promotions pour la fin du Ramadan',
      'Suggestions de cadeaux et articles de fête',
      'Offres spéciales vêtements et accessoires',
    ],
  },
  {
    name: 'Ramadan (début)',
    date: '02-28',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'religious',
    suggestions: [
      "Adaptez vos horaires d'ouverture pour le Ramadan",
      'Proposez des offres spéciales iftar et suhur',
      'Communiquez sur vos services de livraison en soirée',
    ],
  },
  {
    name: 'Noël',
    date: '12-25',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'religious',
    suggestions: [
      "Lancez vos promotions de fin d'année",
      'Proposez des coffrets cadeaux',
      'Décorez votre profil et vos vitrines',
    ],
  },
  {
    name: 'Nouvel An',
    date: '01-01',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'commercial',
    suggestions: [
      'Offres spécial Nouvel An — réveillon et célébrations',
      'Pack événementiel pour les fêtes',
      'Promotions de janvier',
    ],
  },
  {
    name: 'Rentrée scolaire',
    date: '09-15',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'school',
    suggestions: [
      'Préparez vos offres rentrée des classes',
      'Fournitures scolaires, uniformes, cartables',
      'Réductions spéciales pour les étudiants',
    ],
  },
  {
    name: 'Saint-Valentin',
    date: '02-14',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'commercial',
    suggestions: [
      'Créez des offres spéciales duo / couple',
      'Mettez en avant vos services de livraison de cadeaux',
      'Promotions spéciales restaurants et hébergements',
    ],
  },
  {
    name: 'Fête des Mères',
    date: '05-25',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'commercial',
    suggestions: [
      'Idées cadeaux pour la fête des mères',
      'Offres spéciales bien-être et beauté',
      'Packs famille',
    ],
  },
  {
    name: "Vacances d'été",
    date: '07-01',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'school',
    suggestions: [
      'Promotions spéciales vacances',
      'Offres de voyage et hébergement',
      'Activités et divertissements saisonniers',
    ],
  },
  {
    name: 'Fête nationale du Sénégal',
    date: '04-04',
    countries: ['SN'],
    type: 'national',
    suggestions: [
      "Offres spéciales Fête de l'Indépendance",
      'Promotions patriotiques',
      'Événements et rassemblements',
    ],
  },
  {
    name: "Fête nationale de la Côte d'Ivoire",
    date: '08-07',
    countries: ['CI'],
    type: 'national',
    suggestions: [
      "Célébrez l'indépendance avec des offres spéciales",
      'Promotions et événements locaux',
    ],
  },
  {
    name: 'Fête nationale du Bénin',
    date: '08-01',
    countries: ['BJ'],
    type: 'national',
    suggestions: ["Offres spéciales Fête de l'Indépendance", 'Valorisez vos produits locaux'],
  },
  {
    name: 'Black Friday / Cyber Monday',
    date: '11-28',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'commercial',
    suggestions: [
      "Préparez vos plus grosses réductions de l'année",
      'Campagne marketing avant le jour J',
      'Offres flash limitées dans le temps',
    ],
  },
  {
    name: 'Fête de la Tabaski (variante 2)',
    date: '06-28',
    countries: ['SN', 'CI', 'BJ', 'ML', 'GN', 'BF', 'NE', 'TG'],
    type: 'religious',
    suggestions: [
      'Dernière ligne droite pour les préparatifs',
      'Offres de dernière minute',
      'Service de livraison express pour les achats',
    ],
  },
];

export async function getSeasonalOpportunities(
  businessId: string,
  businessType: string
): Promise<SeasonalResult> {
  const now = new Date();

  const typeSuggestions: Record<string, string[]> = {
    RESTAURANT: [
      "Créez un menu spécial pour l'occasion",
      'Offrez un dessert ou une entrée gratuite',
      'Proposez un menu dégustation',
    ],
    RETAIL: [
      'Remises saisonnières sur vos meilleures ventes',
      'Mettez en avant vos articles de saison',
      'Créez des packs cadeaux',
    ],
    SERVICE: [
      'Offres de lancement pour la saison',
      'Tarifs préférentiels pour les réservations anticipées',
      'Pack découverte',
    ],
    HOSPITALITY: [
      'Offres spéciales séjour',
      'Réductions pour réservations de groupe',
      'Pack découverte locale',
    ],
  };

  const businessSuggestions = typeSuggestions[businessType] || [
    "Créez une promotion spéciale pour l'occasion",
    'Communiquez sur vos réseaux sociaux',
    'Préparez vos stocks et vos équipes',
  ];

  const opportunities: SeasonalOpportunity[] = [];

  for (const event of WEST_AFRICAN_CALENDAR) {
    const [month, day] = event.date.split('-').map(Number);
    const eventDate = new Date(now.getFullYear(), month - 1, day);
    const daysUntil = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < -7 || daysUntil > 45) continue;

    const suggestion =
      event.suggestions.length > 0
        ? event.suggestions[Math.floor(Math.random() * event.suggestions.length)]
        : businessSuggestions[Math.floor(Math.random() * businessSuggestions.length)];

    let action: string | undefined;
    if (daysUntil <= 0) {
      action = `C'est aujourd'hui ! ${suggestion}`;
    } else if (daysUntil <= 3) {
      action = `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''} — ${suggestion}`;
    } else if (daysUntil <= 14) {
      action = `Préparez-vous ! Dans ${daysUntil} jours — ${suggestion}`;
    } else {
      action = `${suggestion} (dans ${daysUntil} jours)`;
    }

    opportunities.push({
      event: event.name,
      eventDate: event.date,
      daysUntil,
      type: event.type,
      suggestion,
      action,
    });
  }

  opportunities.sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    businessId,
    opportunities: opportunities.slice(0, 5),
  };
}
