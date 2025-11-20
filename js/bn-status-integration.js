// ========== BN STATUS CODE INTEGRATION ==========
// This file integrates BN status code lookup into the existing viewDetails modal
// Place this script AFTER app.js and status-codes.js in your HTML

(function() {
  'use strict';
  
  // Store the original viewDetails function
  const originalViewDetails = window.viewDetails;
  
  // Override viewDetails to include BN status lookup
  window.viewDetails = function(index) {
    const row = fullDataStore[index];
    if (!row) return;

    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');
    
    // Check if there's a BN status code in the Reason field
    const reasonCode = row.Rsn ? row.Rsn.trim() : '';
    let bnStatusHtml = '';
    
    if (reasonCode && window.BNStatusLookup) {
      const statusDescription = window.BNStatusLookup.lookup(reasonCode);
      
      if (statusDescription) {
        bnStatusHtml = `
          <div class="bn-status-section">
            <div class="bn-status-header">
              <svg class="bn-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>BN Status Code Information</span>
            </div>
            ${window.BNStatusLookup.getBadge(reasonCode, statusDescription)}
          </div>
        `;
      }
    }
    
    // Build detailed view with BN status
    let detailsHtml = `
      <div class="modal-header">
        <h2>
          <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Transaction Details
        </h2>
        <button class="modal-close" onclick="closeModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Date & Time</label>
            <div class="detail-value">${row.Date || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <div class="detail-value" style="color:${row.Color}; font-weight:600;">${row.Status}</div>
          </div>
          <div class="detail-item">
            <label>Instruction ID</label>
            <div class="detail-value">${row.InstrId || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Transaction ID</label>
            <div class="detail-value">${row.TxId || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Amount</label>
            <div class="detail-value">${row.Amount || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Creditor Name</label>
            <div class="detail-value">${row.CdtrNm || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Creditor Account ID</label>
            <div class="detail-value">${row.CdtrAcctId || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Debtor Name</label>
            <div class="detail-value">${row.DbtrNm || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Debtor Account ID</label>
            <div class="detail-value">${row.DbtrAcctId || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Transaction Status</label>
            <div class="detail-value">${row.TxSts || '—'}</div>
          </div>
          <div class="detail-item ${reasonCode && window.BNStatusLookup && window.BNStatusLookup.lookup(reasonCode) ? 'has-bn-status' : ''}">
            <label>Reason</label>
            <div class="detail-value">${row.Rsn || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Merchant Category Code</label>
            <div class="detail-value">${row.MrchntCtgyCd || '—'}</div>
          </div>
          <div class="detail-item">
            <label>Message ID</label>
            <div class="detail-value">${row.MsgId || '—'}</div>
          </div>
        </div>
        ${bnStatusHtml}
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn-primary" onclick="copyDetails(${index})">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
          </svg>
          Copy Details
        </button>
      </div>
    `;

    modalContent.innerHTML = detailsHtml;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  
  // Also update copyDetails to include BN status information
  const originalCopyDetails = window.copyDetails;
  
  window.copyDetails = function(index) {
    const row = fullDataStore[index];
    if (!row) return;

    const reasonCode = row.Rsn ? row.Rsn.trim() : '';
    let bnStatusInfo = '';
    
    if (reasonCode && window.BNStatusLookup) {
      const statusDescription = window.BNStatusLookup.lookup(reasonCode);
      if (statusDescription) {
        bnStatusInfo = `\nBN Status Code: ${reasonCode}\nBN Status Description: ${statusDescription}`;
      }
    }

    const details = `Date: ${row.Date || '—'}
Status: ${row.Status}
Instruction ID: ${row.InstrId || '—'}
Transaction ID: ${row.TxId || '—'}
Amount: ${row.Amount || '—'}
Creditor Name: ${row.CdtrNm || '—'}
Creditor Account ID: ${row.CdtrAcctId || '—'}
Debtor Name: ${row.DbtrNm || '—'}
Debtor Account ID: ${row.DbtrAcctId || '—'}
Transaction Status: ${row.TxSts || '—'}
Reason: ${row.Rsn || '—'}${bnStatusInfo}
Merchant Category Code: ${row.MrchntCtgyCd || '—'}
Message ID: ${row.MsgId || '—'}`;

    navigator.clipboard.writeText(details);
    showToast('Details copied to clipboard (including BN status)!', 'success', 'Copied');
  };
  
  console.log('✅ BN Status Code Integration loaded successfully!');
})();