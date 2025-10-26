const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  try {
    console.log('🔄 Testing database connection...');
    console.log(
      'DATABASE_URL:',
      process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')
    );

    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);

    await prisma.$disconnect();
    console.log('✅ Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
