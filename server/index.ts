import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import * as net from "net";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import port configuration if it exists
let CONFIG_PORT = 5001; // Default to 5001

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'port-config.js');
if (fs.existsSync(configPath)) {
  try {
    // Using dynamic import for ES modules
    const portConfigModule = await import('./port-config.js');
    const portConfig = portConfigModule.default || portConfigModule;
    if (portConfig.PORT) {
      CONFIG_PORT = portConfig.PORT;
    }
  } catch (error) {
    console.error('Error loading port configuration:', error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the configured port from port-config.js or default to 5001
  const appPort = CONFIG_PORT;
  
  // Start the main application on the configured port
  log(`Starting main application on port ${appPort}...`);
  server.listen(appPort, "0.0.0.0", () => {
    log(`Application server running on port ${appPort}`);
    console.log(`Server is running at: http://localhost:${appPort}`);
  });
})();
