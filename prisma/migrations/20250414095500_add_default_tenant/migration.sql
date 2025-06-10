-- Default Tenant Migration
-- This file creates the default tenant

-- Ensure the tenant exists
INSERT INTO "public"."tenants" ("id", "name", "subdomain", "active", "created_at", "updated_at")
VALUES (1, 'Ignite Labs', 'ignitelabs', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  "name" = 'Ignite Labs',
  "subdomain" = 'ignitelabs',
  "active" = true,
  "updated_at" = NOW();