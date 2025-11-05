import {
  PrismaClient,
  FirmRole,
  ClientStatus,
  EmployeeStatus
} from '@prisma/client';
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

async function seedFirmData(
  firmId: string,
  userId: string,
  hrModuleId: string,
  crmModuleId: string
) {
  console.log('\n🏢 Seeding firm data...');

  // Create sample clients
  const client1 = await prisma.client.create({
    data: {
      firmId,
      name: 'TOUBA GAZ MBAO',
      status: ClientStatus.ACTIVE,
      contactName: 'Moussa Diop',
      contactEmail: 'contact@toubagaz.sn',
      contactPhone: '+221 77 123 45 67',
      address: 'Mbao, Dakar, Sénégal',
      industry: 'Distribution de gaz',
      contractStartDate: new Date('2023-01-01'),
      tags: ['Distribution', 'Énergie']
    }
  });

  const client2 = await prisma.client.create({
    data: {
      firmId,
      name: 'SOCOCIM Industries',
      status: ClientStatus.ACTIVE,
      contactName: 'Fatou Sall',
      contactEmail: 'contact@sococim.sn',
      contactPhone: '+221 77 987 65 43',
      address: 'Rufisque, Dakar, Sénégal',
      industry: 'Cimenterie',
      contractStartDate: new Date('2023-06-01'),
      tags: ['BTP', 'Industrie']
    }
  });

  console.log(`✅ Created ${2} clients`);

  // Create sample departments
  const hrDept = await prisma.department.create({
    data: {
      firmId,
      name: 'Ressources Humaines',
      code: 'RH'
    }
  });

  const opsDept = await prisma.department.create({
    data: {
      firmId,
      name: 'Opérations',
      code: 'OPS'
    }
  });

  console.log(`✅ Created ${2} departments`);

  // Create sample employees with new fields
  const employees = [
    {
      firstName: 'Aminata',
      lastName: 'Diallo',
      matricule: 'EMP-2023-001',
      email: 'aminata.diallo@example.com',
      phone: '+221 77 555 0001',
      dateOfBirth: new Date('1990-05-15'),
      placeOfBirth: 'Dakar',
      maritalStatus: 'MARIE',
      nationality: 'Sénégalaise',
      cni: '1234567890123',
      jobTitle: 'TECHNICIENNE DE SURFACE',
      category: '4EME',
      hireDate: new Date('2023-06-01'),
      contractEndDate: new Date('2025-06-01'),
      status: EmployeeStatus.ACTIVE,
      assignedClientId: client1.id,
      departmentId: opsDept.id
    },
    {
      firstName: 'Mamadou',
      lastName: 'Ndiaye',
      matricule: 'EMP-2023-002',
      email: 'mamadou.ndiaye@example.com',
      phone: '+221 77 555 0002',
      dateOfBirth: new Date('1988-08-22'),
      placeOfBirth: 'Thiès',
      maritalStatus: 'MARIE',
      nationality: 'Sénégalaise',
      cni: '1234567890124',
      jobTitle: 'CHAUFFEUR LIVREUR',
      category: '5EME',
      hireDate: new Date('2023-07-15'),
      contractEndDate: new Date('2025-07-15'),
      status: EmployeeStatus.ACTIVE,
      assignedClientId: client1.id,
      departmentId: opsDept.id
    },
    {
      firstName: 'Fatou',
      lastName: 'Seck',
      matricule: 'EMP-2023-003',
      email: 'fatou.seck@example.com',
      phone: '+221 77 555 0003',
      dateOfBirth: new Date('1992-03-10'),
      placeOfBirth: 'Saint-Louis',
      maritalStatus: 'CELIBATAIRE',
      nationality: 'Sénégalaise',
      cni: '1234567890125',
      jobTitle: 'AGENT DE SECURITE INCENDIE',
      category: '5EME',
      hireDate: new Date('2023-08-01'),
      contractEndDate: new Date('2025-08-01'),
      status: EmployeeStatus.ACTIVE,
      assignedClientId: client2.id,
      departmentId: opsDept.id
    },
    {
      firstName: 'Ousmane',
      lastName: 'Ba',
      matricule: 'EMP-2023-004',
      email: 'ousmane.ba@example.com',
      phone: '+221 77 555 0004',
      dateOfBirth: new Date('1985-11-30'),
      placeOfBirth: 'Kaolack',
      maritalStatus: 'MARIE',
      nationality: 'Sénégalaise',
      cni: '1234567890126',
      jobTitle: 'RECEPTIONNISTE',
      category: '7A',
      hireDate: new Date('2024-01-02'),
      contractEndDate: new Date('2026-01-01'),
      status: EmployeeStatus.ACTIVE,
      assignedClientId: client2.id,
      departmentId: opsDept.id
    },
    {
      firstName: 'Awa',
      lastName: 'Thiam',
      matricule: 'EMP-2023-005',
      email: 'awa.thiam@example.com',
      phone: '+221 77 555 0005',
      dateOfBirth: new Date('1995-07-18'),
      placeOfBirth: 'Ziguinchor',
      maritalStatus: 'CELIBATAIRE',
      nationality: 'Sénégalaise',
      cni: '1234567890127',
      jobTitle: 'LAVEUSE',
      category: '5EME',
      hireDate: new Date('2024-02-01'),
      status: EmployeeStatus.ACTIVE,
      assignedClientId: client1.id,
      departmentId: opsDept.id
    }
  ];

  for (const empData of employees) {
    await prisma.employee.create({
      data: {
        ...empData,
        firmId,
        emergencyContact: {
          name: 'Contact Urgence',
          phone: '+221 77 999 9999',
          relationship: 'Famille'
        }
      }
    });
  }

  console.log(`✅ Created ${employees.length} employees`);

  // Create sample contracts for employees
  const allEmployees = await prisma.employee.findMany({ where: { firmId } });

  for (const emp of allEmployees) {
    if (emp.assignedClientId) {
      await prisma.contract.create({
        data: {
          firmId,
          employeeId: emp.id,
          clientId: emp.assignedClientId,
          type: 'INTERIM',
          startDate: emp.hireDate,
          endDate: emp.contractEndDate,
          position: emp.jobTitle || 'Non spécifié',
          salary: 150000, // 150,000 FCFA
          isActive: true,
          alertThreshold: 30
        }
      });
    }
  }

  console.log(`✅ Created contracts for employees`);
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

  // Create a demo firm
  const firm = await prisma.firm.upsert({
    where: { slug: 'connect-interim' },
    update: {},
    create: {
      slug: 'connect-interim',
      name: 'Connect Interim',
      holdingId: holding.id,
      themeColor: '#3b82f6'
    }
  });

  console.log('✅ Created firm:', firm.name);

  // Assign user to firm as OWNER
  await prisma.userFirm.upsert({
    where: {
      userId_firmId: {
        userId: user.id,
        firmId: firm.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      firmId: firm.id,
      role: FirmRole.OWNER
    }
  });

  console.log('✅ Assigned user to firm as OWNER');

  // Install modules for the firm
  await prisma.firmModule.upsert({
    where: {
      firmId_moduleId: {
        firmId: firm.id,
        moduleId: hrModule.id
      }
    },
    update: {},
    create: {
      firmId: firm.id,
      moduleId: hrModule.id,
      isEnabled: true,
      installedBy: user.id
    }
  });

  await prisma.firmModule.upsert({
    where: {
      firmId_moduleId: {
        firmId: firm.id,
        moduleId: crmModule.id
      }
    },
    update: {},
    create: {
      firmId: firm.id,
      moduleId: crmModule.id,
      isEnabled: true,
      installedBy: user.id
    }
  });

  console.log('✅ Installed HR and CRM modules for firm');

  // Seed firm data
  await seedFirmData(firm.id, user.id, hrModule.id, crmModule.id);

  console.log('\n📝 Login credentials:');
  console.log('   Email: flanpaul19@gmail.com');
  console.log('   Password: password123!');
  console.log('\n🌐 Access your firm at:');
  console.log('   http://localhost:3000/connect-interim/dashboard/overview');
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
