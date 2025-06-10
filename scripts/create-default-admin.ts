import { hashPassword } from '../server/auth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { prisma } from '../server/prisma';

// Make sure environment variables are loaded from .env
// This is important in case this script is run directly
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
  dotenv.config();
}

// Use the existing prisma instance from server/prisma.ts

/**
 * This script creates a default admin user if it doesn't already exist
 */
async function createDefaultAdmin() {
  console.log('Creating default admin account if needed...');
  
  try {
    // Check if default tenant exists, create if not
    const defaultTenant = await prisma.tenants.findFirst({
      where: { id: 1 }
    });

    if (!defaultTenant) {
      console.log('Creating default tenant...');
      await prisma.tenants.create({
        data: {
          id: 1,
          name: 'Default Tenant',
          subdomain: 'default',
          active: true
        }
      });
      console.log('Default tenant created');
    }

    // Check if the admin user already exists
    const existingAdmin = await prisma.users.findFirst({
      where: {
        email: 'vvelisoju@gmail.com',
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    // Hash the password for security
    const hashedPassword = await hashPassword('demo1234');
    
    // Create the admin user
    const newAdmin = await prisma.users.create({
      data: {
        username: 'vvelisoju@gmail.com',
        email: 'vvelisoju@gmail.com',
        password: hashedPassword,
        name: 'Default Admin',
        role: 'admin',
        tenants: {
          connect: { id: 1 } // Connect to default tenant
        }
      }
    });

    console.log('Default admin user created successfully:', newAdmin.id);
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}

// Run the script
createDefaultAdmin()
  .catch(e => {
    console.error('Failed to create default admin:', e);
    process.exit(1);
  });