/**
 * VectorCaliper - Diagnostics Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DiagnosticLogger,
  DEFAULT_DIAGNOSTIC_CONFIG,
} from '../src/interactive/diagnostics';

describe('DiagnosticLogger', () => {
  let logger: DiagnosticLogger;

  beforeEach(() => {
    logger = new DiagnosticLogger();
  });

  describe('Event Logging', () => {
    it('logs tooltip access events', () => {
      logger.logTooltipAccess('node-1', 'state-1', ['var1', 'var2']);

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('tooltip_access');
      expect(events[0]!.data.nodeId).toBe('node-1');
      expect(events[0]!.data.stateId).toBe('state-1');
      expect(events[0]!.data.variableCount).toBe(2);
    });

    it('logs layer toggle events', () => {
      logger.logLayerToggle('geometry', true, false, false);

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('layer_toggle');
      expect(events[0]!.data.layerId).toBe('geometry');
      expect(events[0]!.data.previousVisible).toBe(true);
      expect(events[0]!.data.newVisible).toBe(false);
      expect(events[0]!.data.isIdempotent).toBe(false);
    });

    it('logs layer focus events', () => {
      logger.logLayerFocus('enable', undefined, ['geometry']);

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('layer_focus');
      expect(events[0]!.data.action).toBe('enable');
    });

    it('logs timeline scrub events', () => {
      logger.logTimelineScrub(25, 10, 2, 'abc123');

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('timeline_scrub');
      expect(events[0]!.data.time).toBe(25);
      expect(events[0]!.data.previousTime).toBe(10);
      expect(events[0]!.data.timeDelta).toBe(15);
    });

    it('logs state compare events', () => {
      logger.logStateCompare(
        'state-a',
        'state-b',
        { increases: 3, decreases: 2, unchanged: 5 },
        true
      );

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('state_compare');
      expect(events[0]!.data.stateAId).toBe('state-a');
      expect(events[0]!.data.isSymmetric).toBe(true);
    });

    it('logs scene render events', () => {
      logger.logSceneRender('scene-1', 10, 3, 15.5);

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('scene_render');
      expect(events[0]!.data.renderTimeMs).toBe(15.5);
    });

    it('logs snapshot events', () => {
      logger.logSnapshotTaken(30, 'hash123', 8);

      const events = logger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('snapshot_taken');
      expect(events[0]!.data.hash).toBe('hash123');
    });
  });

  describe('Event Filtering', () => {
    it('filters by type', () => {
      logger.logTooltipAccess('n1', 's1', []);
      logger.logLayerToggle('l1', true, false, false);
      logger.logTooltipAccess('n2', 's2', []);

      const tooltipEvents = logger.getEventsByType('tooltip_access');
      expect(tooltipEvents.length).toBe(2);

      const layerEvents = logger.getEventsByType('layer_toggle');
      expect(layerEvents.length).toBe(1);
    });

    it('respects category filter in config', () => {
      const filteredLogger = new DiagnosticLogger({
        categories: ['tooltip_access'],
      });

      filteredLogger.logTooltipAccess('n1', 's1', []);
      filteredLogger.logLayerToggle('l1', true, false, false);

      const events = filteredLogger.getEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.type).toBe('tooltip_access');
    });
  });

  describe('Max Events', () => {
    it('trims events when over max', () => {
      const smallLogger = new DiagnosticLogger({ maxEvents: 3 });

      smallLogger.logTooltipAccess('n1', 's1', []);
      smallLogger.logTooltipAccess('n2', 's2', []);
      smallLogger.logTooltipAccess('n3', 's3', []);
      smallLogger.logTooltipAccess('n4', 's4', []);
      smallLogger.logTooltipAccess('n5', 's5', []);

      const events = smallLogger.getEvents();
      expect(events.length).toBe(3);
      // Should keep most recent
      expect(events[0]!.data.nodeId).toBe('n3');
      expect(events[2]!.data.nodeId).toBe('n5');
    });
  });

  describe('Export', () => {
    it('exports log with summary', () => {
      logger.logTooltipAccess('n1', 's1', ['v1', 'v2']);
      logger.logLayerToggle('l1', true, false, false);
      logger.logLayerToggle('l1', false, false, true); // Idempotent

      const log = logger.exportLog();

      expect(log.sessionId).toBeTruthy();
      expect(log.eventCount).toBe(3);
      expect(log.summary.tooltipAccesses).toBe(1);
      expect(log.summary.layerToggles).toBe(2);
      expect(log.summary.idempotentLayerToggles).toBe(1);
    });

    it('exports as text', () => {
      logger.logTooltipAccess('n1', 's1', []);

      const text = logger.exportText();

      expect(text).toContain('VectorCaliper Diagnostic Log');
      expect(text).toContain('tooltip_access');
      expect(text).toContain('n1');
    });
  });

  describe('Summary', () => {
    it('computes unique timeline snapshots', () => {
      logger.logTimelineScrub(10, 0, 1, 'hash1');
      logger.logTimelineScrub(20, 10, 2, 'hash2');
      logger.logTimelineScrub(10, 20, 1, 'hash1'); // Same hash as first

      const log = logger.exportLog();

      expect(log.summary.timelineScrubs).toBe(3);
      expect(log.summary.uniqueTimelineSnapshots).toBe(2);
    });

    it('counts symmetric comparisons', () => {
      logger.logStateCompare('a', 'b', { increases: 1, decreases: 1, unchanged: 1 }, true);
      logger.logStateCompare('c', 'd', { increases: 2, decreases: 0, unchanged: 1 }, true);
      logger.logStateCompare('e', 'f', { increases: 0, decreases: 1, unchanged: 2 }, false);

      const log = logger.exportLog();

      expect(log.summary.stateComparisons).toBe(3);
      expect(log.summary.symmetricComparisons).toBe(2);
    });
  });

  describe('Clear', () => {
    it('clears all events', () => {
      logger.logTooltipAccess('n1', 's1', []);
      logger.logLayerToggle('l1', true, false, false);

      expect(logger.getEvents().length).toBe(2);

      logger.clear();

      expect(logger.getEvents().length).toBe(0);
    });
  });

  describe('Verbose Mode', () => {
    it('does not throw in verbose mode', () => {
      const verboseLogger = new DiagnosticLogger({ verbose: true });

      // Should not throw
      expect(() => {
        verboseLogger.logTooltipAccess('n1', 's1', []);
      }).not.toThrow();
    });
  });

  describe('Default Config', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_DIAGNOSTIC_CONFIG.verbose).toBe(false);
      expect(DEFAULT_DIAGNOSTIC_CONFIG.maxEvents).toBe(1000);
      expect(DEFAULT_DIAGNOSTIC_CONFIG.categories).toHaveLength(0);
    });
  });
});
