import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  console.log('\n📝 Login credentials:');
  console.log('   Email: flanpaul19@gmail.com');
  console.log('   Password: password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
