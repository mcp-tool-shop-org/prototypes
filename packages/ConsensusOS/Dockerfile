FROM node:22-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:22-slim

RUN groupadd -r consensus && useradd -r -g consensus consensus

WORKDIR /app

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package.json ./

ENV NODE_ENV=production

USER consensus

ENTRYPOINT ["node", "dist/cli/bin.js"]
CMD ["help"]
