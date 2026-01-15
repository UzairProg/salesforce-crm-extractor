document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const status = document.getElementById('status');

  extractBtn.addEventListener('click', () => {
    console.log('[Popup] Extract button clicked');
    chrome.runtime.sendMessage({ action: 'EXTRACT_CURRENT_OBJECT' }, (response) => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Error: ' + chrome.runtime.lastError.message;
        console.error('[Popup] Error:', chrome.runtime.lastError.message);
      } else {
        status.textContent = 'Extraction request sent';
        console.log('[Popup] Message sent successfully');
      }
    });
  });
});
