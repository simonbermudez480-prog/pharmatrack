FROM node:20-slim

WORKDIR /app

# Instalar git (requerido por dependencias de Baileys que clonan de GitHub)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/auth_baileys
VOLUME ["/app/auth_baileys"]

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
