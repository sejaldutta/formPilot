// MV3 service worker: keep it thin. It routes messages and opens the side panel.
// Heavy AI work does NOT belong here (it can be killed when idle).

chrome.runtime.onInstalled.addListener(() => {
  // Clicking the toolbar icon opens the side panel.
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[FormPilot] sidePanel setup failed', err));
});
