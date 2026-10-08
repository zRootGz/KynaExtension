/**
 * BACKGROUND.JS - Service Worker for Kyna BBB Extension
 * Minimal background script: responds to GET_MY_TAB_ID requests from content scripts
 * so they can determine their own tab ID and avoid showing overlays on wrong tabs.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "GET_MY_TAB_ID") {
    // sender.tab.id is the tab ID of the content script that sent this message
    const tabId = sender && sender.tab ? sender.tab.id : null;
    sendResponse({ tabId: tabId });
    return true; // Keep message channel open for async response
  }
});
