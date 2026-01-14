# --- Stage 1: Build ---
FROM node:22-alpine AS builder

# 1. Install openssl (required for Prisma on Alpine Linux)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy the source code
COPY . .

# Generate Prisma client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the NestJS application
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine

# Also install openssl in the production stage
RUN apk add --no-cache openssl

WORKDIR /app

# Set enviromnent to production
ENV NODE_ENV=production

# Copy only the compiled code and production dependencies from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

# Expose the application port
EXPOSE 3002

# Start the application
CMD ["node", "dist/main.js"]