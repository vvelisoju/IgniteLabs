/*
 * This script resets or creates the default admin account
 * with the credentials: vvelisoju@gmail.com / demo1234
 * 
 * Run this script with: node scripts/reset-admin-account.js
 */

import { hashPassword } from '../server/auth';
import { prisma } from '../server/prisma';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Make sure environment variables are loaded from .env
if (fs.existsSync(path.join(process.cwd(), '.env'))) {
  dotenv.config();
}

async function resetAdminAccount() {
  console.log('Starting admin account reset process...');
  
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

    // Check if admin user exists
    const adminUser = await prisma.users.findFirst({
      where: {
        email: 'vvelisoju@gmail.com',
        role: 'admin'
      }
    });

    // Hash the password for security
    const hashedPassword = await hashPassword('demo1234');
    
    if (adminUser) {
      // Reset existing admin password
      console.log('Resetting password for existing admin account...');
      await prisma.users.update({
        where: { id: adminUser.id },
        data: {
          password: hashedPassword
        }
      });
      console.log('Admin password reset successfully for user ID:', adminUser.id);
    } else {
      // Create new admin user
      console.log('Creating new default admin account...');
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
      console.log('Default admin user created successfully with ID:', newAdmin.id);
    }
    
    console.log('----------------------------------------');
    console.log('Default admin account is now available:');
    console.log('Username: vvelisoju@gmail.com');
    console.log('Password: demo1234');
    console.log('----------------------------------------');
  } catch (error) {
    console.error('Error processing admin account:', error);
  }
}

// Run the script
resetAdminAccount()
  .catch(error => {
    console.error('Failed to reset admin account:', error);
    process.exit(1);
  });