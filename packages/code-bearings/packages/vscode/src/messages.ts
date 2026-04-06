/**
 * Message protocol between the Review webview and the extension host.
 *
 * Webview → Host: user interactions that need editor-level actions.
 * Host → Webview: state updates that re-render the surface.
 */

import type { ReviewMode } from "@code-bearings/core";

// ── Webview → Host ──

export interface OpenFileMessage {
  type: "openFile";
  filePath: string;
  line: number;
}

export interface SwitchModeMessage {
  type: "switchMode";
  mode: ReviewMode;
}

export interface FocusModuleMessage {
  type: "focusModule";
  moduleName: string;
  index: number;
}

export interface WebviewReadyMessage {
  type: "ready";
}

export interface RefreshReviewMessage {
  type: "refreshReview";
}

export type WebviewToHostMessage =
  | OpenFileMessage
  | SwitchModeMessage
  | FocusModuleMessage
  | WebviewReadyMessage
  | RefreshReviewMessage;

// ── Host → Webview ──

export interface UpdateHtmlMessage {
  type: "updateHtml";
  html: string;
}

export interface FocusIndexMessage {
  type: "focusIndex";
  index: number;
}

export interface StaleBannerMessage {
  type: "staleBanner";
  visible: boolean;
  reason: string;
}

export type HostToWebviewMessage =
  | UpdateHtmlMessage
  | FocusIndexMessage
  | StaleBannerMessage;
