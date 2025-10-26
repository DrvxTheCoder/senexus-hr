const { execSync } = require('child_process');

try {
  console.log('Starting migration...');

  // Run migration with environment configured for non-interactive mode
  execSync(
    'npx prisma migrate dev --name enhanced_hr_module_implementation --skip-generate',
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_MIGRATE_SKIP_SEED: '1'
      },
      input: 'y\n' // Auto-confirm prompts
    }
  );

  console.log('\nMigration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
