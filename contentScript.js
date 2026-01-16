// Content script - DOM extraction from Salesforce Lightning pages
console.log('[ContentScript] Loaded on', window.location.href);

let statusIndicator = null;
let pageObserver = null;

function detectObjectType() {
  const requiredLabels = ['stage', 'close date', 'probability (%)', 'amount'];
  const foundLabels = new Set();
  
  // Search for exact label matches in the DOM
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let textNode;
  while (textNode = walker.nextNode()) {
    const text = textNode.textContent.trim().toLowerCase();
    if (text.length > 0 && text.length < 50) {
      for (const label of requiredLabels) {
        if (text === label) {
          foundLabels.add(label);
        }
      }
    }
  }
  
  // Opportunity detected only if at least 2 labels found
  const isOpportunity = foundLabels.size >= 2;
  if (isOpportunity) {
    console.log('[ContentScript] Detected Opportunity. Found', foundLabels.size, 'labels:', Array.from(foundLabels));
  }
  return isOpportunity ? 'opportunity' : 'unknown';
}

function showStatusIndicator(text) {
  removeStatusIndicator();
  
  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'open' });
  
  shadow.innerHTML = `
    <style>
      .indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #0176d3;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        font-family: sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    </style>
    <div class="indicator">${text}</div>
  `;
  
  document.body.appendChild(container);
  statusIndicator = container;
}

function removeStatusIndicator() {
  if (statusIndicator) {
    statusIndicator.remove();
    statusIndicator = null;
  }
}

function extractOpportunityName() {
  // Strategy 1: Look for h1 with record title
  const h1 = document.querySelector('h1[data-aura-rendered-by], h1.slds-page-header__title');
  if (h1) {
    const name = h1.textContent.trim();
    if (name && name.length < 200) {
      return name;
    }
  }
  
  // Strategy 2: Look for specific Lightning component title
  const titleSlot = document.querySelector('slot[name="primaryField"] lightning-formatted-text');
  if (titleSlot) {
    const name = titleSlot.textContent.trim();
    if (name && name.length < 200) {
      return name;
    }
  }
  
  return null;
}

function findValueForLabel(labelText, retryOnPlaceholder = false) {
  // Find text node with exact label match
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let textNode;
  while (textNode = walker.nextNode()) {
    if (textNode.textContent.trim().toLowerCase() === labelText.toLowerCase()) {
      const labelEl = textNode.parentElement;
      if (!labelEl) continue;
      
      // Strategy 1: Next element sibling
      let next = labelEl.nextElementSibling;
      if (next) {
        const value = next.textContent.trim();
        if (value && value.length < 100) {
          if (value === '—' && retryOnPlaceholder) {
            // Wait and retry once for dynamic values
            continue;
          }
          if (value !== '—') {
            return cleanValue(value, labelText);
          }
        }
      }
      
      // Strategy 2: Parent's next element sibling
      const parent = labelEl.parentElement;
      if (parent) {
        const nextParent = parent.nextElementSibling;
        if (nextParent && nextParent.textContent) {
          const value = nextParent.textContent.trim();
          if (value && value.length < 100) {
            if (value === '—' && retryOnPlaceholder) {
              continue;
            }
            if (value !== '—' && !value.toLowerCase().includes(labelText.toLowerCase())) {
              return cleanValue(value, labelText);
            }
          }
        }
      }
      
      // Strategy 3: Check parent's children (but only immediate children)
      if (parent && parent.children.length < 10) {
        for (let child of parent.children) {
          if (child !== labelEl) {
            const value = child.textContent.trim();
            if (value && value.length < 100) {
              if (value === '—' && retryOnPlaceholder) {
                continue;
              }
              if (value !== '—' && !value.toLowerCase().includes(labelText.toLowerCase())) {
                return cleanValue(value, labelText);
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

function cleanValue(value, labelText) {
  // Remove common Salesforce UI noise
  let cleaned = value
    .replace(/\bOpen\b/gi, '')
    .replace(/\bPreview\b/gi, '')
    .replace(/\bEdit\b/gi, '')
    .replace(/\bDelete\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If cleaned value contains the label, try to extract just the value part
  if (cleaned.toLowerCase().includes(labelText.toLowerCase())) {
    const parts = cleaned.split(labelText);
    if (parts.length > 1) {
      cleaned = parts[1].trim();
    }
  }
  
  return cleaned || null;
}

function extractOpportunityData() {
  showStatusIndicator('Extracting Opportunity...');
  
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }

  const name = extractOpportunityName();
  
  let stage = findValueForLabel('Stage', true);
  let probability = findValueForLabel('Probability (%)', true) || findValueForLabel('Probability', true);
  

  if (stage === null || stage === '—') {
    setTimeout(() => {
      stage = findValueForLabel('Stage', false);
    }, 200);
  }
  if (probability === null || probability === '—') {
    setTimeout(() => {
      probability = findValueForLabel('Probability (%)', false) || findValueForLabel('Probability', false);
    }, 200);
  }
  
  const data = {
    id: Date.now().toString(),
    name: name,
    stage: stage,
    amount: findValueForLabel('Amount'),
    probability: probability,
    closeDate: findValueForLabel('Close Date'),
    accountName: findValueForLabel('Account Name') || findValueForLabel('Account')
  };
  
  console.log('[ContentScript] Extraction complete:', {
    name: data.name ? 'present' : 'missing',
    stage: data.stage ? 'present' : 'missing',
    amount: data.amount ? 'present' : 'missing',
    probability: data.probability ? 'present' : 'missing',
    closeDate: data.closeDate ? 'present' : 'missing',
    accountName: data.accountName ? 'present' : 'missing'
  });
  
  setTimeout(() => {
    showStatusIndicator('Extraction complete');
    setTimeout(() => {
      removeStatusIndicator();
    }, 1500);
  }, 300);
  
  return data;
}

function waitForPageReady() {
  if (detectObjectType() === 'opportunity') {
    console.log('[ContentScript] Opportunity labels already present');
    return;
  }
  
  pageObserver = new MutationObserver(() => {
    if (detectObjectType() === 'opportunity') {
      console.log('[ContentScript] Opportunity labels detected via observer');
      pageObserver.disconnect();
      pageObserver = null;
    }
  });
  
  pageObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
    attributes: false
  });
  
  setTimeout(() => {
    if (pageObserver) {
      pageObserver.disconnect();
      pageObserver = null;
      console.log('[ContentScript] Page ready timeout reached');
    }
  }, 5000);
}


waitForPageReady();


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXTRACT_CURRENT_OBJECT') {
    const objectType = detectObjectType();
    
    if (objectType === 'opportunity') {
      const data = extractOpportunityData();
      sendResponse({ data });
    } else {
      removeStatusIndicator();
      sendResponse({ data: null });
    }
  }
});
