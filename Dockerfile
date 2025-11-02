FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Build frontend (NO .env file - will use window.location.origin fallback)
WORKDIR /usr/src/app/client
COPY client/package.json client/package-lock.json ./
RUN apk add --no-cache build-base cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev python3 make g++
RUN npm ci

# Copy client source (ensure .env is NOT included via .dockerignore)
COPY client/src ./src
COPY client/index.html client/vite.config.ts client/tsconfig.json client/postcss.config.js client/tailwind.config.js client/eslint.config.js ./
COPY client/public ./public
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
RUN apk add --no-cache build-base cairo-dev jpeg-dev pango-dev giflib-dev librsvg-dev
RUN npm install --only=production

# Copy built frontend from builder
COPY --from=builder /usr/src/app/client/dist ./client/dist

# Copy server files
COPY server.js config.js database.js start-server.sh ./
COPY public/ ./public/

EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "server.js" ]

