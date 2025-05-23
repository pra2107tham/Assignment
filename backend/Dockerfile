# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Install app dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install

# Copy app source
COPY . .

# Build TypeScript
RUN pnpm run build

# Remove devDependencies for production
RUN pnpm prune --prod

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"] 