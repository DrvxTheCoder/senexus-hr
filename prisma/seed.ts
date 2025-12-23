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

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'flanpaul19@gmail.com' },
    update: {
      name: 'Paul Flan',
      passwordHash,
      emailVerified: new Date()
    },
    create: {
      email: 'flanpaul19@gmail.com',
      name: 'Paul Flan',
      passwordHash,
      emailVerified: new Date()
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Seed modules
  const { hrModule, crmModule } = await seedModules();

  // Create demo firms
  const firms = [
    {
      slug: 'connect-interim',
      name: 'Connect Interim',
      themeColor: '#3b82f6'
    },
    {
      slug: 'senexus-consulting',
      name: 'Senexus Consulting',
      themeColor: '#10b981'
    }
  ];

  console.log('\n🏢 Creating firms and assigning admin access...');

  for (const firmData of firms) {
    // Create or update firm
    const firm = await prisma.firm.upsert({
      where: { slug: firmData.slug },
      update: {
        name: firmData.name,
        themeColor: firmData.themeColor
      },
      create: {
        slug: firmData.slug,
        name: firmData.name,
        holdingId: holding.id,
        themeColor: firmData.themeColor
      }
    });

    console.log(`✅ Created firm: ${firm.name}`);

    // Assign admin user to firm as OWNER
    await prisma.userFirm.upsert({
      where: {
        userId_firmId: {
          userId: adminUser.id,
          firmId: firm.id
        }
      },
      update: {
        role: FirmRole.OWNER
      },
      create: {
        userId: adminUser.id,
        firmId: firm.id,
        role: FirmRole.OWNER
      }
    });

    console.log(`✅ Assigned admin to ${firm.name} as OWNER`);

    // Install HR module (system module)
    await prisma.firmModule.upsert({
      where: {
        firmId_moduleId: {
          firmId: firm.id,
          moduleId: hrModule.id
        }
      },
      update: {
        isEnabled: true
      },
      create: {
        firmId: firm.id,
        moduleId: hrModule.id,
        isEnabled: true,
        installedBy: adminUser.id
      }
    });

    // Install CRM module
    await prisma.firmModule.upsert({
      where: {
        firmId_moduleId: {
          firmId: firm.id,
          moduleId: crmModule.id
        }
      },
      update: {
        isEnabled: true
      },
      create: {
        firmId: firm.id,
        moduleId: crmModule.id,
        isEnabled: true,
        installedBy: adminUser.id
      }
    });

    console.log(`✅ Installed modules for ${firm.name}`);
  }

  console.log('\n📝 Login credentials:');
  console.log('   Email: flanpaul19@gmail.com');
  console.log('   Password: password123!');
  console.log('\n🌐 Access your firms at:');
  console.log('   http://localhost:3000/connect-interim/dashboard/overview');
  console.log('   http://localhost:3000/senexus-consulting/dashboard/overview');
  console.log('\n✨ Seeding completed successfully!');
  console.log('✨ Admin has OWNER access to all firms');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
