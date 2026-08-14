FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/auth_baileys
VOLUME ["/app/auth_baileys"]

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
