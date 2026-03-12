FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy prisma schema + config before generate
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .

USER node

EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]
