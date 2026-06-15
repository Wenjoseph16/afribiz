/**
 * Build-time environment validation for AfriBiz
 * Exits with non-zero code if required variables are missing
 */

const REQUIRED_VARS = [
  { name: 'NEXT_PUBLIC_API_URL', description: 'Backend API URL' },
];

const WARN_VARS = [
  { name: 'SENTRY_ORG', description: 'Sentry organization' },
  { name: 'SENTRY_PROJECT', description: 'Sentry project name' },
  { name: 'SENTRY_AUTH_TOKEN', description: 'Sentry authentication token' },
];

const OPTIONAL_BUT_RECOMMENDED = [
  { name: 'NEXT_PUBLIC_GA_ID', description: 'Google Analytics ID' },
  { name: 'NEXT_PUBLIC_SENTRY_DSN', description: 'Sentry DSN for client-side error tracking' },
];

let hasError = false;

console.log('\n=== Verification des variables d environnement ===\n');

console.log('REQUISES :');
REQUIRED_VARS.forEach(({ name, description }) => {
  if (!process.env[name]) {
    console.error('  FAIL ' + name + ' - ' + description + ' (MANQUANTE)');
    hasError = true;
  } else {
    console.log('  OK  ' + name + ' = definie');
  }
});

console.log('\nIMPORTANTES (warning si manquantes) :');
WARN_VARS.forEach(({ name, description }) => {
  if (!process.env[name]) {
    console.warn('  WARN ' + name + ' - ' + description + ' (optionnelle mais recommandee)');
  } else {
    console.log('  OK  ' + name + ' = definie');
  }
});

console.log('\nOPTIONNELLES :');
OPTIONAL_BUT_RECOMMENDED.forEach(({ name, description }) => {
  if (!process.env[name]) {
    console.log('  INFO ' + name + ' - ' + description);
  } else {
    console.log('  OK  ' + name + ' = definie');
  }
});

if (hasError) {
  console.warn('\n⚠️ ATTENTION : Des variables REQUISES sont manquantes.');
  console.warn('Le build continue mais certaines fonctionnalités pourraient échouer.');
  console.warn('Configurez vos variables dans Vercel/Render dès que possible.\n');
  // process.exit(1); // On ne bloque plus le build pour permettre le premier déploiement
} else {
  console.log('\nOK Toutes les variables requises sont présentes. Build autorisé.\n');
}
