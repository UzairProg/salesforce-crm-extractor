// Background service worker - coordinator for extraction and storage

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXTRACT_CURRENT_OBJECT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]?.id) {
        console.warn('[Background] No active tab found');
        return;
      }
      
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'EXTRACT_CURRENT_OBJECT' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Error:', chrome.runtime.lastError.message);
          } else if (response && response.data) {
            storeExtractedData(response.data);
          }
        }
      );
    });
  } else if (message.action === 'GET_STORED_DATA') {
    chrome.storage.local.get('salesforceData', (result) => {
      sendResponse({ data: result.salesforceData || { opportunities: [], lastSync: null } });
    });
    return true;
  } else if (message.action === 'DELETE_RECORD') {
    deleteRecord(message.id);
    sendResponse({ success: true });
  }
});

function storeExtractedData(opportunityData) {
  chrome.storage.local.get('salesforceData', (result) => {
    const data = result.salesforceData || { opportunities: [], lastSync: null };
    
    const existingIndex = data.opportunities.findIndex(
      (opp) => opp.name === opportunityData.name && opp.accountName === opportunityData.accountName
    );
    
    opportunityData.extractedAt = Date.now();
    
    if (existingIndex >= 0) {
      data.opportunities[existingIndex] = opportunityData;
    } else {
      data.opportunities.push(opportunityData);
    }
    
    data.lastSync = Date.now();
    chrome.storage.local.set({ salesforceData: data });
  });
}

function deleteRecord(id) {
  chrome.storage.local.get('salesforceData', (result) => {
    const data = result.salesforceData || { opportunities: [], lastSync: null };
    data.opportunities = data.opportunities.filter((opp) => opp.id !== id);
    chrome.storage.local.set({ salesforceData: data });
  });
}
