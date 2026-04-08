# ── Build stage ────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts

COPY src/ src/
RUN npm run build

# ── Production stage ───────────────────────────────────────────────
FROM node:22-slim

# Install all six runtime binaries
# ffmpeg:      video transcoding (FFmpeg YouTube MCP)
# pandoc:      document conversion (Pandoc MCP)
# freecad-cmd: headless CAD export (FreeCAD MCP) — no GUI deps
# gdal-bin:    geospatial transforms (GDAL MCP) — gdalwarp, ogr2ogr, gdal_translate
# openscad:    parametric CAD rendering (OpenSCAD MCP) — headless mesh/image export
# blender:     headless 3D rendering (Blender MCP) — PNG, GLB, video, STL, Cycles
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      pandoc \
      freecad-cmd \
      gdal-bin \
      openscad \
      blender \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist/ dist/
COPY assets/ assets/

# Non-root user for sandbox isolation
RUN useradd -m -u 1001 appuser && \
    mkdir -p /sandbox /tmp/toolshop && \
    chown -R appuser:appuser /app /sandbox /tmp/toolshop && \
    chmod 770 /sandbox /tmp/toolshop

USER appuser

ENV NODE_ENV=production

VOLUME ["/sandbox", "/tmp/toolshop"]

LABEL org.opencontainers.image.title="ToolShopStudio v1.6.0-toolshop" \
      org.opencontainers.image.description="Six MCP tools + live Registry (FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, Blender)" \
      org.opencontainers.image.version="1.6.0-toolshop" \
      org.opencontainers.image.logo="assets/logo.png" \
      org.opencontainers.image.source="https://github.com/mcp-tool-shop-org/ToolShopStudio" \
      org.opencontainers.image.licenses="MIT"

ENTRYPOINT ["node", "dist/index.js"]
