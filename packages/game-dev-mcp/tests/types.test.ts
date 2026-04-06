import { describe, it, expect } from 'vitest';
import {
  ConfigSchema,
  VectorSchema,
  RotatorSchema,
  ErrorCode,
} from '../src/types.js';

describe('ConfigSchema', () => {
  it('provides defaults for empty input', () => {
    const config = ConfigSchema.parse({});
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(30010);
    expect(config.timeout).toBe(10000);
    expect(config.logLevel).toBe('info');
  });

  it('accepts valid custom config', () => {
    const config = ConfigSchema.parse({
      host: '192.168.1.100',
      port: 8080,
      timeout: 5000,
      logLevel: 'debug',
    });
    expect(config.host).toBe('192.168.1.100');
    expect(config.port).toBe(8080);
    expect(config.timeout).toBe(5000);
    expect(config.logLevel).toBe('debug');
  });

  it('rejects port out of range', () => {
    expect(() => ConfigSchema.parse({ port: 0 })).toThrow();
    expect(() => ConfigSchema.parse({ port: 70000 })).toThrow();
    expect(() => ConfigSchema.parse({ port: -1 })).toThrow();
  });

  it('rejects timeout below minimum', () => {
    expect(() => ConfigSchema.parse({ timeout: 500 })).toThrow();
  });

  it('rejects timeout above maximum', () => {
    expect(() => ConfigSchema.parse({ timeout: 100000 })).toThrow();
  });

  it('rejects invalid logLevel', () => {
    expect(() => ConfigSchema.parse({ logLevel: 'verbose' })).toThrow();
  });

  it('rejects non-integer port', () => {
    expect(() => ConfigSchema.parse({ port: 3000.5 })).toThrow();
  });
});

describe('VectorSchema', () => {
  it('provides zero defaults', () => {
    const v = VectorSchema.parse({});
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
  });

  it('accepts custom values', () => {
    const v = VectorSchema.parse({ x: 100, y: -50, z: 300.5 });
    expect(v.x).toBe(100);
    expect(v.y).toBe(-50);
    expect(v.z).toBe(300.5);
  });

  it('rejects non-number values', () => {
    expect(() => VectorSchema.parse({ x: 'abc' })).toThrow();
  });
});

describe('RotatorSchema', () => {
  it('provides zero defaults', () => {
    const r = RotatorSchema.parse({});
    expect(r.pitch).toBe(0);
    expect(r.yaw).toBe(0);
    expect(r.roll).toBe(0);
  });

  it('accepts rotation values', () => {
    const r = RotatorSchema.parse({ pitch: 45, yaw: 90, roll: -180 });
    expect(r.pitch).toBe(45);
    expect(r.yaw).toBe(90);
    expect(r.roll).toBe(-180);
  });
});

describe('ErrorCode', () => {
  it('has expected error codes', () => {
    expect(ErrorCode.CONNECTION_FAILED).toBe('CONNECTION_FAILED');
    expect(ErrorCode.OBJECT_NOT_FOUND).toBe('OBJECT_NOT_FOUND');
    expect(ErrorCode.INVALID_PARAMS).toBe('INVALID_PARAMS');
    expect(ErrorCode.TIMEOUT).toBe('TIMEOUT');
    expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });

  it('has all expected codes', () => {
    const codes = Object.keys(ErrorCode);
    expect(codes.length).toBeGreaterThanOrEqual(9);
  });
});
