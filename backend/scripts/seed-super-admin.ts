import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/auth/entities/user.entity';

async function seedSuperAdmin() {
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

    // Vérifier si le super admin existe déjà
    const existingAdmin = await userRepository.findOne({
      where: { email: 'superadmin@gsp.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Le super admin existe déjà. Mise à jour du mot de passe...');
      const hashedPassword = await bcrypt.hash('GPS@2025', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'super_admin';
      existingAdmin.name = 'Super Admin';
      existingAdmin.isActive = true;
      await userRepository.save(existingAdmin);
      console.log('✅ Super admin mis à jour avec succès');
    } else {
      // Créer le super admin
      const hashedPassword = await bcrypt.hash('GPS@2025', 10);
      const superAdmin = userRepository.create({
        email: 'superadmin@gsp.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
      });

      await userRepository.save(superAdmin);
      console.log('✅ Super admin créé avec succès');
    }

    console.log('\n📋 Informations de connexion:');
    console.log('   Email: superadmin@gsp.com');
    console.log('   Mot de passe: GPS@2025');
    console.log('   Rôle: super_admin\n');

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

seedSuperAdmin();

