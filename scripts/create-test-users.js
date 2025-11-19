// Script Node.js pour créer des comptes de test
// Usage: node scripts/create-test-users.js

const bcrypt = require('bcrypt');

async function generateHashes() {
  console.log('🔨 Génération des hash de mots de passe...\n');
  
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log(`Mot de passe: ${password}`);
  console.log(`Hash: ${hash}\n`);
  console.log('SQL à exécuter:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const users = [
    { email: 'user@test.com', name: 'Utilisateur Test', role: 'user' },
    { email: 'admin@test.com', name: 'Admin Test', role: 'admin' },
    { email: 'superadmin@test.com', name: 'Super Admin Test', role: 'super_admin' },
  ];

  users.forEach((user) => {
    console.log(`
INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  '${user.email}',
  '${hash}',
  '${user.name}',
  '${user.role}',
  1,
  NOW(),
  NOW()
);`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

generateHashes().catch(console.error);
