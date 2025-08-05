#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🗄️  Running database migrations...');

try {
  // Run Prisma migrations
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure we're in production mode
      NODE_ENV: 'production'
    }
  });
  
  console.log('✅ Database migrations completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Seed the database: npm run db:seed:prod');
  console.log('   2. Or call the seed endpoint manually');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check your DATABASE_URL environment variable');
  console.log('   2. Ensure your database is accessible from Vercel');
  console.log('   3. Verify your database credentials');
  process.exit(1);
} 