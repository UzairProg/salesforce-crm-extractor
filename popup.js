document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
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
  
  exportJsonBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_STORED_DATA' }, (response) => {
      const data = response?.data || { opportunities: [], lastSync: null };
      
      if (!data.opportunities || data.opportunities.length === 0) {
        status.textContent = 'No data to export';
        return;
      }
      
      const jsonData = JSON.stringify(data.opportunities, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'salesforce_opportunities.json';
      a.click();
      URL.revokeObjectURL(url);
      
      status.textContent = `Exported ${data.opportunities.length} record(s) as JSON`;
    });
  });
  
  exportCsvBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'GET_STORED_DATA' }, (response) => {
      const data = response?.data || { opportunities: [], lastSync: null };
      
      if (!data.opportunities || data.opportunities.length === 0) {
        status.textContent = 'No data to export';
        return;
      }
      
      const csvContent = convertToCSV(data.opportunities);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'salesforce_opportunities.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      status.textContent = `Exported ${data.opportunities.length} record(s) as CSV`;
    });
  });
  
  function convertToCSV(opportunities) {
    const headers = ['Opportunity Name', 'Stage', 'Amount', 'Probability', 'Close Date', 'Account Name', 'Extracted At'];
    const csvRows = [headers.join(',')];
    
    opportunities.forEach((opp) => {
      const row = [
        escapeCSV(opp.name || ''),
        escapeCSV(opp.stage || ''),
        escapeCSV(opp.amount || ''),
        escapeCSV(opp.probability || ''),
        escapeCSV(opp.closeDate || ''),
        escapeCSV(opp.accountName || ''),
        escapeCSV(new Date(opp.extractedAt).toLocaleString())
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const strValue = String(value);
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  }
  
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
