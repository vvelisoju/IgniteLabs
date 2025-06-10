
-- Organization and Email Settings Migration

-- Add organization settings
INSERT INTO "public"."settings" ("tenant_id", "key", "value", "created_at", "updated_at")
VALUES 
(1, 'organization_name', 'Ignite Labs', NOW(), NOW()),
(1, 'organization_address', '123 Education Street, Bangalore, Karnataka 560001, India', NOW(), NOW()),
(1, 'organization_phone', '+91 9876543210', NOW(), NOW()),
(1, 'organization_email', 'info@ignitelabs.co.in', NOW(), NOW()),
(1, 'organization_website', 'https://ignitelabs.co.in', NOW(), NOW()),
(1, 'organization_gstin', '29AABCI1234A1Z5', NOW(), NOW()),
(1, 'organization_logo', '/assets/ignite-labs-icon.png', NOW(), NOW())
ON CONFLICT ("tenant_id", "key") 
DO UPDATE SET "value" = EXCLUDED.value, "updated_at" = NOW();

-- Add email notification settings
INSERT INTO "public"."settings" ("tenant_id", "key", "value", "created_at", "updated_at")
VALUES 
(1, 'email_notifications_enabled', 'true', NOW(), NOW()),
(1, 'email_student_registration', 'true', NOW(), NOW()),
(1, 'email_payment_receipt', 'true', NOW(), NOW()),
(1, 'email_payment_reminder', 'true', NOW(), NOW()),
(1, 'email_batch_start_reminder', 'true', NOW(), NOW()),
(1, 'email_new_lead_notification', 'true', NOW(), NOW())
ON CONFLICT ("tenant_id", "key") 
DO UPDATE SET "value" = EXCLUDED.value, "updated_at" = NOW();
