// Script to check and validate Mailgun settings in the database
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkMailgunSettings() {
  console.log('⚙️ Checking Mailgun settings...\n');
  
  try {
    // Check if the required settings exist
    const apiKeySetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_api_key'
      }
    });
    
    const domainSetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_domain'
      }
    });
    
    const fromSetting = await prisma.settings.findFirst({
      where: {
        tenant_id: 1,
        key: 'mailgun_from'
      }
    });
    
    // Report findings
    console.log('Mailgun API Key:', apiKeySetting 
      ? `✅ Found (ID: ${apiKeySetting.id}, Value: ${apiKeySetting.value.substring(0, 10)}...)` 
      : '❌ Missing');
      
    console.log('Mailgun Domain:', domainSetting 
      ? `✅ Found (ID: ${domainSetting.id}, Value: ${domainSetting.value})` 
      : '❌ Missing');
      
    console.log('Mailgun From Address:', fromSetting 
      ? `✅ Found (ID: ${fromSetting.id}, Value: ${fromSetting.value})` 
      : '❌ Missing');
    
    // Check email notification settings
    console.log('\nChecking email notification settings...');
    
    const notificationSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          startsWith: 'email_'
        }
      }
    });
    
    if (notificationSettings.length > 0) {
      console.log(`✅ Found ${notificationSettings.length} email notification settings:`);
      notificationSettings.forEach(setting => {
        console.log(`  - ${setting.key}: ${setting.value}`);
      });
    } else {
      console.log('❌ No email notification settings found');
    }
    
    // Validate tenant information
    console.log('\nValidating tenant information...');
    
    const tenant = await prisma.tenants.findUnique({
      where: { id: 1 }
    });
    
    if (tenant) {
      console.log(`✅ Default Tenant Found: ${tenant.name} (ID: ${tenant.id})`);
      console.log(`  Subdomain: ${tenant.subdomain}`);
      console.log(`  Active: ${tenant.active ? 'Yes' : 'No'}`);
      console.log(`  Created: ${tenant.created_at}`);
    } else {
      console.log('❌ Default tenant not found!');
    }
    
    // Check organization settings
    console.log('\nChecking organization settings...');
    
    const orgSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          startsWith: 'organization_'
        }
      }
    });
    
    if (orgSettings.length > 0) {
      console.log(`✅ Found ${orgSettings.length} organization settings:`);
      orgSettings.forEach(setting => {
        console.log(`  - ${setting.key}: ${setting.value}`);
      });
    } else {
      console.log('❌ No organization settings found');
    }
    
    console.log('\n🎉 Mailgun settings check completed!');
    
  } catch (error) {
    console.error('\n❌ Error checking Mailgun settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkMailgunSettings();