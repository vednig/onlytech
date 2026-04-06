import { execSync } from 'child_process';

console.log('Setting up OnlyTech.boo database...\n');

try {
  console.log('[1/3] Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n[2/3] Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('\n[3/3] Seeding database with sample incidents...');
  execSync('node scripts/seed.js', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup complete! Your OnlyTech.boo instance is ready.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}
