"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Microsoft Teams integration utilities.
 * Provides context detection and SDK helpers.
 */

type TeamsTheme = "default" | "dark" | "contrast";

interface TeamsContext {
  isInTeams: boolean;
  theme: TeamsTheme;
  locale: string;
  entityId: string | null;
}

interface TabSettings {
  entityId: string;
  contentUrl: string;
  suggestedDisplayName: string;
  websiteUrl?: string;
}

// Teams SDK type (simplified)
interface MicrosoftTeams {
  initialize: (callback?: () => void) => void;
  getContext: (callback: (context: {
    theme?: string;
    locale?: string;
    entityId?: string;
  }) => void) => void;
  registerOnThemeChangeHandler: (handler: (theme: string) => void) => void;
  settings: {
    setValidityState: (valid: boolean) => void;
    registerOnSaveHandler: (handler: (evt: { notifySuccess: () => void }) => void) => void;
    setSettings: (settings: {
      entityId: string;
      contentUrl: string;
      suggestedDisplayName: string;
      websiteUrl?: string;
    }) => void;
  };
}

declare global {
  interface Window {
    microsoftTeams?: MicrosoftTeams;
  }
}

/**
 * Hook to detect and use Teams context.
 */
export function useTeamsContext(): TeamsContext & {
  notifySuccess: (settings: TabSettings) => void;
} {
  const [context, setContext] = useState<TeamsContext>({
    isInTeams: false,
    theme: "default",
    locale: "en-us",
    entityId: null,
  });

  useEffect(() => {
    // Check if we're in an iframe (Teams embeds as iframe)
    const isIframe = typeof window !== "undefined" && window.self !== window.top;

    // Try to initialize Teams SDK
    if (typeof window !== "undefined" && window.microsoftTeams) {
      const teams = window.microsoftTeams;

      teams.initialize(() => {
        teams.getContext((ctx) => {
          setContext({
            isInTeams: true,
            theme: (ctx.theme as TeamsTheme) || "default",
            locale: ctx.locale || "en-us",
            entityId: ctx.entityId || null,
          });
        });

        // Listen for theme changes
        teams.registerOnThemeChangeHandler((theme) => {
          setContext((prev) => ({
            ...prev,
            theme: theme as TeamsTheme,
          }));
        });
      });
    } else if (isIframe) {
      // We're in an iframe but Teams SDK isn't loaded
      // This might still be Teams, so set a fallback
      // Use setTimeout to avoid synchronous state updates in effect
      setTimeout(() => {
        setContext((prev) => ({
          ...prev,
          isInTeams: true, // Assume Teams if in iframe
        }));
      }, 0);
    }
  }, []);

  const notifySuccess = useCallback((settings: TabSettings) => {
    if (typeof window !== "undefined" && window.microsoftTeams) {
      const teams = window.microsoftTeams;

      teams.settings.setSettings({
        entityId: settings.entityId,
        contentUrl: settings.contentUrl,
        suggestedDisplayName: settings.suggestedDisplayName,
        websiteUrl: settings.websiteUrl,
      });

      // Register save handler
      teams.settings.registerOnSaveHandler((evt) => {
        evt.notifySuccess();
      });

      // Mark configuration as valid
      teams.settings.setValidityState(true);
    }
  }, []);

  return { ...context, notifySuccess };
}

/**
 * Check if running in Teams environment.
 * Use this for quick checks without the full hook.
 */
export function isInTeamsEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Teams SDK
  if (window.microsoftTeams) return true;

  // Check for iframe (Teams embeds apps)
  if (window.self !== window.top) {
    // Additional check: Teams sets specific URL parameters
    const params = new URLSearchParams(window.location.search);
    return params.has("theme") || params.has("locale");
  }

  return false;
}

/**
 * Get current Teams theme from URL or context.
 */
export function getTeamsTheme(): TeamsTheme {
  if (typeof window === "undefined") return "default";

  // Check URL params first (Teams passes theme in URL)
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get("theme");
  if (urlTheme && ["default", "dark", "contrast"].includes(urlTheme)) {
    return urlTheme as TeamsTheme;
  }

  // Check system preference as fallback
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "default";
}

/**
 * Apply Teams theme to the document.
 */
export function applyTeamsTheme(theme: TeamsTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  switch (theme) {
    case "dark":
      root.classList.add("dark");
      root.classList.remove("contrast");
      break;
    case "contrast":
      root.classList.add("dark", "contrast");
      break;
    default:
      root.classList.remove("dark", "contrast");
  }
}
