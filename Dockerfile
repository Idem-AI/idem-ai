# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN node -r dotenv/config mynode.js

# Build for SSR
RUN npm run build

# Production stage for SSR server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# Start SSR server
CMD ["npm", "run", "serve:ssr"]
