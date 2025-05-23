# Build stage
FROM node:18-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build

# Production stage
FROM node:18-alpine AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"] 