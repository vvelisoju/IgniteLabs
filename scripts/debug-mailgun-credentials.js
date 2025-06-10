// Script to check mailgun settings in the database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMailgunSettings() {
  try {
    console.log('Checking Mailgun settings...');
    
    // Get all settings related to Mailgun
    const mailgunSettings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['mailgun_api_key', 'mailgun_domain', 'mailgun_from']
        }
      }
    });
    
    console.log(`\nFound ${mailgunSettings.length} Mailgun settings:`);
    mailgunSettings.forEach(setting => {
      console.log(`- ${setting.key} (Tenant ID: ${setting.tenant_id}): ${setting.value ? 'Value exists (length: ' + setting.value.length + ')' : 'No value'}`);
    });
    
    // Check if the API is accessible
    const apiResponse = await fetch('http://localhost:5000/api/settings/notifications/email/credentials');
    const result = await apiResponse.json();
    
    console.log("\nAPI Response:");
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMailgunSettings();