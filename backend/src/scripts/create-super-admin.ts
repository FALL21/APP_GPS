import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';

async function createSuperAdmin() {
  // Configuration de la connexion à la base de données
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'gpspassword',
    database: process.env.DB_DATABASE || 'gps_tracking',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connexion à la base de données établie');

    const userRepository = dataSource.getRepository(User);

    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await userRepository.findOne({
      where: { role: 'super_admin' },
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Un super admin existe déjà:', existingSuperAdmin.email);
      console.log('   Pour créer un nouveau super admin, utilisez l\'interface web ou modifiez directement la base de données.');
      await dataSource.destroy();
      return;
    }

    // Informations du super admin
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@prodis-gps.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.SUPER_ADMIN_NAME || 'Super Administrateur';

    // Vérifier si l'email existe déjà
    const existingUser = await userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  L'utilisateur ${email} existe déjà. Mise à jour du rôle en super_admin...`);
      existingUser.role = 'super_admin';
      await userRepository.save(existingUser);
      console.log(`✅ Utilisateur ${email} mis à jour en super_admin`);
    } else {
      // Créer le super admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const superAdmin = userRepository.create({
        email,
        password: hashedPassword,
        name,
        role: 'super_admin',
        isActive: true,
      });

      await userRepository.save(superAdmin);
      console.log('✅ Super admin créé avec succès!');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: ${password}`);
      console.log(`   Nom: ${name}`);
    }

    await dataSource.destroy();
    console.log('✅ Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Exécuter le script
createSuperAdmin();

