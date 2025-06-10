# ---------- Build Stage ----------
  FROM node:20-alpine AS builder

  # Install openssl and required packages
  RUN apk add --no-cache openssl curl git
  
  WORKDIR /app
  
  # Copy package files to leverage Docker layer caching
  COPY package*.json ./
  RUN npm ci
  
  # Copy the entire project
  COPY . .
  
  # Generate Prisma client
  RUN npx prisma generate --schema=prisma/schema.prisma
  
  # Build the client-side code with Vite
  RUN npm run build
  
  # ---------- Runtime Stage ----------
  FROM node:20-alpine AS runtime
  
  # Install openssl for runtime (required by Prisma client) and curl for healthcheck
  RUN apk add --no-cache openssl curl
  
  WORKDIR /app
  
  # Copy the ENTIRE project to maintain all file references
  COPY --from=builder /app ./
  
  # Create server/public directory and copy the built client files there
  RUN mkdir -p /app/server/public && \
      # Copy built files from where Vite outputs them to where the server expects them
      cp -r /app/dist/* /app/server/ || echo "No files in dist"
  
  # # Create a startup script
  # RUN echo '#!/bin/sh\n\
  # # Create public directory if it doesn\'t exist\n\
  # mkdir -p /app/server/public\n\
  # \n\
  # # Run Prisma migrations\n\
  # npx prisma migrate deploy\n\
  # \n\
  # # List directories to help with debugging\n\
  # echo "Contents of /app:"\n\
  # ls -la /app\n\
  # echo "Contents of /app/dist (if exists):"\n\
  # ls -la /app/dist || echo "dist directory does not exist"\n\
  # echo "Contents of /app/server/public:"\n\
  # ls -la /app/server/public || echo "server/public directory does not exist"\n\
  # \n\
  # # Start the server\n\
  # NODE_ENV=production npx tsx server/index.ts\n\
  # ' > /app/start.sh && chmod +x /app/start.sh
  
  # Expose port 5001 where the app is listening
  EXPOSE 5001
  
  # Run the startup script
  CMD ["npx", "prisma", "migrate", "deploy"] && \
  ["npx", "tsx", "server/index.ts"]