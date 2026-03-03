/**
 * Integration Module
 *
 * Provides the boundary between training code and VectorCaliper.
 * Training code never imports VectorCaliper internals.
 * VectorCaliper never mutates training behavior.
 */

export * from './contract';
export * from './pytorch';
export * from './jax';
export * from './streaming';
export * from './cli';
