/**
 * Performance utilities and budgets.
 */

/**
 * Performance budget thresholds.
 */
export const PERF_BUDGETS = {
  // Core Web Vitals targets
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift

  // Custom thresholds
  analysisTime: 3000, // Max time for audit analysis (ms)
  pageLoad: 1500, // Target page load time (ms)
  interactionDelay: 100, // Max delay for UI interactions (ms)
};

/**
 * Measure and log a performance metric.
 */
export function measurePerformance(
  name: string,
  startTime: number,
  budget: number
): { duration: number; withinBudget: boolean } {
  const duration = performance.now() - startTime;
  const withinBudget = duration <= budget;

  if (!withinBudget && process.env.NODE_ENV === "development") {
    console.warn(`Performance budget exceeded for "${name}": ${Math.round(duration)}ms (budget: ${budget}ms)`);
  }

  return { duration, withinBudget };
}

/**
 * Debounce function for performance optimization.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for performance optimization.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load a component or resource.
 */
export function lazyLoad<T>(loader: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    // Use requestIdleCallback if available
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        loader().then(resolve).catch(reject);
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        loader().then(resolve).catch(reject);
      }, 0);
    }
  });
}

/**
 * Report a performance observation.
 */
export function reportPerformance(metric: string, value: number): void {
  // Log locally (no external transmission)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Perf] ${metric}: ${Math.round(value)}ms`);
  }

  // Store in session for diagnostic export
  if (typeof sessionStorage !== "undefined") {
    try {
      const key = "feature-reacher-perf";
      const existing = JSON.parse(sessionStorage.getItem(key) || "[]");
      existing.push({
        metric,
        value: Math.round(value),
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 entries
      sessionStorage.setItem(key, JSON.stringify(existing.slice(-50)));
    } catch {
      // Storage unavailable
    }
  }
}

/**
 * Get stored performance metrics.
 */
export function getPerformanceMetrics(): Array<{
  metric: string;
  value: number;
  timestamp: string;
}> {
  if (typeof sessionStorage === "undefined") return [];

  try {
    return JSON.parse(sessionStorage.getItem("feature-reacher-perf") || "[]");
  } catch {
    return [];
  }
}

/**
 * Prefetch a route for faster navigation.
 */
export function prefetchRoute(path: string): void {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Check if the device is low-powered (reduce animations/complexity).
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return true;

  // Check for low memory (Chrome only)
  if ("deviceMemory" in navigator) {
    const memory = (navigator as unknown as { deviceMemory: number }).deviceMemory;
    if (memory < 4) return true;
  }

  // Check for slow connection (Chrome only)
  if ("connection" in navigator) {
    const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
    if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
      return true;
    }
  }

  return false;
}
