FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 10000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]