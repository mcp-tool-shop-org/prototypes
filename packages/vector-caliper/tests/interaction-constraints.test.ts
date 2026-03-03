/**
 * Large-Run Interaction Constraints Tests
 *
 * Verifies:
 * - Scrub rate is proportional to scale class
 * - Throttling is explicit (user sees skipped states)
 * - Hover debouncing avoids expensive lookups
 * - Selection constraints scale with state count
 * - All constraints are observable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  ScrubDirection,
  ScrubRequest,
  ScrubResult,
  HoverRequest,
  HoverResult,
  SelectionRequest,
  SelectionResult,
  AutoplayRequest,
  AutoplayResult,
  InteractionStats,

  // Classes
  ScrubRateLimiter,
  HoverDebouncer,
  SelectionConstraint,
  AutoplayController,
  InteractionManager,

  // Constants
  MAX_SELECTION_SIZE,
  MAX_AUTOPLAY_FPS,

  // Factory functions
  createInteractionManager,
  createInteractionManagerForScale,

  // Helpers
  formatConstraint,
  describeConstraints,
} from '../src/scale/interaction-constraints';

import {
  ScaleClass,
  getBudgetForScale,
  PerformanceBudget,
} from '../src/scale/budget';

// ============================================================================
// Test Helpers
// ============================================================================

function createBudget(scaleClass: ScaleClass): PerformanceBudget {
  return getBudgetForScale(scaleClass);
}

function createScrubRequest(
  from: number,
  to: number,
  timestamp: number = Date.now()
): ScrubRequest {
  return {
    fromIndex: from,
    toIndex: to,
    timestamp,
    direction: to > from ? 'forward' : 'backward',
  };
}

function createHoverRequest(
  x: number,
  y: number,
  timestamp: number = Date.now()
): HoverRequest {
  return { x, y, timestamp };
}

// ============================================================================
// Scrub Rate Limiter Tests
// ============================================================================

describe('ScrubRateLimiter', () => {
  describe('initialization', () => {
    it('should create limiter with budget', () => {
      const budget = createBudget('medium');
      const limiter = new ScrubRateLimiter(budget);

      expect(limiter).toBeDefined();
      expect(limiter.minScrubInterval).toBeGreaterThan(0);
    });

    it('should have different intervals for different scales', () => {
      const small = new ScrubRateLimiter(createBudget('small'));
      const extreme = new ScrubRateLimiter(createBudget('extreme'));

      // Extreme should have larger interval (slower scrub rate)
      expect(extreme.minScrubInterval).toBeGreaterThan(small.minScrubInterval);
    });
  });

  describe('scrub processing', () => {
    it('should allow first scrub', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));
      const request = createScrubRequest(0, 10, 1000);

      const result = limiter.process(request);

      expect(result.allowed).toBe(true);
      expect(result.actualIndex).toBe(10);
      expect(result.skippedStates).toBe(0);
      expect(result.throttled).toBe(false);
    });

    it('should throttle rapid scrubs', () => {
      // Use large scale which has slower scrub rate (100 states/sec = 10ms interval)
      const limiter = new ScrubRateLimiter(createBudget('large'));

      // First scrub
      limiter.process(createScrubRequest(0, 10, 1000));

      // Second scrub 1ms later (well within throttle window for large scale)
      const result = limiter.process(createScrubRequest(10, 100, 1001));

      expect(result.throttled).toBe(true);
      expect(result.skippedStates).toBeGreaterThan(0);
    });

    it('should allow scrubs after interval passes', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));
      const interval = limiter.minScrubInterval;

      // First scrub
      limiter.process(createScrubRequest(0, 10, 1000));

      // Second scrub after interval
      const result = limiter.process(
        createScrubRequest(10, 20, 1000 + interval + 1)
      );

      expect(result.allowed).toBe(true);
      expect(result.throttled).toBe(false);
      expect(result.actualIndex).toBe(20);
    });

    it('should track skipped states accurately', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));

      // First scrub
      limiter.process(createScrubRequest(0, 0, 1000));

      // Immediate large scrub (should be throttled and skip states)
      const result = limiter.process(createScrubRequest(0, 1000, 1001));

      expect(result.throttled).toBe(true);
      // Total distance is 1000, actual should be less
      expect(result.actualIndex).toBeLessThan(1000);
      expect(result.skippedStates).toBe(1000 - result.actualIndex);
    });

    it('should handle backward scrubs', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));

      // First scrub to position 100
      limiter.process(createScrubRequest(0, 100, 1000));

      // Wait for interval
      const interval = limiter.minScrubInterval;

      // Backward scrub
      const result = limiter.process(
        createScrubRequest(100, 50, 1000 + interval + 1)
      );

      expect(result.allowed).toBe(true);
      expect(result.actualIndex).toBe(50);
    });

    it('should provide next allowed time', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));
      const timestamp = 1000;

      const result = limiter.process(createScrubRequest(0, 10, timestamp));

      expect(result.nextAllowedTime).toBeGreaterThan(timestamp);
      expect(result.nextAllowedTime).toBe(timestamp + limiter.minScrubInterval);
    });
  });

  describe('statistics', () => {
    it('should track total requests', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));

      limiter.process(createScrubRequest(0, 10, 1000));
      limiter.process(createScrubRequest(10, 20, 2000));
      limiter.process(createScrubRequest(20, 30, 3000));

      const stats = limiter.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    it('should track throttled requests', () => {
      // Use large scale which has slower scrub rate (100 states/sec = 10ms interval)
      const limiter = new ScrubRateLimiter(createBudget('large'));

      limiter.process(createScrubRequest(0, 10, 1000));
      limiter.process(createScrubRequest(10, 20, 1001)); // Throttled
      limiter.process(createScrubRequest(20, 30, 1002)); // Throttled

      const stats = limiter.getStats();
      expect(stats.throttledRequests).toBe(2);
    });

    it('should track average latency', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));

      limiter.process(createScrubRequest(0, 10, 1000));

      const stats = limiter.getStats();
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should reset limiter state', () => {
      const limiter = new ScrubRateLimiter(createBudget('medium'));

      // Create some state
      limiter.process(createScrubRequest(0, 10, 1000));
      limiter.process(createScrubRequest(10, 20, 1001));

      // Reset
      limiter.reset();

      // Next scrub should not be throttled
      const result = limiter.process(createScrubRequest(0, 10, 1002));
      expect(result.throttled).toBe(false);
    });
  });
});

// ============================================================================
// Hover Debouncer Tests
// ============================================================================

describe('HoverDebouncer', () => {
  describe('initialization', () => {
    it('should create debouncer with budget', () => {
      const budget = createBudget('medium');
      const debouncer = new HoverDebouncer(budget);

      expect(debouncer).toBeDefined();
      expect(debouncer.debounceInterval).toBeGreaterThan(0);
    });

    it('should have different intervals for different scales', () => {
      const small = new HoverDebouncer(createBudget('small'));
      const extreme = new HoverDebouncer(createBudget('extreme'));

      // Extreme should have longer debounce
      expect(extreme.debounceInterval).toBeGreaterThan(small.debounceInterval);
    });
  });

  describe('hover processing', () => {
    it('should allow first hover', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const request = createHoverRequest(100, 100, 1000);

      const result = debouncer.process(request);

      expect(result.allowed).toBe(true);
      expect(result.debounced).toBe(false);
    });

    it('should debounce rapid position changes', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      // First hover
      debouncer.process(createHoverRequest(100, 100, 1000));

      // Immediate hover at different position
      const result = debouncer.process(createHoverRequest(200, 200, 1001));

      expect(result.allowed).toBe(false);
      expect(result.debounced).toBe(true);
    });

    it('should allow hover at same position', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      // First hover
      debouncer.process(createHoverRequest(100, 100, 1000));

      // Immediate hover at same position (within 5px threshold)
      const result = debouncer.process(createHoverRequest(102, 102, 1001));

      expect(result.allowed).toBe(true);
      expect(result.debounced).toBe(false);
    });

    it('should allow hover after debounce interval', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const interval = debouncer.debounceInterval;

      // First hover
      debouncer.process(createHoverRequest(100, 100, 1000));

      // Hover at different position after interval
      const result = debouncer.process(
        createHoverRequest(200, 200, 1000 + interval + 1)
      );

      expect(result.allowed).toBe(true);
      expect(result.debounced).toBe(false);
    });

    it('should provide next allowed time', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const timestamp = 1000;

      const result = debouncer.process(createHoverRequest(100, 100, timestamp));

      expect(result.nextAllowedTime).toBe(timestamp + debouncer.debounceInterval);
    });
  });

  describe('pending hover', () => {
    it('should store pending hover when debounced', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001));

      // Should not be ready yet
      const pending = debouncer.checkPending(1002);
      expect(pending).toBeNull();
    });

    it('should return pending hover after debounce interval', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const interval = debouncer.debounceInterval;

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001));

      // Check after interval
      const pending = debouncer.checkPending(1000 + interval + 1);
      expect(pending).not.toBeNull();
      expect(pending?.x).toBe(200);
      expect(pending?.y).toBe(200);
    });

    it('should clear pending after returning', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const interval = debouncer.debounceInterval;

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001));

      // First check returns pending
      debouncer.checkPending(1000 + interval + 1);

      // Second check should return null
      const pending = debouncer.checkPending(1000 + interval + 2);
      expect(pending).toBeNull();
    });

    it('should allow canceling pending hover', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));
      const interval = debouncer.debounceInterval;

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001));

      // Cancel
      debouncer.cancel();

      // Check after interval - should be null
      const pending = debouncer.checkPending(1000 + interval + 1);
      expect(pending).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should track total requests', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 2000));
      debouncer.process(createHoverRequest(300, 300, 3000));

      const stats = debouncer.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    it('should track debounced requests', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001)); // Debounced
      debouncer.process(createHoverRequest(300, 300, 1002)); // Debounced

      const stats = debouncer.getStats();
      expect(stats.debouncedRequests).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset debouncer state', () => {
      const debouncer = new HoverDebouncer(createBudget('medium'));

      debouncer.process(createHoverRequest(100, 100, 1000));
      debouncer.process(createHoverRequest(200, 200, 1001));

      debouncer.reset();

      // Next hover should be allowed
      const result = debouncer.process(createHoverRequest(300, 300, 1002));
      expect(result.allowed).toBe(true);
    });
  });
});

// ============================================================================
// Selection Constraint Tests
// ============================================================================

describe('SelectionConstraint', () => {
  describe('initialization', () => {
    it('should create constraint with budget', () => {
      const budget = createBudget('medium');
      const constraint = new SelectionConstraint(budget);

      expect(constraint).toBeDefined();
      expect(constraint.maxSelectionSize).toBeGreaterThan(0);
    });

    it('should have different limits for different scales', () => {
      const small = new SelectionConstraint(createBudget('small'));
      const extreme = new SelectionConstraint(createBudget('extreme'));

      // Small should allow more selection
      expect(small.maxSelectionSize).toBeGreaterThan(extreme.maxSelectionSize);
    });
  });

  describe('selection processing', () => {
    it('should allow selection within limit', () => {
      const constraint = new SelectionConstraint(createBudget('small'));

      const result = constraint.process({
        indices: [0, 1, 2, 3, 4],
        timestamp: Date.now(),
        mode: 'multi',
      });

      expect(result.allowed).toBe(true);
      expect(result.actualIndices).toEqual([0, 1, 2, 3, 4]);
      expect(result.truncated).toBe(false);
    });

    it('should truncate selection exceeding limit', () => {
      // Use large scale which allows selection but has a limit
      const constraint = new SelectionConstraint(createBudget('large'));
      const maxSize = constraint.maxSelectionSize;

      // Create selection larger than limit
      const indices = Array.from({ length: maxSize + 100 }, (_, i) => i);

      const result = constraint.process({
        indices,
        timestamp: Date.now(),
        mode: 'multi',
      });

      expect(result.allowed).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.actualIndices.length).toBe(maxSize);
      expect(result.reason).toContain('truncated');
    });

    it('should reject selection when disabled', () => {
      // Create a budget with selection disabled
      const budget = createBudget('extreme');
      // Note: extreme scale has selectionAllowed = false

      const constraint = new SelectionConstraint(budget);

      // If selection is disabled for extreme scale
      if (!constraint.selectionAllowed) {
        const result = constraint.process({
          indices: [0],
          timestamp: Date.now(),
          mode: 'single',
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('disabled');
      }
    });

    it('should handle single selection mode', () => {
      const constraint = new SelectionConstraint(createBudget('medium'));

      const result = constraint.process({
        indices: [42],
        timestamp: Date.now(),
        mode: 'single',
      });

      expect(result.allowed).toBe(true);
      expect(result.actualIndices).toEqual([42]);
    });

    it('should handle range selection mode', () => {
      const constraint = new SelectionConstraint(createBudget('medium'));

      const result = constraint.process({
        indices: [10, 11, 12, 13, 14, 15],
        timestamp: Date.now(),
        mode: 'range',
      });

      expect(result.allowed).toBe(true);
      expect(result.actualIndices).toEqual([10, 11, 12, 13, 14, 15]);
    });
  });

  describe('current selection', () => {
    it('should track current selection', () => {
      const constraint = new SelectionConstraint(createBudget('small'));

      constraint.process({
        indices: [1, 2, 3],
        timestamp: Date.now(),
        mode: 'multi',
      });

      expect(constraint.getCurrentSelection()).toEqual([1, 2, 3]);
    });

    it('should update on new selection', () => {
      const constraint = new SelectionConstraint(createBudget('small'));

      constraint.process({
        indices: [1, 2, 3],
        timestamp: Date.now(),
        mode: 'multi',
      });

      constraint.process({
        indices: [4, 5, 6],
        timestamp: Date.now(),
        mode: 'multi',
      });

      expect(constraint.getCurrentSelection()).toEqual([4, 5, 6]);
    });

    it('should clear selection', () => {
      const constraint = new SelectionConstraint(createBudget('small'));

      constraint.process({
        indices: [1, 2, 3],
        timestamp: Date.now(),
        mode: 'multi',
      });

      constraint.clearSelection();

      expect(constraint.getCurrentSelection()).toEqual([]);
    });
  });

  describe('statistics', () => {
    it('should track total requests', () => {
      const constraint = new SelectionConstraint(createBudget('small'));

      constraint.process({ indices: [1], timestamp: Date.now(), mode: 'single' });
      constraint.process({ indices: [2], timestamp: Date.now(), mode: 'single' });
      constraint.process({ indices: [3], timestamp: Date.now(), mode: 'single' });

      const stats = constraint.getStats();
      expect(stats.totalRequests).toBe(3);
    });

    it('should track truncated requests', () => {
      // Use large scale which allows selection but has a limit
      const constraint = new SelectionConstraint(createBudget('large'));
      const maxSize = constraint.maxSelectionSize;

      // Selection within limit
      constraint.process({
        indices: [1, 2],
        timestamp: Date.now(),
        mode: 'multi',
      });

      // Selection exceeding limit
      const largeIndices = Array.from({ length: maxSize + 50 }, (_, i) => i);
      constraint.process({
        indices: largeIndices,
        timestamp: Date.now(),
        mode: 'multi',
      });

      const stats = constraint.getStats();
      expect(stats.truncatedRequests).toBe(1);
    });
  });
});

// ============================================================================
// Autoplay Controller Tests
// ============================================================================

describe('AutoplayController', () => {
  describe('initialization', () => {
    it('should create controller with budget', () => {
      const budget = createBudget('medium');
      const controller = new AutoplayController(budget);

      expect(controller).toBeDefined();
      expect(controller.maxFps).toBeGreaterThan(0);
    });

    it('should have different max FPS for different scales', () => {
      const small = new AutoplayController(createBudget('small'));
      const extreme = new AutoplayController(createBudget('extreme'));

      // Small should allow higher FPS
      expect(small.maxFps).toBeGreaterThan(extreme.maxFps);
    });
  });

  describe('autoplay requests', () => {
    it('should allow autoplay when permitted', () => {
      const controller = new AutoplayController(createBudget('small'));

      const result = controller.requestStart({
        startIndex: 0,
        endIndex: 100,
        fps: 30,
        loop: false,
      });

      expect(result.allowed).toBe(true);
      expect(result.actualFps).toBeLessThanOrEqual(controller.maxFps);
    });

    it('should cap FPS at max', () => {
      const controller = new AutoplayController(createBudget('medium'));
      const maxFps = controller.maxFps;

      const result = controller.requestStart({
        startIndex: 0,
        endIndex: 100,
        fps: 1000, // Requesting very high FPS
        loop: false,
      });

      expect(result.actualFps).toBe(maxFps);
      expect(result.reason).toContain('capped');
    });

    it('should reject autoplay when not allowed', () => {
      const budget = createBudget('extreme');
      const controller = new AutoplayController(budget);

      // If autoplay is disabled for extreme scale
      if (!controller.autoplayAllowed) {
        const result = controller.requestStart({
          startIndex: 0,
          endIndex: 100,
          fps: 5,
          loop: false,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('disabled');
      }
    });

    it('should not loop for extreme scale', () => {
      const controller = new AutoplayController(createBudget('extreme'));

      // If autoplay is allowed
      if (controller.autoplayAllowed) {
        const result = controller.requestStart({
          startIndex: 0,
          endIndex: 100,
          fps: 5,
          loop: true,
        });

        // Loop should be disabled for extreme
        const state = controller.getState();
        expect(state.looping).toBe(false);
      }
    });
  });

  describe('playback control', () => {
    it('should track playing state', () => {
      const controller = new AutoplayController(createBudget('small'));

      expect(controller.getIsPlaying()).toBe(false);

      controller.requestStart({
        startIndex: 0,
        endIndex: 100,
        fps: 30,
        loop: false,
      });

      expect(controller.getIsPlaying()).toBe(true);
    });

    it('should stop playback', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 0,
        endIndex: 100,
        fps: 30,
        loop: false,
      });

      controller.stop();

      expect(controller.getIsPlaying()).toBe(false);
    });

    it('should advance frames', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 0,
        endIndex: 5,
        fps: 30,
        loop: false,
      });

      let frame = controller.nextFrame();
      expect(frame.index).toBe(1);
      expect(frame.done).toBe(false);

      frame = controller.nextFrame();
      expect(frame.index).toBe(2);
      expect(frame.done).toBe(false);
    });

    it('should reach end and stop', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 0,
        endIndex: 2,
        fps: 30,
        loop: false,
      });

      controller.nextFrame(); // 1
      controller.nextFrame(); // 2
      const frame = controller.nextFrame(); // 3 (beyond end)

      expect(frame.done).toBe(true);
      expect(controller.getIsPlaying()).toBe(false);
    });

    it('should loop when enabled', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 0,
        endIndex: 2,
        fps: 30,
        loop: true,
      });

      controller.nextFrame(); // 1
      controller.nextFrame(); // 2
      const frame = controller.nextFrame(); // Should loop to 0

      expect(frame.index).toBe(0);
      expect(frame.done).toBe(false);
      expect(controller.getIsPlaying()).toBe(true);
    });
  });

  describe('frame interval', () => {
    it('should calculate correct frame interval', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 0,
        endIndex: 100,
        fps: 30,
        loop: false,
      });

      // 30 FPS = 1000/30 ≈ 33.33ms per frame
      expect(controller.getFrameInterval()).toBeCloseTo(1000 / 30, 1);
    });
  });

  describe('state', () => {
    it('should return complete state', () => {
      const controller = new AutoplayController(createBudget('small'));

      controller.requestStart({
        startIndex: 5,
        endIndex: 50,
        fps: 30,
        loop: true,
      });

      const state = controller.getState();

      expect(state.isPlaying).toBe(true);
      expect(state.currentIndex).toBe(5);
      expect(state.endIndex).toBe(50);
      expect(state.fps).toBeLessThanOrEqual(30);
      expect(state.looping).toBe(true);
    });
  });
});

// ============================================================================
// Interaction Manager Tests
// ============================================================================

describe('InteractionManager', () => {
  describe('initialization', () => {
    it('should create manager with budget', () => {
      const budget = createBudget('medium');
      const manager = new InteractionManager(budget);

      expect(manager).toBeDefined();
      expect(manager.scaleClass).toBe('medium');
    });

    it('should expose constraint summary', () => {
      const manager = new InteractionManager(createBudget('medium'));
      const summary = manager.getConstraintSummary();

      expect(summary.scaleClass).toBe('medium');
      expect(summary.maxScrubRate).toBeGreaterThan(0);
      expect(summary.tooltipDebounceMs).toBeGreaterThan(0);
      expect(summary.maxSelectionSize).toBeGreaterThan(0);
      expect(typeof summary.selectionAllowed).toBe('boolean');
      expect(typeof summary.autoplayAllowed).toBe('boolean');
    });
  });

  describe('scrub', () => {
    it('should process scrub requests', () => {
      const manager = new InteractionManager(createBudget('medium'));

      const result = manager.scrub(0, 10);

      expect(result.allowed).toBe(true);
      expect(result.actualIndex).toBe(10);
    });

    it('should throttle rapid scrubs', () => {
      const manager = new InteractionManager(createBudget('medium'));

      manager.scrub(0, 10);
      const result = manager.scrub(10, 1000);

      // Rapid scrub should be throttled
      expect(result.actualIndex).toBeLessThan(1000);
    });
  });

  describe('hover', () => {
    it('should process hover requests', () => {
      const manager = new InteractionManager(createBudget('medium'));

      const result = manager.hover(100, 100);

      expect(result.allowed).toBe(true);
    });

    it('should check pending hovers', () => {
      const manager = new InteractionManager(createBudget('medium'));

      manager.hover(100, 100);
      manager.hover(200, 200); // Debounced

      // Pending check
      const pending = manager.checkPendingHover();
      // May or may not be ready depending on timing
      expect(pending === null || pending?.x === 200).toBe(true);
    });
  });

  describe('selection', () => {
    it('should process selection requests', () => {
      const manager = new InteractionManager(createBudget('small'));

      const result = manager.select([1, 2, 3], 'multi');

      expect(result.allowed).toBe(true);
      expect(result.actualIndices).toEqual([1, 2, 3]);
    });

    it('should track current selection', () => {
      const manager = new InteractionManager(createBudget('small'));

      manager.select([5, 10, 15], 'multi');

      expect(manager.getSelection()).toEqual([5, 10, 15]);
    });

    it('should clear selection', () => {
      const manager = new InteractionManager(createBudget('small'));

      manager.select([1, 2, 3], 'multi');
      manager.clearSelection();

      expect(manager.getSelection()).toEqual([]);
    });
  });

  describe('autoplay', () => {
    it('should start autoplay', () => {
      const manager = new InteractionManager(createBudget('small'));

      const result = manager.startAutoplay(0, 100, 30, false);

      expect(result.allowed).toBe(true);
    });

    it('should stop autoplay', () => {
      const manager = new InteractionManager(createBudget('small'));

      manager.startAutoplay(0, 100, 30, false);
      manager.stopAutoplay();

      expect(manager.getAutoplayState().isPlaying).toBe(false);
    });

    it('should advance frames', () => {
      const manager = new InteractionManager(createBudget('small'));

      manager.startAutoplay(0, 10, 30, false);

      const frame = manager.nextAutoplayFrame();

      expect(frame.index).toBe(1);
      expect(frame.done).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should aggregate stats from all controllers', () => {
      const manager = new InteractionManager(createBudget('medium'));

      // Perform various interactions
      manager.scrub(0, 10);
      manager.hover(100, 100);
      manager.select([1, 2, 3], 'multi');

      const stats = manager.getStats();

      expect(stats.totalScrubRequests).toBeGreaterThanOrEqual(1);
      expect(stats.totalHoverRequests).toBeGreaterThanOrEqual(1);
      expect(stats.totalSelectionRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('reset', () => {
    it('should reset all interaction state', () => {
      const manager = new InteractionManager(createBudget('small'));

      // Create state
      manager.scrub(0, 10);
      manager.hover(100, 100);
      manager.select([1, 2, 3], 'multi');
      manager.startAutoplay(0, 100, 30, false);

      // Reset
      manager.reset();

      expect(manager.getSelection()).toEqual([]);
      expect(manager.getAutoplayState().isPlaying).toBe(false);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  describe('createInteractionManager', () => {
    it('should create manager for small state count', () => {
      const manager = createInteractionManager(500);
      expect(manager.scaleClass).toBe('small');
    });

    it('should create manager for medium state count', () => {
      const manager = createInteractionManager(5000);
      expect(manager.scaleClass).toBe('medium');
    });

    it('should create manager for large state count', () => {
      const manager = createInteractionManager(50000);
      expect(manager.scaleClass).toBe('large');
    });

    it('should create manager for extreme state count', () => {
      const manager = createInteractionManager(500000);
      expect(manager.scaleClass).toBe('extreme');
    });
  });

  describe('createInteractionManagerForScale', () => {
    it('should create manager for specific scale', () => {
      const small = createInteractionManagerForScale('small');
      const extreme = createInteractionManagerForScale('extreme');

      expect(small.scaleClass).toBe('small');
      expect(extreme.scaleClass).toBe('extreme');
    });
  });
});

// ============================================================================
// Display Helper Tests
// ============================================================================

describe('Display Helpers', () => {
  describe('formatConstraint', () => {
    it('should format numeric constraint with unit', () => {
      const formatted = formatConstraint('Scrub rate', 100, 'states/sec');
      expect(formatted).toBe('Scrub rate: 100 states/sec');
    });

    it('should format numeric constraint without unit', () => {
      const formatted = formatConstraint('Max items', 50);
      expect(formatted).toBe('Max items: 50');
    });

    it('should format boolean constraint enabled', () => {
      const formatted = formatConstraint('Selection', true);
      expect(formatted).toBe('Selection: enabled');
    });

    it('should format boolean constraint disabled', () => {
      const formatted = formatConstraint('Autoplay', false);
      expect(formatted).toBe('Autoplay: disabled');
    });
  });

  describe('describeConstraints', () => {
    it('should return array of constraint descriptions', () => {
      const manager = createInteractionManager(5000);
      const descriptions = describeConstraints(manager);

      expect(Array.isArray(descriptions)).toBe(true);
      expect(descriptions.length).toBeGreaterThan(0);
      expect(descriptions.some((d) => d.includes('Scale class'))).toBe(true);
      expect(descriptions.some((d) => d.includes('Scrub rate'))).toBe(true);
    });

    it('should include scale-specific info', () => {
      const small = describeConstraints(createInteractionManager(100));
      const extreme = describeConstraints(createInteractionManager(500000));

      expect(small.some((d) => d.includes('small'))).toBe(true);
      expect(extreme.some((d) => d.includes('extreme'))).toBe(true);
    });
  });
});

// ============================================================================
// Scale-Based Constraint Verification Tests
// ============================================================================

describe('Scale-Based Constraints', () => {
  describe('MAX_SELECTION_SIZE', () => {
    it('should decrease with scale', () => {
      expect(MAX_SELECTION_SIZE.small).toBeGreaterThan(MAX_SELECTION_SIZE.medium);
      expect(MAX_SELECTION_SIZE.medium).toBeGreaterThan(MAX_SELECTION_SIZE.large);
      expect(MAX_SELECTION_SIZE.large).toBeGreaterThan(MAX_SELECTION_SIZE.extreme);
    });

    it('should have reasonable values', () => {
      expect(MAX_SELECTION_SIZE.small).toBeLessThanOrEqual(1000);
      expect(MAX_SELECTION_SIZE.extreme).toBeGreaterThanOrEqual(1);
    });
  });

  describe('MAX_AUTOPLAY_FPS', () => {
    it('should decrease with scale', () => {
      expect(MAX_AUTOPLAY_FPS.small).toBeGreaterThan(MAX_AUTOPLAY_FPS.medium);
      expect(MAX_AUTOPLAY_FPS.medium).toBeGreaterThan(MAX_AUTOPLAY_FPS.large);
      expect(MAX_AUTOPLAY_FPS.large).toBeGreaterThan(MAX_AUTOPLAY_FPS.extreme);
    });

    it('should have reasonable values', () => {
      expect(MAX_AUTOPLAY_FPS.small).toBeLessThanOrEqual(60);
      expect(MAX_AUTOPLAY_FPS.extreme).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  describe('scrub edge cases', () => {
    it('should handle zero-distance scrub', () => {
      const manager = createInteractionManager(5000);
      const result = manager.scrub(10, 10);

      expect(result.allowed).toBe(true);
      expect(result.actualIndex).toBe(10);
      expect(result.skippedStates).toBe(0);
    });

    it('should handle negative index scrub', () => {
      const manager = createInteractionManager(5000);
      const result = manager.scrub(0, -10);

      // Should handle gracefully (implementation dependent)
      expect(typeof result.actualIndex).toBe('number');
    });
  });

  describe('selection edge cases', () => {
    it('should handle empty selection', () => {
      const manager = createInteractionManager(5000);
      const result = manager.select([], 'multi');

      expect(result.allowed).toBe(true);
      expect(result.actualIndices).toEqual([]);
    });

    it('should handle duplicate indices', () => {
      const manager = createInteractionManager(5000);
      const result = manager.select([1, 1, 2, 2, 3], 'multi');

      expect(result.allowed).toBe(true);
      // Duplicates are preserved (implementation choice)
      expect(result.actualIndices.length).toBe(5);
    });
  });

  describe('autoplay edge cases', () => {
    it('should handle zero FPS request', () => {
      const manager = createInteractionManager(100);
      const result = manager.startAutoplay(0, 10, 0, false);

      // Should either reject or use minimum FPS
      expect(typeof result.actualFps).toBe('number');
    });

    it('should handle same start and end index', () => {
      const manager = createInteractionManager(100);
      manager.startAutoplay(5, 5, 30, false);

      const frame = manager.nextAutoplayFrame();

      // Should immediately complete
      expect(frame.done).toBe(true);
    });
  });
});
