#!/bin/bash

API_URL="http://localhost:3001"

echo "🔨 Création des comptes de test via l'API..."
echo ""

# Créer l'utilisateur simple via /auth/register
echo "📝 Création de l'utilisateur simple..."
response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "name": "Utilisateur Test"
  }' 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    echo "✅ Utilisateur créé: user@test.com"
    TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    if echo "$body" | grep -q "déjà utilisé"; then
        echo "⚠️  user@test.com existe déjà"
    else
        echo "⚠️  user@test.com: $body"
    fi
    TOKEN=""
fi

echo ""

# Pour créer admin et super_admin, on doit d'abord se connecter en tant que super_admin
# Si aucun super_admin n'existe, on va créer un super_admin directement en base de données
echo "📝 Création des comptes admin et super_admin..."
echo "   (Si un super_admin existe déjà, connectez-vous et créez-les via l'interface)"

# Essayer de se connecter avec superadmin@test.com
login_response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@test.com",
    "password": "password123"
  }' 2>/dev/null)

login_code=$(echo "$login_response" | tail -n1)

if [ "$login_code" = "200" ]; then
    ADMIN_TOKEN=$(echo "$login_response" | sed '$d' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "✅ Super admin existe déjà, utilisation de son token"
else
    echo "⚠️  Aucun super_admin trouvé. Création via script SQL recommandée."
    echo ""
    echo "📋 Pour créer admin et super_admin, exécutez:"
    echo "   docker-compose exec mysql mysql -u gpsuser -pgpspassword gps_tracking"
    echo "   Puis exécutez les commandes SQL du fichier scripts/create-test-users.sql"
    ADMIN_TOKEN=""
fi

if [ -n "$ADMIN_TOKEN" ]; then
    # Créer admin
    echo ""
    echo "📝 Création de l'admin..."
    admin_response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/users" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -d '{
        "email": "admin@test.com",
        "password": "password123",
        "name": "Admin Test",
        "role": "admin"
      }' 2>/dev/null)
    
    admin_code=$(echo "$admin_response" | tail -n1)
    if [ "$admin_code" = "201" ] || [ "$admin_code" = "200" ]; then
        echo "✅ Admin créé: admin@test.com"
    elif echo "$admin_response" | sed '$d' | grep -q "déjà utilisé"; then
        echo "⚠️  admin@test.com existe déjà"
    else
        echo "⚠️  admin@test.com: $(echo "$admin_response" | sed '$d')"
    fi

    # Créer super_admin (seulement si on n'est pas déjà connecté en tant que super_admin)
    if [ "$login_code" != "200" ]; then
        echo ""
        echo "📝 Création du super admin..."
        sa_response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/users" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -d '{
            "email": "superadmin@test.com",
            "password": "password123",
            "name": "Super Admin Test",
            "role": "super_admin"
          }' 2>/dev/null)
        
        sa_code=$(echo "$sa_response" | tail -n1)
        if [ "$sa_code" = "201" ] || [ "$sa_code" = "200" ]; then
            echo "✅ Super admin créé: superadmin@test.com"
        elif echo "$sa_response" | sed '$d' | grep -q "déjà utilisé"; then
            echo "⚠️  superadmin@test.com existe déjà"
        else
            echo "⚠️  superadmin@test.com: $(echo "$sa_response" | sed '$d')"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Comptes de test disponibles:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: user@test.com"
echo "Mot de passe: password123"
echo "Rôle: user"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: admin@test.com"
echo "Mot de passe: password123"
echo "Rôle: admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: superadmin@test.com"
echo "Mot de passe: password123"
echo "Rôle: super_admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
