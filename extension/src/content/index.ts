import type { ContentRequest, DetectFormsResponse, PingResponse } from '../lib/messaging';
import { detectForms } from './detector/form-detector';
import { highlightField } from './highlight';

chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
  switch (message?.type) {
    case 'PING': {
      const response: PingResponse = {
        ok: true,
        url: location.origin + location.pathname,
        title: document.title,
        formCount: document.forms.length,
        fieldCount: document.querySelectorAll('input, select, textarea').length,
      };
      sendResponse(response);
      break;
    }
    case 'DETECT_FORMS': {
      const response: DetectFormsResponse = {
        ok: true,
        url: location.origin + location.pathname,
        title: document.title,
        forms: detectForms(document),
      };
      sendResponse(response);
      break;
    }
    case 'HIGHLIGHT_FIELD': {
      sendResponse({ ok: highlightField(message.fieldId) });
      break;
    }
  }
  // All responses are synchronous.
  return false;
});

console.debug('[FormPilot] content script loaded on', location.origin);
