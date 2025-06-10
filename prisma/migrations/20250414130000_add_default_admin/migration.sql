
-- Insert default admin user
INSERT INTO "users" ("username", "password", "email", "name", "role", "tenant_id")
VALUES (
    'vvelisoju@gmail.com',
    'ec7a137120134d28a0e0ef4f97df81ccb74b4f8c61f1b5b8ac29e985b42b435b512893a0772cb632c5191b2060394e2cbcd11752414983d2a408c8bdc',
    'vvelisoju@gmail.com',
    'Venkatesh Velisoju',
    'admin',
    1
) ON CONFLICT (username) DO UPDATE SET
    email = 'vvelisoju@gmail.com',
    name = 'Venkatesh Velisoju',
    role = 'admin',
    tenant_id = 1,
    updated_at = NOW();
