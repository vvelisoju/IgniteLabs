import mailgun from 'mailgun-js';
import { SETTINGS_KEYS } from './settings';
import { prisma } from '../prisma';

// Initialize with null, will be set later after loading from database
let mg: any = null;
let DEFAULT_FROM = 'IgniteLabs <no-reply@ignitielabs.com>';

// We'll initialize Mailgun after database connection is established
// This happens in the constructor of EmailService

// Default email notification settings to be used when none exist in database
const DEFAULT_EMAIL_SETTINGS = {
  [SETTINGS_KEYS.EMAIL_NOTIFICATIONS_ENABLED]: 'true',
  [SETTINGS_KEYS.EMAIL_STUDENT_REGISTRATION]: 'true',
  [SETTINGS_KEYS.EMAIL_PAYMENT_RECEIPT]: 'true',
  [SETTINGS_KEYS.EMAIL_PAYMENT_REMINDER]: 'true',
  [SETTINGS_KEYS.EMAIL_BATCH_START_REMINDER]: 'true',
  [SETTINGS_KEYS.EMAIL_NEW_LEAD_NOTIFICATION]: 'true'
};

// Email templates
const templates = {
  studentRegistration: (studentName: string, batchName: string, startDate: string) => ({
    subject: 'Welcome to IgniteLabs!',
    html: `
      <h1>Welcome to IgniteLabs, ${studentName}!</h1>
      <p>Thank you for enrolling in our <strong>${batchName}</strong> program. We're excited to have you on board!</p>
      <p>Your batch is scheduled to start on <strong>${startDate}</strong>.</p>
      <p>Please complete any pending formalities and fee payments to secure your spot.</p>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p>Best regards,<br/>IgniteLabs Team</p>
    `
  }),
  studentCredentials: (studentName: string, username: string, password: string) => ({
    subject: 'Welcome to IgniteLabs - Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4f46e5;">Welcome to IgniteLabs!</h1>
        </div>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Congratulations on your enrollment! Your account has been created for the IgniteLabs student portal. You can now access all your course materials, assignments, and track your progress.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4f46e5;">
          <p style="margin: 0; font-weight: bold;">Your Login Details:</p>
          <p style="margin: 10px 0;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p>For security reasons, we recommend changing your password after the first login.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth/login" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log in to Your Account</a>
        </div>
        <p>If you have any questions or need assistance, please contact your program coordinator.</p>
        <p>We're excited to have you join us on this learning journey!</p>
        <p style="margin-top: 20px;">Best regards,<br/><strong>IgniteLabs Team</strong></p>
      </div>
    `
  }),
  paymentReceipt: (studentName: string, amount: string, paymentDate: string, batchName: string, balance: string) => ({
    subject: 'Payment Receipt - IgniteLabs',
    html: `
      <h1>Payment Receipt</h1>
      <p>Dear ${studentName},</p>
      <p>We've received your payment of <strong>₹${amount}</strong> on <strong>${paymentDate}</strong> for the <strong>${batchName}</strong> program.</p>
      <p>Your remaining balance is: <strong>₹${balance}</strong></p>
      <p>Thank you for your payment!</p>
      <p>Best regards,<br/>IgniteLabs Team</p>
    `
  }),
  paymentReminder: (studentName: string, amount: string, dueDate: string, batchName: string) => ({
    subject: 'Payment Reminder - IgniteLabs',
    html: `
      <h1>Payment Reminder</h1>
      <p>Dear ${studentName},</p>
      <p>This is a friendly reminder that a payment of <strong>₹${amount}</strong> is due on <strong>${dueDate}</strong> for your <strong>${batchName}</strong> program.</p>
      <p>Please ensure timely payment to avoid any interruptions in your learning journey.</p>
      <p>If you've already made the payment, please disregard this message.</p>
      <p>Best regards,<br/>IgniteLabs Team</p>
    `
  }),
  batchStartReminder: (studentName: string, batchName: string, startDate: string) => ({
    subject: 'Your Course Starts Soon - IgniteLabs',
    html: `
      <h1>Your Course Starts Soon!</h1>
      <p>Dear ${studentName},</p>
      <p>This is a reminder that your <strong>${batchName}</strong> program starts on <strong>${startDate}</strong>.</p>
      <p>We're excited to begin this learning journey with you!</p>
      <p>Best regards,<br/>IgniteLabs Team</p>
    `
  }),
  passwordReset: (userName: string, resetLink: string) => ({
    subject: 'Password Reset - IgniteLabs',
    html: `
      <h1>Password Reset Request</h1>
      <p>Dear ${userName},</p>
      <p>You recently requested to reset your password for your IgniteLabs account. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Your Password</a>
      </p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p>This password reset link is only valid for 30 minutes.</p>
      <p>Best regards,<br/>IgniteLabs Team</p>
    `
  }),
  leadNotification: (leadName: string, leadEmail: string, leadPhone: string, source: string) => ({
    subject: 'New Lead Registered - IgniteLabs',
    html: `
      <h1>New Lead Registration</h1>
      <p>A new lead has registered with the following details:</p>
      <ul>
        <li><strong>Name:</strong> ${leadName}</li>
        <li><strong>Email:</strong> ${leadEmail || 'Not provided'}</li>
        <li><strong>Phone:</strong> ${leadPhone}</li>
        <li><strong>Source:</strong> ${source || 'Website'}</li>
      </ul>
      <p>Please follow up with this lead soon.</p>
    `
  })
};

/**
 * Email service for sending various notifications
 */
class EmailService {
  constructor() {
    // Initialize Mailgun client from database settings
    this.initializeMailgun();
  }

  /**
   * Send password reset email with link
   */
  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
    tenantId: number = 1
  ): Promise<boolean> {
    // Implementation added via prototype extension below
    return false;
  }
  
  /**
   * Send student login credentials email
   */
  async sendStudentCredentialsEmail(
    studentEmail: string,
    studentName: string,
    username: string,
    password: string,
    tenantId: number = 1
  ): Promise<boolean> {
    console.log(`Sending student credentials email to ${studentEmail}`);
    
    // Check if Mailgun is properly configured
    if (!mg) {
      console.warn('Mailgun not initialized. Cannot send student credentials email.');
      return false;
    }
    
    try {
      // Get the template for student credentials
      const template = templates.studentCredentials(studentName, username, password);
      
      // Send email to student
      const data = {
        from: DEFAULT_FROM,
        to: studentEmail,
        subject: template.subject,
        html: template.html
      };
      
      await mg.messages().send(data);
      console.log(`Student credentials email sent to ${studentEmail}`);
      
      // Also send a notification to admin
      const adminEmail = await this.getAdminEmail(tenantId);
      if (adminEmail && adminEmail !== studentEmail) {
        const adminData = {
          from: DEFAULT_FROM,
          to: adminEmail,
          subject: `Student Account Created: ${studentName}`,
          html: `
            <h1>New Student Account Created</h1>
            <p>A new student account has been created with the following details:</p>
            <ul>
              <li><strong>Name:</strong> ${studentName}</li>
              <li><strong>Email:</strong> ${studentEmail}</li>
              <li><strong>Username:</strong> ${username}</li>
            </ul>
            <p>The student has been sent their login credentials.</p>
          `
        };
        
        await mg.messages().send(adminData);
        console.log(`Admin notification about student credentials sent to ${adminEmail}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to send student credentials email:', error);
      return false;
    }
  }

  /**
   * Initialize Mailgun client from database settings
   */
  async initializeMailgun(tenantId: number = 1): Promise<boolean> {
    try {
      // Get credentials from database
      const credentials = await this.getMailgunCredentials(tenantId);
      console.log('Getting credentials for initialization:', credentials.apiKey ? 'API key found' : 'No API key', 
                  credentials.domain ? `Domain: ${credentials.domain}` : 'No domain', 
                  credentials.fromEmail ? `From: ${credentials.fromEmail}` : 'No from email');
      
      // If credentials exist in database, initialize the Mailgun client
      if (credentials.apiKey && credentials.domain) {
        mg = mailgun({
          apiKey: credentials.apiKey,
          domain: credentials.domain
        });
        
        // Set the default from address if available
        if (credentials.fromEmail) {
          DEFAULT_FROM = credentials.fromEmail;
        }
        
        console.log('Mailgun client initialized successfully with database credentials');
        return true;
      } 
      // Check if environment variables are set for Mailgun
      else if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
        mg = mailgun({
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN
        });
        
        // Set the default from address if available in environment
        if (process.env.MAILGUN_FROM) {
          DEFAULT_FROM = process.env.MAILGUN_FROM;
        }
        
        console.log('Mailgun client initialized successfully with environment variables');
        return true;
      }
      else {
        console.warn('Mailgun credentials not found in database or environment. Email functionality will be disabled until credentials are provided.');
        return false;
      }
    } catch (error) {
      console.error('Error initializing Mailgun client:', error);
      return false;
    }
  }

  /**
   * Initialize default email settings if they don't exist
   */
  async initializeDefaultSettings(tenantId: number = 1): Promise<void> {
    try {
      // First, check if the tenant exists to avoid foreign key constraint violations
      const tenantExists = await this.checkTenantExists(tenantId);
      if (!tenantExists) {
        console.log(`Tenant with ID ${tenantId} does not exist. Skipping email settings initialization.`);
        return;
      }

      // Check if any email settings exist
      const emailSettings = await prisma.settings.findFirst({
        where: {
          tenant_id: tenantId,
          key: SETTINGS_KEYS.EMAIL_NOTIFICATIONS_ENABLED
        }
      });
      
      // If no settings exist, create default ones
      if (!emailSettings) {
        console.log('Initializing default email notification settings...');
        
        const settingsToInsert = Object.entries(DEFAULT_EMAIL_SETTINGS).map(([key, value]) => ({
          tenant_id: tenantId,
          key,
          value
        }));
        
        try {
          // Insert all default settings
          for (const setting of settingsToInsert) {
            await prisma.settings.create({ data: setting });
          }
          console.log('Default email settings initialized successfully');
        } catch (error) {
          console.error('Failed to initialize default email settings:', error);
        }
      }
    } catch (error) {
      console.error('Error in initializeDefaultSettings:', error);
    }
  }
  
  /**
   * Check if a tenant exists in the database
   */
  private async checkTenantExists(tenantId: number): Promise<boolean> {
    try {
      // Query the tenants table to check if the tenant exists
      const tenant = await prisma.tenants.findUnique({
        where: {
          id: tenantId
        }
      });
      
      return !!tenant; // Return true if tenant exists, false otherwise
    } catch (error) {
      console.error(`Error checking if tenant ${tenantId} exists:`, error);
      return false; // Assume tenant doesn't exist in case of error
    }
  }

  /**
   * Save Mailgun credentials to the database
   */
  async saveMailgunCredentials(apiKey: string, domain: string, fromEmail: string, tenantId: number = 1): Promise<boolean> {
    try {
      console.log('Saving Mailgun credentials to database - domain:', domain, 'from:', fromEmail);
      
      // Store the credentials in the database settings one by one, verifying each
      try {
        // First, save the API key
        await this.saveMailgunSetting('mailgun_api_key', apiKey, tenantId);
        console.log('API key saved successfully');
        
        // Then save the domain
        await this.saveMailgunSetting('mailgun_domain', domain, tenantId);
        console.log('Domain saved successfully');
        
        // Finally save the from email
        await this.saveMailgunSetting('mailgun_from', fromEmail, tenantId);
        console.log('From email saved successfully');
      } catch (saveError) {
        console.error('Error while saving settings:', saveError);
        throw saveError;
      }
      
      // Verify all settings were saved correctly
      const savedApiKey = await this.getMailgunSetting('mailgun_api_key', tenantId);
      const savedDomain = await this.getMailgunSetting('mailgun_domain', tenantId);
      const savedFromEmail = await this.getMailgunSetting('mailgun_from', tenantId);
      
      console.log('Verification results:', {
        apiKey: savedApiKey ? 'Found' : 'Missing',
        domain: savedDomain ? 'Found' : 'Missing',
        fromEmail: savedFromEmail ? 'Found' : 'Missing'
      });
      
      if (!savedApiKey || !savedDomain || !savedFromEmail) {
        console.error('Verification of saved settings failed');
        return false;
      }
      
      // Reinitialize the Mailgun client with the new credentials
      if (apiKey && domain) {
        mg = mailgun({
          apiKey,
          domain
        });
        console.log('Mailgun client reinitialized with updated credentials');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving Mailgun credentials:', error);
      return false;
    }
  }
  
  /**
   * Helper method to save a Mailgun setting
   */
  private async saveMailgunSetting(key: string, value: string, tenantId: number): Promise<void> {
    try {
      console.log(`Saving Mailgun setting: ${key} for tenant ${tenantId} with value length: ${value ? value.length : 0}`);
      
      const existing = await prisma.settings.findFirst({
        where: {
          tenant_id: tenantId,
          key: key
        }
      });
      
      if (existing) {
        console.log(`Updating existing setting: ${key} (ID: ${existing.id})`);
        await prisma.settings.update({
          where: {
            id: existing.id
          },
          data: {
            value: value
          }
        });
      } else {
        console.log(`Creating new setting: ${key}`);
        await prisma.settings.create({
          data: {
            tenant_id: tenantId,
            key: key,
            value: value
          }
        });
      }
      
      // Verify the setting was saved correctly
      const verifyResult = await prisma.settings.findFirst({
        where: {
          tenant_id: tenantId,
          key: key
        }
      });
      
      if (verifyResult) {
        console.log(`Setting ${key} verified - ID: ${verifyResult.id}, value length: ${verifyResult.value?.length || 0}`);
      } else {
        console.warn(`Failed to verify setting ${key} - not found after save!`);
      }
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * Get Mailgun credentials from the database
   */
  async getMailgunCredentials(tenantId: number = 1): Promise<{
    apiKey: string | null;
    domain: string | null;
    fromEmail: string | null;
  }> {
    const apiKey = await this.getMailgunSetting('mailgun_api_key', tenantId);
    const domain = await this.getMailgunSetting('mailgun_domain', tenantId);
    const fromEmail = await this.getMailgunSetting('mailgun_from', tenantId);
    
    return {
      apiKey,
      domain,
      fromEmail
    };
  }
  
  /**
   * Helper method to get a Mailgun setting
   */
  private async getMailgunSetting(key: string, tenantId: number): Promise<string | null> {
    try {
      const setting = await prisma.settings.findFirst({
        where: {
          tenant_id: tenantId,
          key: key
        }
      });
      
      console.log(`Retrieved setting for ${key}:`, setting ? `Found: ${setting.value?.substring(0, 3)}...` : 'Not found');
      return setting?.value || null;
    } catch (error) {
      console.error(`Error retrieving setting for ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if email notifications are enabled globally
   */
  async isEmailEnabled(tenantId: number = 1): Promise<boolean> {
    // Make sure default settings exist
    await this.initializeDefaultSettings(tenantId);
    
    const setting = await prisma.settings.findFirst({
      where: {
        tenant_id: tenantId,
        key: SETTINGS_KEYS.EMAIL_NOTIFICATIONS_ENABLED
      }
    });
    
    return setting?.value === 'true';
  }

  /**
   * Check if a specific email notification type is enabled
   */
  async isNotificationTypeEnabled(notificationType: string, tenantId: number = 1): Promise<boolean> {
    console.log(`Checking if notification type '${notificationType}' is enabled`);
    
    // Make sure default settings exist
    await this.initializeDefaultSettings(tenantId);
    
    // Check global email setting
    const emailEnabled = await this.isEmailEnabled(tenantId);
    if (!emailEnabled) {
      console.log('Global email notifications are disabled');
      return false;
    }

    // Look up specific notification setting
    const setting = await prisma.settings.findFirst({
      where: {
        tenant_id: tenantId,
        key: notificationType
      }
    });

    // If setting doesn't exist but is in defaults, use the default value
    if (!setting && DEFAULT_EMAIL_SETTINGS[notificationType]) {
      const defaultEnabled = DEFAULT_EMAIL_SETTINGS[notificationType] === 'true';
      console.log(`No setting found, using default value: ${defaultEnabled}`);
      return defaultEnabled;
    }

    const enabled = setting?.value === 'true';
    console.log(`Notification type '${notificationType}' enabled: ${enabled}`);
    return enabled;
  }

  /**
   * Get admin email for notifications
   */
  async getAdminEmail(tenantId: number = 1): Promise<string | null> {
    // First try to get from organization email
    const orgEmailSetting = await prisma.settings.findFirst({
      where: {
        tenant_id: tenantId,
        key: SETTINGS_KEYS.ORG_EMAIL
      }
    });
    
    if (orgEmailSetting?.value) {
      console.log(`Using organization email from settings: ${orgEmailSetting.value}`);
      return orgEmailSetting.value;
    }

    // If not found, get the first admin user's email
    const adminUsers = await prisma.users.findMany({
      where: {
        role: 'admin'
      },
      take: 1
    });
    
    if (adminUsers.length > 0 && adminUsers[0].email) {
      console.log(`Using admin user email: ${adminUsers[0].email}`);
      return adminUsers[0].email;
    }

    // Default admin email as fallback
    const defaultAdminEmail = 'vvelisoju@gmail.com';
    console.log(`No admin email found in settings or users. Using default: ${defaultAdminEmail}`);
    return defaultAdminEmail;
  }

  /**
   * Send student registration confirmation email
   */
  async sendStudentRegistrationEmail(
    studentEmail: string, 
    studentName: string, 
    batchName: string, 
    startDate: string,
    tenantId: number = 1
  ): Promise<boolean> {
    if (!await this.isNotificationTypeEnabled(SETTINGS_KEYS.EMAIL_STUDENT_REGISTRATION, tenantId)) {
      return false;
    }

    // Check if Mailgun is properly configured
    if (!mg) {
      console.warn('Mailgun not initialized. Cannot send student registration email.');
      return false;
    }

    const adminEmail = await this.getAdminEmail(tenantId);
    const template = templates.studentRegistration(studentName, batchName, startDate);

    try {
      const data = {
        from: DEFAULT_FROM,
        to: studentEmail,
        cc: adminEmail || undefined,
        subject: template.subject,
        html: template.html
      };

      await mg.messages().send(data);
      return true;
    } catch (error) {
      console.error('Failed to send student registration email:', error);
      return false;
    }
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(
    studentEmail: string,
    studentName: string,
    amount: string,
    paymentDate: string,
    batchName: string,
    balance: string,
    tenantId: number = 1
  ): Promise<boolean> {
    if (!await this.isNotificationTypeEnabled(SETTINGS_KEYS.EMAIL_PAYMENT_RECEIPT, tenantId)) {
      return false;
    }

    // Check if Mailgun is properly configured
    if (!mg) {
      console.warn('Mailgun not initialized. Cannot send payment receipt email.');
      return false;
    }

    const adminEmail = await this.getAdminEmail(tenantId);
    const template = templates.paymentReceipt(studentName, amount, paymentDate, batchName, balance);

    try {
      const data = {
        from: DEFAULT_FROM,
        to: studentEmail,
        cc: adminEmail || undefined,
        subject: template.subject,
        html: template.html
      };

      await mg.messages().send(data);
      return true;
    } catch (error) {
      console.error('Failed to send payment receipt email:', error);
      return false;
    }
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminderEmail(
    studentEmail: string,
    studentName: string,
    amount: string,
    dueDate: string,
    batchName: string,
    tenantId: number = 1
  ): Promise<boolean> {
    if (!await this.isNotificationTypeEnabled(SETTINGS_KEYS.EMAIL_PAYMENT_REMINDER, tenantId)) {
      return false;
    }

    // Check if Mailgun is properly configured
    if (!mg) {
      console.warn('Mailgun not initialized. Cannot send payment reminder email.');
      return false;
    }

    const template = templates.paymentReminder(studentName, amount, dueDate, batchName);

    try {
      const data = {
        from: DEFAULT_FROM,
        to: studentEmail,
        subject: template.subject,
        html: template.html
      };

      await mg.messages().send(data);
      return true;
    } catch (error) {
      console.error('Failed to send payment reminder email:', error);
      return false;
    }
  }

  /**
   * Send batch start reminder email
   */
  async sendBatchStartReminderEmail(
    studentEmail: string,
    studentName: string,
    batchName: string,
    startDate: string,
    tenantId: number = 1
  ): Promise<boolean> {
    if (!await this.isNotificationTypeEnabled(SETTINGS_KEYS.EMAIL_BATCH_START_REMINDER, tenantId)) {
      return false;
    }

    // Check if Mailgun is properly configured
    if (!mg) {
      console.warn('Mailgun not initialized. Cannot send batch start reminder email.');
      return false;
    }

    const template = templates.batchStartReminder(studentName, batchName, startDate);

    try {
      const data = {
        from: DEFAULT_FROM,
        to: studentEmail,
        subject: template.subject,
        html: template.html
      };

      await mg.messages().send(data);
      return true;
    } catch (error) {
      console.error('Failed to send batch start reminder email:', error);
      return false;
    }
  }

  /**
   * Send new lead notification to admin and lead
   */
  async sendLeadNotificationEmail(
    leadName: string,
    leadEmail: string,
    leadPhone: string,
    source: string = 'Website',
    tenantId: number = 1
  ): Promise<boolean> {
    console.log(`Attempting to send lead notification email for ${leadName} (${leadEmail})`);
    
    const isEnabled = await this.isNotificationTypeEnabled(SETTINGS_KEYS.EMAIL_NEW_LEAD_NOTIFICATION, tenantId);
    if (!isEnabled) {
      console.log('Lead notification emails are disabled in settings');
      return false;
    }

    // Check if Mailgun is properly configured and initialize if not
    if (!mg) {
      console.log('Mailgun not initialized. Attempting to initialize...');
      const initialized = await this.initializeMailgun(tenantId);
      if (!initialized) {
        console.warn('Failed to initialize Mailgun. Cannot send lead notification email.');
        return false;
      }
    }

    // Always include vvelisoju@gmail.com as primary admin email
    const primaryAdminEmail = 'vvelisoju@gmail.com';
    
    // Get organization admin email as a secondary recipient
    const orgAdminEmail = await this.getAdminEmail(tenantId);
    console.log('Admin emails for notifications:', primaryAdminEmail, orgAdminEmail);
    
    // Create list of recipients - always include the primary admin
    const recipients = [primaryAdminEmail];
    
    // Add organization admin if it's different from primary
    if (orgAdminEmail && orgAdminEmail !== primaryAdminEmail) {
      recipients.push(orgAdminEmail);
    }
    
    // Create template
    const template = templates.leadNotification(leadName, leadEmail, leadPhone, source);
    console.log(`Sending lead notification to admin(s): ${recipients.join(', ')}`);

    try {
      // Send notification to admin(s)
      const adminData = {
        from: DEFAULT_FROM,
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html
      };

      console.log('Admin email data prepared:', { 
        from: DEFAULT_FROM, 
        to: recipients.join(', '),
        subject: template.subject 
      });
      await mg.messages().send(adminData);
      console.log('Lead notification email sent to admin(s) successfully');
      
      // Send confirmation to lead if they provided an email
      if (leadEmail) {
        console.log(`Also sending confirmation to lead at ${leadEmail}`);
        
        // Create lead-specific template
        const leadTemplate = {
          subject: 'Thank you for your interest in IgniteLabs!',
          html: `
            <h1>Thank you for your interest in IgniteLabs!</h1>
            <p>Dear ${leadName},</p>
            <p>Thank you for registering your interest with IgniteLabs. We have received your information and our team will contact you shortly.</p>
            <p>We're excited about the possibility of having you join our upcoming batch starting May 19th, 2025.</p>
            <p>If you have any immediate questions, please feel free to reach out to us.</p>
            <p>Best regards,<br/>IgniteLabs Team</p>
          `
        };
        
        const leadData = {
          from: DEFAULT_FROM,
          to: leadEmail,
          subject: leadTemplate.subject,
          html: leadTemplate.html
        };
        
        await mg.messages().send(leadData);
        console.log('Confirmation email sent to lead successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send lead notification email:', error);
      return false;
    }
  }

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    // Check if Mailgun is properly configured
    if (!mg) {
      throw new Error('Mailgun credentials are missing or invalid. Please configure your Mailgun credentials in the Email Configuration tab.');
    }
    
    try {
      // Simple template for test email
      const data = {
        from: DEFAULT_FROM,
        to: recipientEmail,
        subject: 'IgniteLabs Email Configuration Test',
        html: `
          <h1>Email Configuration Test</h1>
          <p>This is a test email to verify your email notification setup is working correctly.</p>
          <p>If you're seeing this message, your email configuration is working properly!</p>
          <p>Best regards,<br/>IgniteLabs Team</p>
        `
      };

      await mg.messages().send(data);
      return true;
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      throw new Error(`Email configuration test failed: ${error.message}`);
    }
  }
}

// Create the email service instance
const emailServiceInstance = new EmailService();
// Export it for use in other modules
export const emailService = emailServiceInstance;

// Add password reset email method to EmailService prototype
// Instead of modifying the prototype, add the method to our instance directly
emailServiceInstance.sendPasswordResetEmail = async function(
  userEmail: string,
  userName: string,
  resetToken: string,
  tenantId: number = 1
): Promise<boolean> {
  // Check if Mailgun is properly configured
  if (!mg) {
    console.warn('Mailgun not initialized. Cannot send password reset email.');
    return false;
  }

  try {
    // Create the reset URL with the token
    const resetLink = `${process.env.APP_URL || 'http://localhost:5000'}/auth/reset-password?token=${resetToken}`;
    const template = templates.passwordReset(userName, resetLink);

    const data = {
      from: DEFAULT_FROM,
      to: userEmail,
      subject: template.subject,
      html: template.html
    };

    console.log(`Sending password reset email to ${userEmail} with reset link: ${resetLink}`);
    await mg.messages().send(data);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

// Note: The emailService singleton was already exported above