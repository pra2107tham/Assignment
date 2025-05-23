# Use official Node.js LTS image
FROM node:18-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files and install dependencies as root
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install

# Copy app source
COPY . .

# Build TypeScript (as root)
RUN pnpm run build

# Prune dev dependencies (as root)
RUN pnpm prune --prod

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["pnpm", "start"]