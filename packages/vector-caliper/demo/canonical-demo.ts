/**
 * Canonical Demo - VectorCaliper v1.0
 *
 * This script generates the canonical demo artifacts for VectorCaliper.
 * The output is deterministic: same input → same output, byte-for-byte.
 *
 * Usage:
 *   npx ts-node demo/canonical-demo.ts
 *
 * Output:
 *   demo/output/canonical-trajectory.json   — The demo dataset
 *   demo/output/canonical-trajectory.svg    — The rendered visualization
 *   demo/output/canonical-manifest.json     — Metadata about generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Demo Data Generation
// ============================================================================

/**
 * Deterministic pseudo-random number generator
 * Uses a simple LCG for reproducibility across platforms
 */
class DeterministicRandom {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  next(): number {
    // LCG parameters from Numerical Recipes
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Generate canonical demo trajectory
 *
 * This simulates a typical neural network training run with:
 * - Initial high loss, gradual decrease
 * - Early high entropy, gradual focusing
 * - Three distinct regimes: warmup, learning, convergence
 */
function generateCanonicalTrajectory(): object[] {
  const rng = new DeterministicRandom(42);
  const states: object[] = [];

  const totalSteps = 500;

  for (let step = 0; step < totalSteps; step++) {
    const progress = step / totalSteps;

    // Regime detection
    let regime: string;
    if (progress < 0.1) {
      regime = 'warmup';
    } else if (progress < 0.7) {
      regime = 'learning';
    } else {
      regime = 'convergence';
    }

    // Loss: exponential decay with noise
    const baseLoss = 2.5 * Math.exp(-3 * progress) + 0.05;
    const loss = baseLoss + rng.nextRange(-0.02, 0.02);

    // Accuracy: sigmoid growth
    const baseAccuracy = 1 / (1 + Math.exp(-10 * (progress - 0.3)));
    const accuracy = Math.min(0.98, baseAccuracy + rng.nextRange(-0.01, 0.01));

    // Entropy: high initially, decreases
    const baseEntropy = 2.5 * Math.exp(-2 * progress) + 0.3;
    const entropy = baseEntropy + rng.nextRange(-0.1, 0.1);

    // Margin: low initially, increases
    const baseMargin = 0.1 + 0.8 * progress;
    const margin = Math.min(0.95, baseMargin + rng.nextRange(-0.05, 0.05));

    // Calibration error: U-shaped (high at start and end)
    const calibration = 0.05 + 0.15 * Math.abs(progress - 0.5);

    // Geometry
    const effectiveDimension = 5 + 10 * progress + rng.nextRange(-0.5, 0.5);
    const anisotropy = 3 - 2 * progress + rng.nextRange(-0.1, 0.1);
    const spread = 2 + 5 * progress + rng.nextRange(-0.2, 0.2);
    const density = 0.3 + 0.5 * progress + rng.nextRange(-0.05, 0.05);

    // Dynamics
    const velocity = Math.max(0.01, 0.5 * Math.exp(-2 * progress) + rng.nextRange(-0.02, 0.02));
    const acceleration = regime === 'learning' ? -0.1 : 0;
    const stability = 0.5 + 0.4 * progress + rng.nextRange(-0.05, 0.05);

    states.push({
      id: `state-${step.toString().padStart(4, '0')}`,
      step,
      timestamp: step * 1000, // 1 second per step
      variables: {
        // Performance
        loss: Math.max(0.01, loss),
        accuracy: Math.max(0, Math.min(1, accuracy)),

        // Uncertainty
        entropy: Math.max(0.1, entropy),
        margin: Math.max(0, Math.min(1, margin)),
        calibration: Math.max(0, Math.min(1, calibration)),

        // Geometry
        effectiveDimension: Math.max(1, effectiveDimension),
        anisotropy: Math.max(1, anisotropy),
        spread: Math.max(0.1, spread),
        density: Math.max(0, Math.min(1, density)),

        // Dynamics
        velocity: Math.max(0, velocity),
        acceleration,
        stability: Math.max(0, Math.min(1, stability)),
      },
      metadata: {
        regime,
        epoch: Math.floor(step / 50),
      },
    });
  }

  return states;
}

/**
 * Generate canonical SVG output
 *
 * This is a simplified SVG that demonstrates VectorCaliper's output format
 * without requiring the full rendering pipeline.
 */
function generateCanonicalSVG(states: object[]): string {
  const width = 800;
  const height = 600;
  const margin = 50;

  // Project states to 2D using simple linear mapping
  const points = states.map((state: any, i: number) => {
    const progress = i / states.length;

    // X: progress-based with loss modulation
    const x = margin + (width - 2 * margin) * progress;

    // Y: loss-based (inverted, so lower loss = higher on screen)
    const normalizedLoss = Math.min(1, state.variables.loss / 2.5);
    const y = margin + (height - 2 * margin) * normalizedLoss;

    return { x, y, state };
  });

  // Build SVG
  const svgLines: string[] = [];

  svgLines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgLines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  svgLines.push(`  <title>VectorCaliper Canonical Demo - Training Trajectory</title>`);
  svgLines.push(`  <desc>500 states showing loss descent during neural network training</desc>`);

  // Background
  svgLines.push(`  <rect x="0" y="0" width="${width}" height="${height}" fill="#f8f9fa" />`);

  // Axes
  svgLines.push(`  <g id="axes" stroke="#ccc" stroke-width="1">`);
  svgLines.push(`    <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" />`);
  svgLines.push(`    <line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" />`);
  svgLines.push(`  </g>`);

  // Axis labels
  svgLines.push(`  <g id="labels" font-family="sans-serif" font-size="12" fill="#666">`);
  svgLines.push(`    <text x="${width / 2}" y="${height - 15}" text-anchor="middle">Step</text>`);
  svgLines.push(`    <text x="15" y="${height / 2}" text-anchor="middle" transform="rotate(-90, 15, ${height / 2})">Loss</text>`);
  svgLines.push(`  </g>`);

  // Trajectory path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  svgLines.push(`  <path id="trajectory" d="${pathData}" fill="none" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`);

  // State points (every 10th state to avoid clutter)
  svgLines.push(`  <g id="states">`);
  points.filter((_, i) => i % 10 === 0).forEach((p) => {
    const state = p.state;
    const regime = state.metadata.regime;

    // Color by regime
    let fill: string;
    switch (regime) {
      case 'warmup':
        fill = '#e74c3c';
        break;
      case 'learning':
        fill = '#f39c12';
        break;
      case 'convergence':
        fill = '#27ae60';
        break;
      default:
        fill = '#666';
    }

    // Radius by accuracy
    const radius = 3 + 4 * state.variables.accuracy;

    // Opacity by confidence (margin)
    const opacity = 0.3 + 0.7 * state.variables.margin;

    svgLines.push(`    <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${fill}" opacity="${opacity.toFixed(2)}" data-vc-state-id="${state.id}" data-vc-step="${state.step}" />`);
  });
  svgLines.push(`  </g>`);

  // Legend
  svgLines.push(`  <g id="legend" transform="translate(${width - 120}, 20)">`);
  svgLines.push(`    <text x="0" y="0" font-family="sans-serif" font-size="11" font-weight="bold" fill="#333">Regime</text>`);
  svgLines.push(`    <circle cx="10" cy="20" r="5" fill="#e74c3c" />`);
  svgLines.push(`    <text x="20" y="24" font-family="sans-serif" font-size="10" fill="#666">warmup</text>`);
  svgLines.push(`    <circle cx="10" cy="40" r="5" fill="#f39c12" />`);
  svgLines.push(`    <text x="20" y="44" font-family="sans-serif" font-size="10" fill="#666">learning</text>`);
  svgLines.push(`    <circle cx="10" cy="60" r="5" fill="#27ae60" />`);
  svgLines.push(`    <text x="20" y="64" font-family="sans-serif" font-size="10" fill="#666">convergence</text>`);
  svgLines.push(`  </g>`);

  // VectorCaliper watermark
  svgLines.push(`  <text x="${width - 10}" y="${height - 10}" font-family="sans-serif" font-size="9" fill="#ccc" text-anchor="end">VectorCaliper v1.0</text>`);

  svgLines.push(`</svg>`);

  return svgLines.join('\n');
}

/**
 * Generate manifest with checksums
 */
function generateManifest(trajectoryJson: string, svg: string): object {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generator: 'VectorCaliper Canonical Demo',
    seed: 42,
    artifacts: {
      trajectory: {
        filename: 'canonical-trajectory.json',
        states: 500,
        sha256: crypto.createHash('sha256').update(trajectoryJson).digest('hex'),
      },
      svg: {
        filename: 'canonical-trajectory.svg',
        width: 800,
        height: 600,
        sha256: crypto.createHash('sha256').update(svg).digest('hex'),
      },
    },
    guarantees: [
      'Deterministic: same seed → same output',
      'States are exact, not interpolated',
      'Visual encoding matches v1 semantic mapping',
      'SVG is Inkscape-compatible',
    ],
  };
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  console.log('VectorCaliper Canonical Demo Generator');
  console.log('======================================\n');

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate trajectory
  console.log('Generating canonical trajectory (500 states)...');
  const trajectory = generateCanonicalTrajectory();
  const trajectoryJson = JSON.stringify(trajectory, null, 2);
  const trajectoryPath = path.join(outputDir, 'canonical-trajectory.json');
  fs.writeFileSync(trajectoryPath, trajectoryJson);
  console.log(`  → ${trajectoryPath}`);

  // Generate SVG
  console.log('Generating canonical SVG...');
  const svg = generateCanonicalSVG(trajectory);
  const svgPath = path.join(outputDir, 'canonical-trajectory.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`  → ${svgPath}`);

  // Generate manifest
  console.log('Generating manifest...');
  const manifest = generateManifest(trajectoryJson, svg);
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestPath = path.join(outputDir, 'canonical-manifest.json');
  fs.writeFileSync(manifestPath, manifestJson);
  console.log(`  → ${manifestPath}`);

  console.log('\nDone.');
  console.log('\nTo verify determinism, run again and compare checksums:');
  console.log(`  Trajectory SHA256: ${(manifest as any).artifacts.trajectory.sha256}`);
  console.log(`  SVG SHA256: ${(manifest as any).artifacts.svg.sha256}`);
}

main();
