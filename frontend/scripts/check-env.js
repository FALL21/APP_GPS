#!/usr/bin/env node

// Script pour vérifier que les variables d'environnement sont définies avant le build
const requiredVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
];

const missingVars = [];
const localhostVars = [];

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
  } else if (value.includes('localhost') && process.env.NODE_ENV === 'production') {
    localhostVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n⚠️  Ces variables doivent être définies dans Railway avant le build!');
  process.exit(1);
}

if (localhostVars.length > 0) {
  console.warn('⚠️  Variables pointant vers localhost en production:');
  localhostVars.forEach((varName) => {
    console.warn(`   - ${varName} = ${process.env[varName]}`);
  });
  console.warn('\n⚠️  Ces variables doivent pointer vers les URLs Railway en production!');
}

console.log('✅ Variables d\'environnement vérifiées:');
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  // Masquer les valeurs sensibles
  const displayValue = value && value.length > 50 ? value.substring(0, 50) + '...' : value;
  console.log(`   - ${varName} = ${displayValue}`);
});

