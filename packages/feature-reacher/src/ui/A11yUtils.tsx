"use client";

import { useEffect, useRef, useCallback, type KeyboardEvent } from "react";

/**
 * Accessibility utilities and components.
 */

/**
 * Keyboard navigation hook for lists and menus.
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  itemCount: number,
  onSelect?: (index: number) => void
) {
  const containerRef = useRef<T>(null);
  const focusedIndex = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusedIndex.current = Math.min(focusedIndex.current + 1, itemCount - 1);
          focusItem(containerRef.current, focusedIndex.current);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusedIndex.current = Math.max(focusedIndex.current - 1, 0);
          focusItem(containerRef.current, focusedIndex.current);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onSelect?.(focusedIndex.current);
          break;
        case "Home":
          e.preventDefault();
          focusedIndex.current = 0;
          focusItem(containerRef.current, 0);
          break;
        case "End":
          e.preventDefault();
          focusedIndex.current = itemCount - 1;
          focusItem(containerRef.current, itemCount - 1);
          break;
      }
    },
    [itemCount, onSelect]
  );

  return { containerRef, handleKeyDown };
}

function focusItem(container: HTMLElement | null, index: number) {
  if (!container) return;
  const items = container.querySelectorAll<HTMLElement>('[role="listitem"], [role="option"], [data-focusable]');
  items[index]?.focus();
}

/**
 * Skip link component for keyboard navigation.
 */
export function SkipLink({ targetId, children }: { targetId: string; children: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
    >
      {children}
    </a>
  );
}

/**
 * Visually hidden text for screen readers.
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Focus trap for modals and dialogs.
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * Announce changes to screen readers.
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", priority);
    el.setAttribute("aria-atomic", "true");
    el.className = "sr-only";
    el.textContent = message;

    document.body.appendChild(el);

    // Remove after announcement is read
    setTimeout(() => el.remove(), 1000);
  }, []);

  return announce;
}

/**
 * ARIA props for expandable sections.
 */
export function getExpandableProps(id: string, isExpanded: boolean) {
  return {
    button: {
      "aria-expanded": isExpanded,
      "aria-controls": id,
    },
    panel: {
      id,
      role: "region" as const,
      "aria-hidden": !isExpanded,
    },
  };
}

/**
 * ARIA props for risk badges.
 */
export function getRiskBadgeAriaLabel(level: string, score: number): string {
  return `Risk level: ${level}, score: ${Math.round(score * 100)} percent`;
}

/**
 * ARIA props for sparkline visualizations.
 */
export function getSparklineAriaLabel(
  points: number[],
  direction: "improving" | "worsening" | "stable"
): string {
  const trend =
    direction === "improving"
      ? "improving trend"
      : direction === "worsening"
        ? "worsening trend"
        : "stable trend";

  const latest = points[points.length - 1];
  const first = points[0];
  const change = Math.round((latest - first) * 100);

  return `Sparkline chart showing ${trend}. ${points.length} data points. Change: ${change >= 0 ? "+" : ""}${change} percent`;
}

/**
 * Loading state announcer.
 */
export function LoadingAnnouncer({
  isLoading,
  loadingMessage = "Loading...",
  loadedMessage = "Content loaded",
}: {
  isLoading: boolean;
  loadingMessage?: string;
  loadedMessage?: string;
}) {
  const wasLoading = useRef(false);

  useEffect(() => {
    if (isLoading && !wasLoading.current) {
      announceToScreenReader(loadingMessage);
    } else if (!isLoading && wasLoading.current) {
      announceToScreenReader(loadedMessage);
    }
    wasLoading.current = isLoading;
  }, [isLoading, loadingMessage, loadedMessage]);

  return null;
}

function announceToScreenReader(message: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.className = "sr-only";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
