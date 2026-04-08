# GDAL MCP

> Geospatial transforms: reproject rasters, convert vectors, clip regions — the FFmpeg of GIS

**Version:** 1.7.0-toolshop  
**Pipeline:** `transformGeo`

## Presets

| Preset | Format | Extension | Tier | Fallback |
|--------|--------|-----------|------|----------|
| `raster-wgs84-tiff` | TIF | `.tif` | Guaranteed | — |
| `vector-geojson` | GEOJSON | `.geojson` | Guaranteed | — |
| `raster-to-png` | PNG | `.png` | Guaranteed | — |
| `vector-shapefile` | SHP | `.shp` | Guaranteed | — |
| `clip-raster` | TIF | `.tif` | Premium | raster-wgs84-tiff |

## Architectural Patterns

- schema-first (Zod parse on entry)
- context DI (all side effects injected)
- sandbox validation (path traversal prevention)
- preflight input check (async, stat-based)
- postflight output assertion (async, stat-based)
- spec-driven fallback (premium → guaranteed)
- AbortSignal cancellation (7+ checkpoints)
- typed notifications (progress, warning, ready)
- buildAndNotifyAsset helper
- CRUD factory with lazy hydration
- output polish (auto-extension, metadata, expiry)
- multi-binary dispatch (gdalwarp, ogr2ogr, gdal_translate)
- $INPUT/$OUTPUT/$BBOX template substitution
- format compatibility check (raster vs vector mismatch)

## Example

**Reproject raster to WGS84**

```typescript
await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);
```
