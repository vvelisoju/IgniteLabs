// Script to check the existence of tenant settings without applying migrations
import { PrismaClient } from '@prisma/client';
// Use generated Prisma client path
import { prisma } from '../server/prisma.js';

async function checkSettings() {
  try {
    console.log('Checking tenant and settings...');
    
    // Check if default tenant exists
    const tenant = await prisma.tenants.findUnique({
      where: { id: 1 }
    });
    
    console.log(`\nDefault Tenant (ID: 1):`);
    if (tenant) {
      console.log(`✓ Found: ${tenant.name} (${tenant.domain})`);
      console.log(`  Address: ${tenant.address || 'Not set'}`);
      console.log(`  Phone: ${tenant.phone || 'Not set'}`);
      console.log(`  Email: ${tenant.email || 'Not set'}`);
    } else {
      console.log(`✗ Not found! Will need to be created.`);
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
    
    console.log(`✓ API Key: ${apiKeySetting ? 'Found' : 'Not found'}`);
    console.log(`✓ Domain: ${domainSetting ? 'Found' : 'Not found'}`);
    console.log(`✓ From: ${fromSetting ? 'Found' : 'Not found'}`);
    
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
        console.log(`✓ ${setting.key}: ${setting.value || 'Empty'}`);
      });
    } else {
      console.log(`✗ No organization settings found! Will need to be created.`);
    }
    
    // Check notification settings
    const notificationSettings = await prisma.settings.findMany({
      where: {
        tenant_id: 1,
        key: {
          startsWith: 'email_'
        }
      }
    });
    
    console.log(`\nEmail Notification Settings:`);
    if (notificationSettings.length > 0) {
      notificationSettings.forEach(setting => {
        console.log(`✓ ${setting.key}: ${setting.value}`);
      });
    } else {
      console.log(`✗ No email notification settings found! Will need to be created.`);
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
      console.log(`✓ Found: ${adminUser.name} (${adminUser.email})`);
    } else {
      console.log(`✗ Default admin user not found! Will need to be created.`);
    }
    
  } catch (error) {
    console.error('Error checking settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();