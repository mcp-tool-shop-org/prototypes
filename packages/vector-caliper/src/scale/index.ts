/**
 * Scale Module
 *
 * Handles performance budgets, chunked storage, and progressive rendering
 * for large training runs.
 *
 * Core principles:
 * - Explicit limits, not silent degradation
 * - Any degradation is visible to the user
 * - Performance claims are test-backed
 */

export * from './budget';
export * from './chunked-store';
export * from './progressive-render';
export * from './webgl-renderer';
export * from './interaction-constraints';
export * from './stress-test';
