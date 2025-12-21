# กำหนดไว้ก่อนเผื่อเปลี่ยน version
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]