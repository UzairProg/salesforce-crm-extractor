document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  const recordsList = document.getElementById('recordsList');
  
  loadRecords();
  
  extractBtn.addEventListener('click', () => {
    status.textContent = 'Extracting...';
    extractBtn.disabled = true;
    
    chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_OBJECT' }, (response) => {
      extractBtn.disabled = false;
      if (chrome.runtime.lastError) {
        status.textContent = 'Error: Not on Salesforce Lightning page or no Opportunity detected';
      } else {
        status.textContent = 'Extraction complete';
        setTimeout(() => loadRecords(), 500);
      }
    });
  });
  
  function loadRecords() {
    chrome.runtime.sendMessage({ action: 'GET_STORED_DATA' }, (response) => {
      const data = response?.data || { opportunities: [], lastSync: null };
      renderRecords(data);
    });
  }
  
  function renderRecords(data) {
    recordsList.innerHTML = '';
    
    if (!data.opportunities || data.opportunities.length === 0) {
      recordsList.innerHTML = '<div id="emptyMsg">No opportunities extracted yet</div>';
      status.textContent = data.lastSync ? `Last sync: ${new Date(data.lastSync).toLocaleTimeString()}` : '';
      return;
    }
    
    data.opportunities.forEach((opp) => {
      const recordEl = document.createElement('div');
      recordEl.className = 'record';
      recordEl.innerHTML = `
        <div class="record-name">${opp.name || 'Unnamed'}</div>
        <div class="record-field"><strong>Stage:</strong> ${opp.stage || '—'}</div>
        <div class="record-field"><strong>Amount:</strong> ${opp.amount || '—'}</div>
        <div class="record-field"><strong>Probability:</strong> ${opp.probability || '—'}</div>
        <div class="record-field"><strong>Close Date:</strong> ${opp.closeDate || '—'}</div>
        <div class="record-field"><strong>Account:</strong> ${opp.accountName || '—'}</div>
        <div class="record-footer">
          <span>${new Date(opp.extractedAt).toLocaleString()}</span>
          <button class="delete-btn" data-id="${opp.id}">Delete</button>
        </div>
      `;
      
      const deleteBtn = recordEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'DELETE_RECORD', id: opp.id }, () => {
          loadRecords();
        });
      });
      
      recordsList.appendChild(recordEl);
    });
    
    status.textContent = data.lastSync ? `Last sync: ${new Date(data.lastSync).toLocaleTimeString()}` : '';
  }
});
