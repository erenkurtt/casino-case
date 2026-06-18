FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Prisma config needs DATABASE_URL during build.
# This is only a dummy value for prisma generate.
# Render runtime DATABASE_URL will override this.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/game_platform_db?schema=public"

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]