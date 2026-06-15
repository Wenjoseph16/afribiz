export interface CountryCode {
  code: string;
  dial: string;
  name: string;
  flag: string;
  priority: number;
}

export const countryCodes: CountryCode[] = [
  // === African countries (prioritized) ===
  { code: 'TG', dial: '+228', name: 'Togo', flag: '🇹🇬', priority: 1 },
  { code: 'BJ', dial: '+229', name: 'Bénin', flag: '🇧🇯', priority: 1 },
  { code: 'SN', dial: '+221', name: 'Sénégal', flag: '🇸🇳', priority: 1 },
  { code: 'CI', dial: '+225', name: "Côte d'Ivoire", flag: '🇨🇮', priority: 1 },
  { code: 'GH', dial: '+233', name: 'Ghana', flag: '🇬🇭', priority: 1 },
  { code: 'NG', dial: '+234', name: 'Nigeria', flag: '🇳🇬', priority: 1 },
  { code: 'BF', dial: '+226', name: 'Burkina Faso', flag: '🇧🇫', priority: 1 },
  { code: 'ML', dial: '+223', name: 'Mali', flag: '🇲🇱', priority: 1 },
  { code: 'NE', dial: '+227', name: 'Niger', flag: '🇳🇪', priority: 1 },
  { code: 'GN', dial: '+224', name: 'Guinée', flag: '🇬🇳', priority: 1 },
  { code: 'CM', dial: '+237', name: 'Cameroun', flag: '🇨🇲', priority: 2 },
  { code: 'CD', dial: '+243', name: 'RDC', flag: '🇨🇩', priority: 2 },
  { code: 'KE', dial: '+254', name: 'Kenya', flag: '🇰🇪', priority: 2 },
  { code: 'ET', dial: '+251', name: 'Éthiopie', flag: '🇪🇹', priority: 2 },
  { code: 'ZA', dial: '+27', name: 'Afrique du Sud', flag: '🇿🇦', priority: 2 },
  { code: 'MA', dial: '+212', name: 'Maroc', flag: '🇲🇦', priority: 2 },
  { code: 'DZ', dial: '+213', name: 'Algérie', flag: '🇩🇿', priority: 2 },
  { code: 'TN', dial: '+216', name: 'Tunisie', flag: '🇹🇳', priority: 2 },
  { code: 'EG', dial: '+20', name: 'Égypte', flag: '🇪🇬', priority: 2 },
  { code: 'AO', dial: '+244', name: 'Angola', flag: '🇦🇴', priority: 2 },
  { code: 'MZ', dial: '+258', name: 'Mozambique', flag: '🇲🇿', priority: 2 },
  { code: 'MG', dial: '+261', name: 'Madagascar', flag: '🇲🇬', priority: 2 },
  { code: 'RW', dial: '+250', name: 'Rwanda', flag: '🇷🇼', priority: 2 },
  { code: 'UG', dial: '+256', name: 'Ouganda', flag: '🇺🇬', priority: 2 },
  { code: 'TZ', dial: '+255', name: 'Tanzanie', flag: '🇹🇿', priority: 2 },
  { code: 'ZM', dial: '+260', name: 'Zambie', flag: '🇿🇲', priority: 2 },
  { code: 'ZW', dial: '+263', name: 'Zimbabwe', flag: '🇿🇼', priority: 2 },
  { code: 'MW', dial: '+265', name: 'Malawi', flag: '🇲🇼', priority: 2 },
  { code: 'SL', dial: '+232', name: 'Sierra Leone', flag: '🇸🇱', priority: 2 },
  { code: 'LR', dial: '+231', name: 'Libéria', flag: '🇱🇷', priority: 2 },
  { code: 'CF', dial: '+236', name: 'Centrafrique', flag: '🇨🇫', priority: 2 },
  { code: 'GA', dial: '+241', name: 'Gabon', flag: '🇬🇦', priority: 2 },
  { code: 'CG', dial: '+242', name: 'Congo', flag: '🇨🇬', priority: 2 },
  { code: 'GQ', dial: '+240', name: 'Guinée Équatoriale', flag: '🇬🇶', priority: 2 },
  { code: 'TD', dial: '+235', name: 'Tchad', flag: '🇹🇩', priority: 2 },
  { code: 'BI', dial: '+257', name: 'Burundi', flag: '🇧🇮', priority: 2 },
  { code: 'SO', dial: '+252', name: 'Somalie', flag: '🇸🇴', priority: 2 },
  { code: 'SS', dial: '+211', name: 'Soudan du Sud', flag: '🇸🇸', priority: 2 },
  { code: 'SD', dial: '+249', name: 'Soudan', flag: '🇸🇩', priority: 2 },
  { code: 'GM', dial: '+220', name: 'Gambie', flag: '🇬🇲', priority: 2 },
  { code: 'GW', dial: '+245', name: 'Guinée-Bissau', flag: '🇬🇼', priority: 2 },
  { code: 'CV', dial: '+238', name: 'Cap-Vert', flag: '🇨🇻', priority: 2 },
  { code: 'ST', dial: '+239', name: 'Sao Tomé', flag: '🇸🇹', priority: 2 },
  { code: 'KM', dial: '+269', name: 'Comores', flag: '🇰🇲', priority: 2 },
  { code: 'SC', dial: '+248', name: 'Seychelles', flag: '🇸🇨', priority: 2 },
  { code: 'MU', dial: '+230', name: 'Maurice', flag: '🇲🇺', priority: 2 },
  { code: 'MR', dial: '+222', name: 'Mauritanie', flag: '🇲🇷', priority: 2 },
  { code: 'DJ', dial: '+253', name: 'Djibouti', flag: '🇩🇯', priority: 2 },
  { code: 'ER', dial: '+291', name: 'Érythrée', flag: '🇪🇷', priority: 2 },
  { code: 'LS', dial: '+266', name: 'Lesotho', flag: '🇱🇸', priority: 2 },
  { code: 'BW', dial: '+267', name: 'Botswana', flag: '🇧🇼', priority: 2 },
  { code: 'NA', dial: '+264', name: 'Namibie', flag: '🇳🇦', priority: 2 },
  { code: 'SZ', dial: '+268', name: 'Eswatini', flag: '🇸🇿', priority: 2 },

  // === International ===
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷', priority: 3 },
  { code: 'BE', dial: '+32', name: 'Belgique', flag: '🇧🇪', priority: 3 },
  { code: 'CH', dial: '+41', name: 'Suisse', flag: '🇨🇭', priority: 3 },
  { code: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦', priority: 3 },
  { code: 'US', dial: '+1', name: 'États-Unis', flag: '🇺🇸', priority: 3 },
  { code: 'GB', dial: '+44', name: 'Royaume-Uni', flag: '🇬🇧', priority: 3 },
  { code: 'DE', dial: '+49', name: 'Allemagne', flag: '🇩🇪', priority: 3 },
  { code: 'IT', dial: '+39', name: 'Italie', flag: '🇮🇹', priority: 3 },
  { code: 'ES', dial: '+34', name: 'Espagne', flag: '🇪🇸', priority: 3 },
  { code: 'PT', dial: '+351', name: 'Portugal', flag: '🇵🇹', priority: 3 },
  { code: 'NL', dial: '+31', name: 'Pays-Bas', flag: '🇳🇱', priority: 3 },
  { code: 'CN', dial: '+86', name: 'Chine', flag: '🇨🇳', priority: 3 },
  { code: 'IN', dial: '+91', name: 'Inde', flag: '🇮🇳', priority: 3 },
  { code: 'JP', dial: '+81', name: 'Japon', flag: '🇯🇵', priority: 3 },
  { code: 'AE', dial: '+971', name: 'Émirats Arabes Unis', flag: '🇦🇪', priority: 3 },
  { code: 'SA', dial: '+966', name: 'Arabie Saoudite', flag: '🇸🇦', priority: 3 },
  { code: 'TR', dial: '+90', name: 'Turquie', flag: '🇹🇷', priority: 3 },
  { code: 'LB', dial: '+961', name: 'Liban', flag: '🇱🇧', priority: 3 },
];

export const sortedCountryCodes = [...countryCodes].sort((a, b) => {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.name.localeCompare(b.name);
});

export const getCountryByDial = (dial: string): CountryCode | undefined => {
  return countryCodes.find((c) => c.dial === dial);
};

export const getCountryByCode = (code: string): CountryCode | undefined => {
  return countryCodes.find((c) => c.code === code);
};
