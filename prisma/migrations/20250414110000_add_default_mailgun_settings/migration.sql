-- Migration to add default Mailgun settings

-- Add Mailgun settings for the default tenant
-- API Key
INSERT INTO "public"."settings" ("tenant_id", "key", "value", "created_at")
VALUES (1, 'mailgun_api_key', '872c82496e25abc065b205088cfe05d4-623424ea-e221cf12', NOW())
ON CONFLICT ("tenant_id", "key") 
DO UPDATE SET "value" = '872c82496e25abc065b205088cfe05d4-623424ea-e221cf12', "updated_at" = NOW();

-- Domain
INSERT INTO "public"."settings" ("tenant_id", "key", "value", "created_at")
VALUES (1, 'mailgun_domain', 'mg.codevel.com', NOW())
ON CONFLICT ("tenant_id", "key") 
DO UPDATE SET "value" = 'mg.codevel.com', "updated_at" = NOW();

-- From Email
INSERT INTO "public"."settings" ("tenant_id", "key", "value", "created_at")
VALUES (1, 'mailgun_from', 'Ignite Labs <no-reply@mg.codevel.com>', NOW())
ON CONFLICT ("tenant_id", "key") 
DO UPDATE SET "value" = 'Ignite Labs <no-reply@mg.codevel.com>', "updated_at" = NOW();