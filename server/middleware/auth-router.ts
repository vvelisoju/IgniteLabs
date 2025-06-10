import { Router, Request, Response, NextFunction } from 'express';
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from '../storage';
import { emailService } from '../services/email.service';
import { prisma } from '../prisma';

// Create router
const router = Router();

// Helper function for async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Login route - redirects to Passport login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth router login - redirecting to Passport login');
  // Forward to Passport's /api/login handler
  res.redirect(307, '/api/login');
});

// Register route
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, role } = req.body;
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password using the same algorithm as auth.ts
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    // Create user
    const userData = {
      username,
      password: hashedPassword,
      name,
      email,
      role: role || 'student' // Default role
    };
    
    const newUser = await storage.createUser(userData);
    
    // Store user in session
    if (req.session) {
      req.session.user = {
        id: newUser.id
      };
    }
    
    // Return the user without the password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
}));

// Get current user - redirects to Passport user endpoint
router.get('/me', (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth router /me - redirecting to Passport user endpoint');
  // Forward to Passport's /api/user handler
  res.redirect(307, '/api/user');
});

// Debug route to check session state
router.get('/debug-session', (req: Request, res: Response) => {
  console.log('Debug session check - full session:', req.session);
  console.log('Debug session check - is authenticated:', req.isAuthenticated?.());
  console.log('Debug session check - user:', req.user);
  
  res.json({
    sessionExists: !!req.session,
    sessionData: req.session,
    isAuthenticated: req.isAuthenticated?.() || false,
    hasUser: !!req.user,
    userDetails: req.user || null
  });
});

// Logout route - redirects to Passport logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth router logout - redirecting to Passport logout');
  // Forward to Passport's /api/logout handler
  res.redirect(307, '/api/logout');
});

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Forgot password route
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // For security reasons, always return success even if email is not found
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate a secure random token
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    
    // Create an expiry date (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Store the token in the database
    // First, invalidate any existing tokens for this user
    await prisma.password_reset_tokens.updateMany({
      where: { user_id: user.id, is_used: false },
      data: { is_used: true }
    });
    
    // Then create a new token
    await prisma.password_reset_tokens.create({
      data: {
        token: tokenHash,
        user_id: user.id,
        expires_at: expiresAt,
        tenant_id: user.tenant_id
      }
    });
    
    // Generate password reset URL with the token - we'll only create it for logging,
    // actual URL is generated in the email service using APP_URL env var
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:5000';
    const resetUrl = `${protocol}://${host}/auth/reset-password?token=${resetToken}`;
    
    // Send password reset email
    try {
      // Use our email service to send the password reset email
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        user.name || user.username, // Use name if available, otherwise username
        resetToken
      );
      
      if (!emailSent) {
        console.error('Failed to send password reset email');
      } else {
        console.log('Password reset email sent to:', user.email);
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
    
    // Always return the same message regardless of whether email was sent or not
    // for security reasons
    res.status(200).json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
    
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
}));

// Reset password route
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    console.log('Processing reset password request with token:', token.substring(0, 10) + '...');
    
    // Convert token to hash
    const tokenHash = createHash('sha256').update(token).digest('hex');
    console.log('Token hash for lookup:', tokenHash.substring(0, 10) + '...');
    
    // Find the reset token in the database
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: tokenHash,
        is_used: false,
        expires_at: {
          gt: new Date() // Only tokens that have not expired
        }
      }
    });
    
    if (!resetToken) {
      console.log('No valid token found in database. Checking for expired or used tokens...');
      
      // For debugging, check if token exists but is expired or used
      const anyToken = await prisma.password_reset_tokens.findFirst({
        where: {
          token: tokenHash
        }
      });
      
      if (anyToken) {
        if (anyToken.is_used) {
          console.log('Token found but has already been used');
          return res.status(400).json({ error: 'Token has already been used' });
        }
        
        if (anyToken.expires_at < new Date()) {
          console.log('Token found but has expired');
          return res.status(400).json({ error: 'Token has expired' });
        }
      } else {
        console.log('No token found with this hash');
      }
      
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Find the user
    const user = await storage.getUserById(resetToken.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    // Update the user's password
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    // Mark the token as used
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { is_used: true }
    });
    
    // Log the password reset event
    console.log(`Password reset successful for user ID: ${user.id}`);
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'An error occurred' });
  }
}));

export default router;