// Script to apply Mailgun settings migration for the IgniteLabs platform
// This script ensures that the default tenant and Mailgun settings exist in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default values to use if environment variables are not set
const DEFAULT_MAILGUN_API_KEY = '872c82496e25abc065b205088cfe05d4-623424ea-e221cf12';
const DEFAULT_MAILGUN_DOMAIN = 'mg.codevel.com';
const DEFAULT_MAILGUN_FROM = 'Ignite Labs <no-reply@mg.codevel.com>';

async function applyMigration() {
  console.log('⚙️ Starting Mailgun settings migration...\n');
  
  try {
    // Step 1: Check if tenant exists, create if needed
    console.log('Step 1: Checking for default tenant...');
    let tenant = await prisma.tenants.findUnique({
      where: { id: 1 }
    });
    
    if (!tenant) {
      console.log('  Creating default tenant...');
      tenant = await prisma.tenants.create({
        data: {
          id: 1,
          name: 'Ignite Labs',
          subdomain: 'ignitelabs',
          active: true
        }
      });
      console.log('  ✅ Default tenant created successfully!');
    } else {
      console.log(`  ✅ Default tenant found: ${tenant.name}`);
    }
    
    // Step 2: Update Mailgun settings
    console.log('\nStep 2: Adding/updating Mailgun settings...');
    
    // Use environment variables if available, otherwise use defaults
    const apiKey = process.env.MAILGUN_API_KEY || DEFAULT_MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN || DEFAULT_MAILGUN_DOMAIN;
    const from = process.env.MAILGUN_FROM || DEFAULT_MAILGUN_FROM;
    
    console.log(`  Using API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`  Using Domain: ${domain}`);
    console.log(`  Using From: ${from}`);
    
    // Update or create API key setting
    const apiKeySetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_api_key'
      }
    });
    
    if (apiKeySetting) {
      await prisma.settings.update({
        where: { id: apiKeySetting.id },
        data: { value: apiKey }
      });
      console.log('  ✅ API key setting updated');
    } else {
      await prisma.settings.create({
        data: {
          tenant_id: 1,
          key: 'mailgun_api_key',
          value: apiKey
        }
      });
      console.log('  ✅ API key setting created');
    }
    
    // Update or create domain setting
    const domainSetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_domain'
      }
    });
    
    if (domainSetting) {
      await prisma.settings.update({
        where: { id: domainSetting.id },
        data: { value: domain }
      });
      console.log('  ✅ Domain setting updated');
    } else {
      await prisma.settings.create({
        data: {
          tenant_id: 1,
          key: 'mailgun_domain',
          value: domain
        }
      });
      console.log('  ✅ Domain setting created');
    }
    
    // Update or create from setting
    const fromSetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_from'
      }
    });
    
    if (fromSetting) {
      await prisma.settings.update({
        where: { id: fromSetting.id },
        data: { value: from }
      });
      console.log('  ✅ From setting updated');
    } else {
      await prisma.settings.create({
        data: {
          tenant_id: 1,
          key: 'mailgun_from',
          value: from
        }
      });
      console.log('  ✅ From setting created');
    }
    
    // Step 3: Ensure email notification settings exist
    console.log('\nStep 3: Ensuring email notification settings exist...');
    
    const emailSettings = [
      { key: 'email_notifications_enabled', value: 'true' },
      { key: 'email_student_registration', value: 'true' },
      { key: 'email_payment_receipt', value: 'true' },
      { key: 'email_payment_reminder', value: 'true' },
      { key: 'email_batch_start_reminder', value: 'true' },
      { key: 'email_new_lead_notification', value: 'true' }
    ];
    
    for (const setting of emailSettings) {
      const existingSetting = await prisma.settings.findFirst({
        where: {
          tenant_id: 1,
          key: setting.key
        }
      });
      
      if (existingSetting) {
        console.log(`  - ${setting.key}: already exists`);
      } else {
        await prisma.settings.create({
          data: {
            tenant_id: 1,
            key: setting.key,
            value: setting.value
          }
        });
        console.log(`  - ${setting.key}: created`);
      }
    }
    
    // Step 4: Verify all settings are correctly stored
    console.log('\nStep 4: Verifying settings...');
    
    const allSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          startsWith: 'mailgun_'
        }
      }
    });
    
    console.log(`  Found ${allSettings.length} Mailgun settings:`);
    allSettings.forEach(setting => {
      const value = setting.key === 'mailgun_api_key' 
        ? `${setting.value.substring(0, 10)}...` 
        : setting.value;
      console.log(`  - ${setting.key}: ${value}`);
    });
    
    console.log('\n🎉 Mailgun settings migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error applying Mailgun settings migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration();