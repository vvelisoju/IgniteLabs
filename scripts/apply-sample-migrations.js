// Simple script to apply the sample migrations using direct SQL execution
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../generated/prisma/index.js';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Path to the merged migration file
const mergedMigrationPath = path.join(
  projectRoot, 
  'prisma', 
  'migrations', 
  '20250414130000_merge_sample_migrations', 
  'migration.sql'
);

async function applySampleMigrations() {
  console.log('🚀 Starting sample migrations application...');
  
  // Create a new Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Read the migration SQL file
    console.log(`📂 Reading migration file: ${mergedMigrationPath}`);
    const sql = fs.readFileSync(mergedMigrationPath, 'utf8');
    
    // Split SQL by semicolons to execute each statement separately
    // This is a simple approach and may not work for all SQL constructs
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add back the semicolon
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement executed successfully`);
        successCount++;
      } catch (error) {
        console.warn(`⚠️ Error executing statement: ${error.message}`);
        errorCount++;
        
        // Check if error is just about conflict or already existing objects
        if (
          error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('violates unique constraint') ||
          error.message.includes('cannot be altered')
        ) {
          console.log('   This is likely a non-critical error, continuing...');
        } else {
          console.error('   This might be a critical error.');
        }
      }
    }
    
    console.log('\n📊 Migration execution summary:');
    console.log(`   Total statements: ${statements.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All migrations successfully applied!');
    } else {
      console.log('\n⚠️ Migrations completed with some errors. Review the output above.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration process failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}

// Run the migrations
applySampleMigrations()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });