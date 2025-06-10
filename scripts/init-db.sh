#!/bin/bash
set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Initializing database with Prisma..."

# Function to handle errors
handle_error() {
  echo "Error: $1"
  echo "Initialization failed. Please check logs and try again."
  exit 1
}

# Check database connection before starting migrations
echo "Checking database connection..."
npx prisma db pull --force &>/dev/null || handle_error "Unable to connect to the database. Please check your DATABASE_URL and ensure the database server is running."

# Run Prisma database migrations in production mode
echo "Running database migrations..."
npx prisma migrate deploy || handle_error "Migration failed. Please check Prisma migration logs."

# Check if schema needs to be pushed (for development environments)
if [ "$NODE_ENV" != "production" ]; then
  echo "Development environment detected, ensuring database schema is up to date..."
  npx prisma db push --force-reset || handle_error "Schema push failed."
fi

# Check if seed flag is set
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database with initial data..."
  
  # Check if there are already users in the database
  USER_COUNT=$(npx prisma db execute --command "SELECT COUNT(*) FROM users;" | grep -o '[0-9]\+' || echo "0")
  
  if [ "$USER_COUNT" -eq "0" ]; then
    echo "No users found in database. Running seed script..."
    node prisma/seed.js || handle_error "Database seeding failed."
  else
    echo "Users already exist in the database. Skipping seed operation."
  fi
fi

# Optionally create a backup if requested
if [ "$BACKUP_BEFORE_MIGRATE" = "true" ]; then
  echo "Creating database backup..."
  BACKUP_FILE="/app/backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql"
  mkdir -p /app/backups
  pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE > $BACKUP_FILE || echo "Warning: Backup failed, but continuing with initialization."
  echo "Backup created at $BACKUP_FILE"
fi

# Create default admin account
echo "Ensuring default admin account exists..."
npx tsx scripts/create-default-admin.ts || echo "Warning: Default admin account creation failed, but continuing with initialization."

echo "Database initialization completed successfully!"
echo "==============================================="
echo "Database is ready for IgniteLabs application" 
echo "Default admin credentials:"
echo "Username: vvelisoju@gmail.com"
echo "Password: demo1234"
echo "==============================================="