# --- Stage 1: Build ---
FROM node:22-alpine AS builder

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
# We use 'npm ci' for faster, more reliable installs in CI/CD
RUN npm install

COPY . .

# Generate Prisma client and build NestJS
RUN DATABASE_URL="postgresql://dummy@localhost:5432/db" npx prisma generate
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# 1. Copy package files
COPY --from=builder /app/package*.json ./

# 2. Copy the production node_modules and the built dist folder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# 3. IMPORTANT: Copy your custom Prisma output so the app can find it
# Based on your schema: output = "../src/generated/prisma"
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3002

# Using the absolute path to ensure Node finds it
CMD ["node", "/app/dist/main.js"]