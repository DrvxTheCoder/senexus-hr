import { db } from './src/lib/db';

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test connection by running a simple query
    const result = await db.$queryRaw`SELECT current_database(), version()`;
    console.log('✅ Database connection successful!');
    console.log('Database info:', result);

    // Check if any tables exist
    const tables = await db.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('\nExisting tables:', tables);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testConnection();
