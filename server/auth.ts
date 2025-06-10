import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { prisma } from "./prisma";
import connectPg from "connect-pg-simple";

// For TypeScript type safety
// Create a mapped type that handles both the camelCase in our code and snake_case in DB
type User = {
  id: number;
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  status?: string | null;
  // Add both versions to support both formats
  tenantId?: number | null;
  tenant_id?: number | null;
  createdAt?: Date;
  created_at?: Date;
};

declare global {
  namespace Express {
    // Define the User interface that will be used for req.user
    interface User {
      id: number;
      username: string;
      email: string;
      name: string;
      role: string;
      phone?: string | null;
      specialization?: string | null;
      bio?: string | null;
      status?: string | null;
      // Support both formats
      tenantId?: number | null;
      tenant_id?: number | null;
      createdAt?: Date;
      created_at?: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Session store using PostgreSQL
const PostgresSessionStore = connectPg(session);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ignite-labs-secret",
    resave: true,
    saveUninitialized: true,
    store: new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      tableName: "sessions",
      createTableIfMissing: true
    }),
    cookie: {
      secure: false, // Set to false to work in all environments
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      sameSite: 'lax' // Allow cross-site requests with certain restrictions
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, name, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role
      });

      // Login user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = req.user;
    res.json({
      id: user?.id,
      username: user?.username,
      email: user?.email,
      name: user?.name,
      role: user?.role
    });
  });
}

// Authentication middleware
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based middleware
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

// Role-specific middleware functions
export const isAdmin = hasRole(['admin']);
export const isManager = hasRole(['admin', 'manager']);
export const isTrainer = hasRole(['admin', 'manager', 'trainer']);
export const isStudent = hasRole(['student']);