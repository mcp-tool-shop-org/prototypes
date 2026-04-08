/**
 * Robust line-buffered ffmpeg progress parser.
 *
 * ffmpeg's -progress pipe:2 emits key=value pairs on stderr,
 * one per line. Chunks from the stream may split mid-line, so
 * we buffer partial lines and emit complete KV pairs.
 */

/**
 * Parse a single progress line into key/value.
 * Returns null for blank lines, comments, or malformed input.
 */
export function parseProgressLine(
  line: string,
): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 1) return null;

  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!key) return null;

  return { key, value };
}

/**
 * Calculate transcode percent from ffmpeg's out_time_us or out_time_ms.
 * Clamps to 0–100.
 *
 * @param outTimeUs - ffmpeg out_time_us value (microseconds as string)
 * @param durationSec - total input duration in seconds
 */
export function calculatePercent(
  outTimeUs: string,
  durationSec: number,
): number {
  if (durationSec <= 0) return 0;

  const us = Number(outTimeUs);
  if (!Number.isFinite(us) || us < 0) return 0;

  const currentSec = us / 1_000_000;
  const pct = (currentSec / durationSec) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Attach a line-buffered progress parser to a readable stream.
 *
 * Handles split chunks: buffers partial lines until a newline
 * is received, then emits complete key=value pairs via onKV.
 *
 * @param stream - stderr from ffmpeg child process
 * @param onKV - callback for each parsed key/value pair
 */
export function attachProgressParser(
  stream: NodeJS.ReadableStream,
  onKV: (key: string, value: string) => void,
): void {
  let buffer = "";

  stream.on("data", (chunk: Buffer | string) => {
    buffer += typeof chunk === "string" ? chunk : chunk.toString("utf8");

    const lines = buffer.split("\n");
    // Last element is either empty (line ended with \n) or a partial line
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const kv = parseProgressLine(line);
      if (kv) {
        onKV(kv.key, kv.value);
      }
    }
  });

  // Flush any remaining buffer on stream end
  stream.on("end", () => {
    if (buffer.trim()) {
      const kv = parseProgressLine(buffer);
      if (kv) {
        onKV(kv.key, kv.value);
      }
    }
    buffer = "";
  });
}
