// Script to run all migrations for the IgniteLabs project
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Create a new Prisma client just for the migrations
const prisma = new PrismaClient();

async function runAllMigrations() {
  console.log('⚙️ Starting migration process...\n');
  
  try {
    // Get all migration directories
    const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsPath)
      .filter(dir => fs.statSync(path.join(migrationsPath, dir)).isDirectory())
      .sort(); // Sort by timestamp
    
    console.log(`Found ${migrationDirs.length} migrations to run:`);
    migrationDirs.forEach((dir, i) => {
      console.log(`  ${i+1}. ${dir}`);
    });
    console.log('');
    
    // Run each migration in order
    for (const migrationDir of migrationDirs) {
      console.log(`🔄 Running migration: ${migrationDir}`);
      
      const migrationFile = path.join(migrationsPath, migrationDir, 'migration.sql');
      if (!fs.existsSync(migrationFile)) {
        console.warn(`  ⚠️ Migration file not found: ${migrationFile}`);
        continue;
      }
      
      const migrationSql = fs.readFileSync(migrationFile, 'utf8');
      console.log(`  📄 Migration file loaded (${migrationSql.length} bytes)`);
      
      try {
        // Execute the SQL directly
        await prisma.$executeRawUnsafe(migrationSql);
        console.log(`  ✅ Migration ${migrationDir} applied successfully!\n`);
      } catch (error) {
        console.error(`  ❌ Error applying migration ${migrationDir}:`, error);
        throw error; // Re-throw to stop further migrations
      }
    }
    
    // Verify key settings after migrations
    console.log('🔍 Verifying important settings after migrations...');
    
    // Check if default tenant exists
    const tenant = await prisma.tenants.findUnique({
      where: { id: 1 }
    });
    
    console.log(`\nDefault Tenant (ID: 1):`);
    if (tenant) {
      console.log(`✅ Found: ${tenant.name} (${tenant.domain})`);
      console.log(`  Address: ${tenant.address || 'Not set'}`);
      console.log(`  Phone: ${tenant.phone || 'Not set'}`);
      console.log(`  Email: ${tenant.email || 'Not set'}`);
    } else {
      console.error(`❌ Not found! Default tenant was not created.`);
    }
    
    // Check Mailgun settings
    const mailgunSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          in: ['mailgun_api_key', 'mailgun_domain', 'mailgun_from']
        }
      }
    });
    
    console.log(`\nMailgun Settings:`);
    const apiKeySetting = mailgunSettings.find(s => s.key === 'mailgun_api_key');
    const domainSetting = mailgunSettings.find(s => s.key === 'mailgun_domain');
    const fromSetting = mailgunSettings.find(s => s.key === 'mailgun_from');
    
    console.log(`${apiKeySetting ? '✅' : '❌'} API Key: ${apiKeySetting ? 'Found' : 'Not found'}`);
    console.log(`${domainSetting ? '✅' : '❌'} Domain: ${domainSetting ? domainSetting.value : 'Not found'}`);
    console.log(`${fromSetting ? '✅' : '❌'} From: ${fromSetting ? fromSetting.value : 'Not found'}`);
    
    // Check organization settings
    const orgSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          startsWith: 'org_'
        }
      }
    });
    
    console.log(`\nOrganization Settings:`);
    if (orgSettings.length > 0) {
      orgSettings.forEach(setting => {
        console.log(`✅ ${setting.key}: ${setting.value || 'Empty'}`);
      });
    } else {
      console.error(`❌ No organization settings found!`);
    }
    
    // Check default admin user
    const adminUser = await prisma.users.findFirst({
      where: {
        username: 'vvelisoju@gmail.com',
        role: 'admin'
      }
    });
    
    console.log(`\nDefault Admin User:`);
    if (adminUser) {
      console.log(`✅ Found: ${adminUser.name} (${adminUser.email})`);
    } else {
      console.error(`❌ Default admin user not found!`);
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migrations
runAllMigrations();