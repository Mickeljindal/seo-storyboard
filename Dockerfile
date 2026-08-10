FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY database ./database
COPY scripts ./scripts
COPY src ./src
# content-studio ships too: the boot sync reads the articles from here, and
# _published.json in it is how published status survives the DB being rebuilt.
COPY content-studio ./content-studio

# Create local data directory for PGlite
RUN mkdir -p .local

EXPOSE 3000

# Start: run migrations, then the server.
# Autopilot runs inside the app when AUTOPILOT_ENABLED=1 in .env
CMD ["sh", "-c", "node scripts/setup-pglite.mjs 2>/dev/null; node dist/server/server.js"]
