/**
 * Typed message contract between the side panel, background and content script.
 * Add new message types here first, then handle them on the receiving side.
 */
import type { DetectedForm } from './formTypes';

export type ContentRequest =
  | { type: 'PING' }
  | { type: 'DETECT_FORMS' }
  | { type: 'HIGHLIGHT_FIELD'; fieldId: string };

export type PingResponse = {
  ok: true;
  url: string;
  title: string;
  formCount: number;
  fieldCount: number;
};

export type DetectFormsResponse = {
  ok: true;
  /** Origin and path only. Query strings can carry tokens, so they are dropped. */
  url: string;
  title: string;
  forms: DetectedForm[];
};

export type HighlightResponse = { ok: boolean };

export type ContentResponseMap = {
  PING: PingResponse;
  DETECT_FORMS: DetectFormsResponse;
  HIGHLIGHT_FIELD: HighlightResponse;
};

/** Send a typed request to the content script in the active tab. */
export async function sendToActiveTab<T extends ContentRequest['type']>(
  request: ContentRequest & { type: T },
): Promise<ContentResponseMap[T]> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    throw new Error('No active tab found.');
  }
  try {
    return (await chrome.tabs.sendMessage(tab.id, request)) as ContentResponseMap[T];
  } catch {
    throw new Error(
      'FormPilot is not active on this page. Reload the page, or open a supported government form page, and try again.',
    );
  }
}
