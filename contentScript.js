// Content script - runs on Salesforce Lightning pages
console.log('[ContentScript] Loaded on', window.location.href);

// Detect Salesforce object type by looking for field labels
function detectObjectType() {
  const bodyText = document.body.innerText.toLowerCase();
  
  // Opportunity detection - look for Opportunity-specific fields
  if (
    bodyText.includes('stage') &&
    bodyText.includes('close date') &&
    (bodyText.includes('probability') || bodyText.includes('probability (%)'))
  ) {
    console.log('[ContentScript] Detected object: opportunity');
    return 'opportunity';
  }
  
  console.log('[ContentScript] Detected object: unknown');
  return 'unknown';
}

// Watch for DOM changes to ensure page is ready
function setupMutationObserver() {
  let changeCount = 0;
  let stabilityTimer;

  const observer = new MutationObserver(() => {
    changeCount++;
    clearTimeout(stabilityTimer);
    
    stabilityTimer = setTimeout(() => {
      console.log('[ContentScript] Page stabilized after', changeCount, 'mutations');
    }, 1000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
}

// Start watching for page stability
setupMutationObserver();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ContentScript] Received message:', message.action);

  if (message.action === 'EXTRACT_CURRENT_OBJECT') {
    const objectType = detectObjectType();
    console.log('[ContentScript] Extraction triggered on', objectType, 'page');
    sendResponse({ success: true, objectType });
  }
});
