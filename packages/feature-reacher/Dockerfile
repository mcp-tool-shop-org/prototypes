FROM node:22.21-slim AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.21-slim
RUN groupadd -r reacher && useradd -r -g reacher reacher
WORKDIR /app
COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/public ./public
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER reacher
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD node -e "fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1))"
CMD ["node", "server.js"]
