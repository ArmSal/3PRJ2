# STAGE 1: BUILD (Neural Interface Compiler)
FROM node:20-alpine AS builder

WORKDIR /app

# Install and cache dependencies
# Delete lockfile locally before running to match pins
COPY package*.json ./
RUN npm install

# Copy source and compile neural interface logic
COPY . .
RUN npm run build

# STAGE 2: RUNTIME (Nexus UI Deploy Unit)
FROM nginx:stable-alpine AS runner

# Copy compiled assets from builder unit
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy professional Nginx configuration for Vue SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Professional health check for cloud-native orchestration
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
