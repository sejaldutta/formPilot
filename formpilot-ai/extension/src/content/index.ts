import type { ContentRequest, PingResponse } from '../lib/messaging';

chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    const response: PingResponse = {
      ok: true,
      url: location.href,
      title: document.title,
      formCount: document.forms.length,
      fieldCount: document.querySelectorAll('input, select, textarea').length,
    };
    sendResponse(response);
  }
  // Synchronous response, so no need to keep the channel open.
  return false;
});

console.debug('[FormPilot] content script loaded on', location.origin);
