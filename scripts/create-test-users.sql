-- Script SQL pour créer des comptes de test
-- Les mots de passe sont hashés avec bcrypt (salt rounds: 10)
-- Mot de passe en clair: password123

-- Supprimer les utilisateurs de test s'ils existent déjà
DELETE FROM users WHERE email IN ('user@test.com', 'admin@test.com', 'superadmin@test.com');

-- Insérer l'utilisateur simple
INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  'user@test.com',
  '$2b$10$rYVZ5qJ8xQZ8QZ8QZ8QZ8uQZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q',  -- password123
  'Utilisateur Test',
  'user',
  1,
  NOW(),
  NOW()
);

-- Insérer l'admin
INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  'admin@test.com',
  '$2b$10$rYVZ5qJ8xQZ8QZ8QZ8QZ8uQZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q',  -- password123
  'Admin Test',
  'admin',
  1,
  NOW(),
  NOW()
);

-- Insérer le super admin
INSERT INTO users (email, password, name, role, isActive, createdAt, updatedAt)
VALUES (
  'superadmin@test.com',
  '$2b$10$rYVZ5qJ8xQZ8QZ8QZ8QZ8uQZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8QZ8Q',  -- password123
  'Super Admin Test',
  'super_admin',
  1,
  NOW(),
  NOW()
);

-- Note: Les hash de mot de passe ci-dessus sont des exemples
-- Pour générer un vrai hash bcrypt de 'password123', exécutez dans Node.js:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('password123', 10).then(console.log);
