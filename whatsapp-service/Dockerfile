# Dockerfile para el microservicio de WhatsApp de PharmaTrack
# Render buildroot esta carpeta como subdirectorio del repo.

FROM node:20-slim

WORKDIR /app

# Copiar solo el package.json para instalar deps primero (cache)
COPY whatsapp-service/package.json ./

# Instalar dependencias
RUN npm install --omit=dev

# Copiar el código fuente
COPY whatsapp-service/ ./

# Volumen donde se guarda la sesión de WhatsApp (autenticación persistente)
RUN mkdir -p /app/auth_baileys
VOLUME ["/app/auth_baileys"]

# Variable de entorno requerida por Render (el puerto lo setea Render)
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
