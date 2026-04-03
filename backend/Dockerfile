# STAGE 1: BUILD (Nexus Core Compiler)
FROM node:20-alpine AS builder

WORKDIR /app

# Install and cache dependencies
COPY package*.json ./
RUN npm install

# Copy source and compile neural network logic
COPY . .
RUN npm run build

# STAGE 2: RUNTIME (Nexus Execution Unit)
FROM node:20-alpine AS runner

WORKDIR /app

# Production environment optimizations
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled logic from builder unit
COPY --from=builder /app/dist ./dist

# Security: Run as non-root user for cloud-native compliance
USER node

EXPOSE 3000

# Entry point for production neural protocols
CMD ["node", "dist/index.js"]
