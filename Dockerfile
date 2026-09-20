# ---- deps: instala solo dependencias de producción, en su propia capa cacheable ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Usuario sin privilegios: el proceso de Node no necesita ser root dentro del contenedor.
RUN addgroup -S parku && adduser -S parku -G parku

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs uploads && chown -R parku:parku /app

USER parku

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
