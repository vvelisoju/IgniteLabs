# IgniteLabs Deployment Guide

This document provides instructions for deploying the IgniteLabs Student Management System using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your server
- Access to your server via SSH or terminal
- Basic knowledge of Docker and command line operations

## Deployment Steps

### 1. Clone the Repository

```bash
git clone [your-repository-url]
cd [repository-directory]
```

### 2. Environment Configuration

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file to set up your configuration:
- Update `APP_URL` with your actual domain
- Generate a strong session secret for `SESSION_SECRET`
- Configure database credentials (update passwords)
- Configure Mailgun API keys if email functionality is needed

### 3. Build and Start the Application

Before starting, create necessary local directories for data persistence:

```bash
mkdir -p ./uploads ./backups
```

Then build and start the application:

```bash
docker-compose up -d
```

This will:
- Build the application container using a multi-stage build process
- Start PostgreSQL database
- Link the application with the database
- Run Prisma migrations automatically via the initialization script
- Make the application available on port 5000

#### Database Initialization Process

The database schema is automatically set up using Prisma migrations during the first startup. The process is handled by the initialization script (`scripts/init-db.sh`) which:

1. Checks database connectivity
2. Runs `prisma migrate deploy` to apply all migrations
3. Optionally creates a database backup before migration (if BACKUP_BEFORE_MIGRATE=true)
4. Optionally seeds the database with initial data (if SEED_DATABASE=true)

You can configure these database initialization options in the `docker-compose.yml` file:

```yaml
# Database initialization options
- SEED_DATABASE=true  # Set to false in production after initial setup
- BACKUP_BEFORE_MIGRATE=true  # Creates a backup before migration
```

It's recommended to set `SEED_DATABASE=true` for the initial deployment, then set it to `false` for subsequent deployments to prevent duplicate data.

### 4. Verify Deployment

Access the application at `http://your-server-ip:5000` or your configured domain.

### 5. First Login

Log in with the default admin credentials:
- Username: `vvelisoju@gmail.com`
- Password: `demo1234`

**IMPORTANT:** Change the default password immediately after first login!

### 6. Resetting Admin Account

If you need to reset or recreate the default admin account, use the provided script:

```bash
# When running locally
node scripts/reset-admin-account.js

# When using Docker
docker-compose exec app node scripts/reset-admin-account.js
```

This script will either create a new default admin account if one doesn't exist, or reset the password for the existing admin account.

## Maintenance

### Viewing Logs

```bash
docker-compose logs -f
```

### Stopping the Application

```bash
docker-compose down
```

### Updating the Application

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Managing Database Schema Changes

If you need to modify the database schema:

1. Update the schema in `prisma/schema.prisma`
2. Generate Prisma client:
```bash
npx prisma generate
```

3. Create a migration (in development):
```bash
npx prisma migrate dev --name describe_your_changes
```

4. Apply migrations in production:
```bash
npx prisma migrate deploy
```

Note: When using docker-compose, migrations are automatically applied during container startup.

### Backup Database

The system can automatically create backups before migrations if `BACKUP_BEFORE_MIGRATE=true` is set in the docker-compose.yml file. These backups are stored in the `./backups` directory.

You can also manually create a database backup:

```bash
# Full database backup
docker-compose exec postgres pg_dump -U postgres ignitelabs > ./backups/manual_backup_$(date +%Y%m%d).sql

# Compressed backup (smaller file size)
docker-compose exec postgres pg_dump -U postgres ignitelabs | gzip > ./backups/manual_backup_$(date +%Y%m%d).sql.gz
```

To restore from a backup:

```bash
# For regular SQL backup
cat ./backups/backup_file.sql | docker-compose exec -T postgres psql -U postgres ignitelabs

# For compressed backup
gunzip -c ./backups/backup_file.sql.gz | docker-compose exec -T postgres psql -U postgres ignitelabs
```

## Troubleshooting

### Database Connection Issues

Check if the database container is running:
```bash
docker-compose ps
```

If the database container is not running, check the logs:
```bash
docker-compose logs postgres
```

### Application Not Starting

Check application logs:
```bash
docker-compose logs app
```

### Reset Application Container

```bash
docker-compose restart app
```

### Admin Account Access Issues

If you're unable to access the system with the default admin account or need to reset it:

```bash
# When running locally
node scripts/reset-admin-account.js

# When using Docker
docker-compose exec app node scripts/reset-admin-account.js
```

This will either create a new default admin account with the credentials:
- Username: `vvelisoju@gmail.com`
- Password: `demo1234`

Or it will reset the password for the existing admin account to `demo1234`.

## Security Considerations

1. Always change default passwords
2. Update the `.env` file with strong, unique credentials
3. Consider setting up HTTPS with a reverse proxy like Nginx
4. Limit access to the database port (5432) to only necessary IP addresses
5. Regularly update the application and dependencies

## Contact Support

For additional help, contact the IgniteLabs support team.