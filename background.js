// Background service worker - relays messages to content script

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.action);

  if (message.action === 'EXTRACT_CURRENT_OBJECT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]?.id) {
        console.warn('[Background] No active tab found');
        return;
      }

      console.log('[Background] Forwarding to tab:', tabs[0].id, 'URL:', tabs[0].url);
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'EXTRACT_CURRENT_OBJECT' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Background] sendMessage error:', chrome.runtime.lastError.message);
          } else if (response) {
            console.log('[Background] Content script response:', response);
          }
        }
      );
    });
  }
});
