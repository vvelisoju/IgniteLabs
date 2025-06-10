# Email Settings Fix Documentation

## Background

This document describes the issue and solution for the problem where Mailgun credentials appeared as "Missing" in the UI despite being correctly stored in the database.

## Problem Analysis

The application's email service was unable to properly retrieve the Mailgun credentials from the database. This was because:

1. The default tenant configuration wasn't properly initialized
2. Foreign key constraints were causing issues with settings creation
3. The application wasn't finding the credentials during initialization

## Solution Implementation

### 1. Create Migration Files

Two migration files were created:

- `prisma/migrations/20250414110000_add_default_tenant/migration.sql`
  - Creates the default "Ignite Labs" tenant with ID 1, if it doesn't exist
  - Sets appropriate organization settings
  - Adds Mailgun credentials with proper values
  - Includes a default admin user

### 2. Update Database Schema Compatibility

The migration files were updated to match the actual database schema:
- Tenant table had a simpler structure than initially anticipated
  - Used `subdomain` instead of `domain`
  - Had an `active` flag
- Organization settings used `organization_` prefix instead of `org_`
- Email notification settings were organized with the `email_` prefix

### 3. Migration Script

A utility script was created to programmatically run migrations and check their status:
- `scripts/run-all-migrations.js` - Executes migrations in sequence and verifies key settings
- `scripts/check-mailgun-settings.js` - Diagnostic utility to check Mailgun settings

## Verification

The logs now show a successful initialization of the Mailgun client:

```
Retrieved setting for mailgun_api_key: Found: 872...
Retrieved setting for mailgun_domain: Found: mg....
Retrieved setting for mailgun_from: Found: Ign...
Getting credentials for initialization: API key found Domain: mg.codevel.com From: Ignite Labs <no-reply@mg.codevel.com>
Mailgun client initialized successfully with database credentials
```

Database queries confirm that all required settings are properly stored:

1. Mailgun credentials:
   - `mailgun_api_key`: 872c82496e25abc065b205088cfe05d4-623424ea-e221cf12
   - `mailgun_domain`: mg.codevel.com
   - `mailgun_from`: Ignite Labs <no-reply@mg.codevel.com>

2. Email notification settings:
   - `email_notifications_enabled`: true
   - `email_student_registration`: true
   - `email_payment_receipt`: true
   - `email_payment_reminder`: true
   - `email_batch_start_reminder`: true
   - `email_admin_lead_notification`: true

3. Default tenant:
   - ID: 1
   - Name: "Ignite Labs"
   - Subdomain: "ignitelabs"
   - Active: true

## Future Improvements

1. Add more robust tenant existence checking before creating settings
2. Better error handling when email credentials are missing
3. Implement automated tests for email service initialization
4. Add a status endpoint for email service health checks