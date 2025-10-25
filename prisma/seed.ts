import { PrismaClient, FirmRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedModules() {
  console.log('\n📦 Seeding modules...');

  // HR Module - System module (auto-installed for all firms)
  const hrModule = await prisma.module.upsert({
    where: { slug: 'hr' },
    update: {
      name: 'Ressources Humaines',
      description: 'Gestion des employés, départements, congés et missions',
      version: '1.0.0',
      icon: 'Users',
      basePath: '/hr',
      isSystem: true,
      isActive: true,
      metadata: {
        color: '#3b82f6',
        category: 'Operations',
        permissions: ['OWNER', 'ADMIN', 'MANAGER']
      }
    },
    create: {
      slug: 'hr',
      name: 'Ressources Humaines',
      description: 'Gestion des employés, départements, congés et missions',
      version: '1.0.0',
      icon: 'Users',
      basePath: '/hr',
      isSystem: true,
      isActive: true,
      metadata: {
        color: '#3b82f6',
        category: 'Operations',
        permissions: ['OWNER', 'ADMIN', 'MANAGER']
      }
    }
  });

  console.log('✅ Created module:', hrModule.name);

  // CRM Module - Optional module
  const crmModule = await prisma.module.upsert({
    where: { slug: 'crm' },
    update: {
      name: 'CRM',
      description: 'Gestion de la relation client',
      version: '1.0.0',
      icon: 'Users',
      basePath: '/crm',
      isSystem: false,
      isActive: true,
      metadata: {
        color: '#10b981',
        category: 'Sales',
        permissions: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF']
      }
    },
    create: {
      slug: 'crm',
      name: 'CRM',
      description: 'Gestion de la relation client',
      version: '1.0.0',
      icon: 'Users',
      basePath: '/crm',
      isSystem: false,
      isActive: true,
      metadata: {
        color: '#10b981',
        category: 'Sales',
        permissions: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF']
      }
    }
  });

  console.log('✅ Created module:', crmModule.name);

  return { hrModule, crmModule };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create Senexus Group holding
  const holding = await prisma.holding.upsert({
    where: { id: 'senexus-group-holding' },
    update: {},
    create: {
      id: 'senexus-group-holding',
      name: 'Senexus Group',
      description: 'Holding principal du groupe Senexus'
    }
  });

  console.log('✅ Created holding:', holding.name);

  // Hash password
  const passwordHash = await bcrypt.hash('password123!', 10);

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'flanpaul19@gmail.com' },
    update: {},
    create: {
      email: 'flanpaul19@gmail.com',
      name: 'Paul Flan',
      passwordHash,
      emailVerified: new Date()
    }
  });

  console.log('✅ Created user:', user.email);

  // Seed modules
  const { hrModule, crmModule } = await seedModules();

  console.log(
    '\n💡 Modules are now available for manual installation per firm'
  );
  console.log('   Use the admin panel to install modules for specific firms');

  console.log('\n📝 Login credentials:');
  console.log('   Email: flanpaul19@gmail.com');
  console.log('   Password: password123!');
  console.log('\n✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
