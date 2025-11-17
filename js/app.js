// ========== CUSTOM TOAST NOTIFICATIONS ==========

function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icons based on type
  let iconPath = '';
  let defaultTitle = title;
  
  if (type === 'success') {
    iconPath = '<path d="M20 6L9 17l-5-5"/>';
    defaultTitle = defaultTitle || 'Success';
  } else if (type === 'error') {
    iconPath = '<path d="M18 6L6 18M6 6l12 12"/>';
    defaultTitle = defaultTitle || 'Error';
  } else if (type === 'warning') {
    iconPath = '<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>';
    defaultTitle = defaultTitle || 'Warning';
  } else {
    iconPath = '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
    defaultTitle = defaultTitle || 'Info';
  }

  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${iconPath}
    </svg>
    <div class="toast-content">
      ${defaultTitle ? `<div class="toast-title">${defaultTitle}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, 5000);
}

// ========== CUSTOM CONFIRMATION MODAL ==========

let confirmCallback = null;
let confirmCancelCallback = null;

function showConfirm(title, message, onConfirm, onCancel = null) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  
  if (!modal || !titleEl || !messageEl) {
    // Fallback to browser confirm if modal doesn't exist
    const result = window.confirm(message);
    if (result && onConfirm) onConfirm();
    if (!result && onCancel) onCancel();
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmCallback = onConfirm;
  confirmCancelCallback = onCancel;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

window.closeConfirmModal = function(result) {
  const modal = document.getElementById('confirmModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
  
  if (result && confirmCallback) {
    confirmCallback();
  } else if (!result && confirmCancelCallback) {
    confirmCancelCallback();
  }
  
  confirmCallback = null;
  confirmCancelCallback = null;
};

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab
    btn.classList.add('active');
    document.getElementById(`${tab}-tab`).classList.add('active');
  });
});

// ========== LOADING SPINNER ==========

function showSpinner(message = "Processing...") {
  const spinner = document.createElement('div');
  spinner.className = 'spinner-overlay';
  spinner.id = 'loadingSpinner';
  spinner.innerHTML = `
    <div style="text-align: center;">
      <div class="spinner"></div>
      <div class="spinner-text">${message}</div>
    </div>
  `;
  document.body.appendChild(spinner);
}

function hideSpinner() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.remove();
  }
}

// ========== SQL LOGS PARSER ==========

async function parseLogs(logs) {
  showSpinner("Parsing SQL logs...");
  
  try {
    const response = await fetch("parser.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "logs=" + encodeURIComponent(logs) + "&mode=sql",
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Response text:", text);
      throw new Error("Invalid JSON response from server. Check console for details.");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayTable(data);
  } catch (error) {
    showToast("Error parsing logs: " + error.message, 'error', 'Parsing Error');
    console.error("Parse error:", error);
  } finally {
    hideSpinner();
  }
}

document.getElementById("formatBtn").addEventListener("click", () => {
  const logs = document.getElementById("logInput").value.trim();
  if (!logs) {
    showToast("Please paste logs first!", 'warning', 'Input Required');
    return;
  }
  parseLogs(logs);
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showSpinner("Uploading and parsing file...");
  
  try {
    const formData = new FormData(e.target);
    formData.append('mode', 'sql');
    const response = await fetch("parser.php", { method: "POST", body: formData });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Response text:", text);
      throw new Error("Invalid JSON response from server. Check console for details.");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayTable(data);
  } catch (error) {
    showToast("Error: " + error.message, 'error', 'Upload Error');
    console.error("Upload error:", error);
  } finally {
    hideSpinner();
  }
});

// Store full data for modal viewing
let fullDataStore = [];

function displayTable(data) {
  console.log('displayTable called with new simplified view');
  const output = document.getElementById("output");
  const summary = document.getElementById("summary");

  if (!data || !data.length) {
    output.innerHTML = "<p>No logs found.</p>";
    summary.innerHTML = '';
    return;
  }

  // Store full data for modal
  fullDataStore = data;

  let success = data.filter(d => d.Color === "green").length;
  let failed = data.filter(d => d.Color === "red").length;
  let deadlock = data.filter(d => d.Color === "orange").length;

  summary.innerHTML = `
    <p><b>Summary:</b> ✅ Accepted: ${success}, ❌ Failed: ${failed}, ⚠️ Deadlock: ${deadlock} | Total: ${data.length}</p>
  `;

  // Simplified table with only Date, Status, InstrId, and View button
  let html = `<table><thead><tr>
    <th>Date</th><th>Status</th><th>Instruction ID</th><th>Action</th>
  </tr></thead><tbody>`;

  data.forEach((row, index) => {
    html += `<tr data-index="${index}">
      <td>${row.Date || '—'}</td>
      <td style="color:${row.Color}; font-weight:600;">${row.Status}</td>
      <td>${row.InstrId || '—'}</td>
      <td>
        <button class="btn-view" onclick="viewDetails(${index})">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </td>
    </tr>`;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

// Function to view full details in modal - make it globally accessible
window.viewDetails = function(index) {
  const row = fullDataStore[index];
  if (!row) return;

  const modal = document.getElementById('detailsModal');
  const modalContent = document.getElementById('modalContent');
  
  // Build detailed view
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
        <div class="detail-item">
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
}

window.closeModal = function() {
  const modal = document.getElementById('detailsModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

window.copyDetails = function(index) {
  const row = fullDataStore[index];
  if (!row) return;

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
Reason: ${row.Rsn || '—'}
Merchant Category Code: ${row.MrchntCtgyCd || '—'}
Message ID: ${row.MsgId || '—'}`;

  navigator.clipboard.writeText(details);
  showToast('Details copied to clipboard!', 'success', 'Copied');
}

// Filter search for SQL logs
document.getElementById("searchInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#output table tbody tr").forEach((tr) => {
    const index = parseInt(tr.getAttribute('data-index'));
    // Search in the full data, not just visible columns
    const rowData = fullDataStore[index];
    if (rowData) {
      const searchText = Object.values(rowData).join(' ').toLowerCase();
      tr.style.display = searchText.includes(filter) ? "" : "none";
    } else {
      tr.style.display = tr.textContent.toLowerCase().includes(filter) ? "" : "none";
    }
  });
  
  updateVisibleCount();
});

// Copy SQL logs
document.getElementById("copyBtn").addEventListener("click", () => {
  const text = document.getElementById("output").innerText;
  if (!text) {
    showToast("Nothing to copy!", 'warning', 'Copy Failed');
    return;
  }
  navigator.clipboard.writeText(text);
  showToast("Copied formatted logs!", 'success', 'Copied');
});

// Download functions for SQL logs
function downloadSQLAsCSV() {
  if (!fullDataStore || fullDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }

  // CSV Headers with all columns
  const headers = ['Date', 'Status', 'InstrId', 'TxId', 'Amount', 'CdtrNm', 'CdtrAcctId', 'DbtrNm', 'DbtrAcctId', 'TxSts', 'Rsn', 'MrchntCtgyCd', 'MsgId'];
  
  // Escape CSV values properly
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  let csvContent = headers.map(h => escapeCSV(h)).join(',') + '\n';
  
  fullDataStore.forEach(row => {
    const values = [
      row.Date || '',
      row.Status || '',
      row.InstrId || '',
      row.TxId || '',
      row.Amount || '',
      row.CdtrNm || '',
      row.CdtrAcctId || '',
      row.DbtrNm || '',
      row.DbtrAcctId || '',
      row.TxSts || '',
      row.Rsn || '',
      row.MrchntCtgyCd || '',
      row.MsgId || ''
    ];
    csvContent += values.map(v => escapeCSV(v)).join(',') + '\n';
  });

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sql_logs_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV file downloaded successfully!', 'success', 'Download Complete');
}

function downloadSQLAsPDF() {
  if (!fullDataStore || fullDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }

  showSpinner("Generating PDF...");

  // Load jsPDF and autoTable libraries
  const jspdfScript = document.createElement('script');
  jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  
  jspdfScript.onload = () => {
    const autoTableScript = document.createElement('script');
    autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
    
    autoTableScript.onload = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(16);
        doc.text('SQL Logs Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${fullDataStore.length}`, 14, 22);
        
        // Table headers
        const headers = [['Date', 'Status', 'InstrId', 'TxId', 'Amount', 'CdtrNm', 'CdtrAcctId', 'DbtrNm', 'DbtrAcctId', 'TxSts', 'Rsn', 'MrchntCtgyCd', 'MsgId']];
        
        // Prepare data - include all data, no truncation
        const data = fullDataStore.map(row => [
          row.Date || '',
          row.Status || '',
          row.InstrId || '',
          row.TxId || '',
          row.Amount || '',
          row.CdtrNm || '',
          row.CdtrAcctId || '',
          row.DbtrNm || '',
          row.DbtrAcctId || '',
          row.TxSts || '',
          row.Rsn || '',
          row.MrchntCtgyCd || '',
          row.MsgId || ''
        ]);
        
        // Create table with autoTable - optimized for landscape A4
        // Use percentage-based widths to ensure everything fits
        const pageWidth = 297; // A4 landscape width in mm
        const margins = 6; // 3mm left + 3mm right
        const usableWidth = pageWidth - margins;
        
        doc.autoTable({
          head: headers,
          body: data,
          startY: 28,
          styles: { 
            fontSize: 5, 
            cellPadding: 1.5, 
            overflow: 'linebreak',
            halign: 'left',
            valign: 'top',
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [37, 99, 235], 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 6,
            cellPadding: 2,
            overflow: 'linebreak'
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 28, left: 3, right: 3 },
          tableWidth: usableWidth,
          showHead: 'everyPage',
          showFoot: 'never',
          // Ensure all content fits and wraps
          didParseCell: function (data) {
            // Force text wrapping for all cells
            data.cell.styles.overflow = 'linebreak';
            data.cell.styles.cellWidth = 'auto';
            // Don't truncate text
            if (data.column.dataKey !== undefined) {
              data.cell.text = data.cell.text || '';
            }
          },
          // Column widths as percentages of usable width to ensure fit
          columnStyles: {
            0: { cellWidth: usableWidth * 0.07, fontSize: 5 },  // Date (7%)
            1: { cellWidth: usableWidth * 0.06, fontSize: 5 },  // Status (6%)
            2: { cellWidth: usableWidth * 0.09, fontSize: 5 },  // InstrId (9%)
            3: { cellWidth: usableWidth * 0.09, fontSize: 5 },  // TxId (9%)
            4: { cellWidth: usableWidth * 0.06, fontSize: 5 },  // Amount (6%)
            5: { cellWidth: usableWidth * 0.08, fontSize: 5 },  // CdtrNm (8%)
            6: { cellWidth: usableWidth * 0.07, fontSize: 5 },  // CdtrAcctId (7%)
            7: { cellWidth: usableWidth * 0.08, fontSize: 5 },  // DbtrNm (8%)
            8: { cellWidth: usableWidth * 0.07, fontSize: 5 },  // DbtrAcctId (7%)
            9: { cellWidth: usableWidth * 0.05, fontSize: 5 },  // TxSts (5%)
            10: { cellWidth: usableWidth * 0.07, fontSize: 5 }, // Rsn (7%)
            11: { cellWidth: usableWidth * 0.06, fontSize: 5 }, // MrchntCtgyCd (6%)
            12: { cellWidth: usableWidth * 0.08, fontSize: 5 }  // MsgId (8%)
          }
        });
        
        // Save PDF
        doc.save(`sql_logs_${new Date().toISOString().split('T')[0]}.pdf`);
        hideSpinner();
      } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF. Please try CSV download instead.', 'error', 'PDF Error');
        hideSpinner();
      }
    };
    
    autoTableScript.onerror = () => {
      showToast('Failed to load PDF library. Please try CSV download instead.', 'error', 'Library Error');
      hideSpinner();
    };
    
    document.head.appendChild(autoTableScript);
  };
  
  jspdfScript.onerror = () => {
    showToast('Failed to load PDF library. Please try CSV download instead.', 'error', 'Library Error');
    hideSpinner();
  };
  
  document.head.appendChild(jspdfScript);
}

// Download button with options
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!fullDataStore || fullDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }
  
  // Show download options modal
  showConfirm(
    'Download Options',
    'Choose your download format:\n\n• Click "Confirm" for PDF download\n• Click "Cancel" for CSV download',
    () => {
      // User clicked Confirm - download PDF
      downloadSQLAsPDF();
    },
    () => {
      // User clicked Cancel - download CSV
      downloadSQLAsCSV();
    }
  );
});

// ========== DIGIPEP WALLET PARSER ==========

async function parseWalletLogs(logs) {
  showSpinner("Parsing wallet logs...");
  
  try {
    const response = await fetch("parser.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "logs=" + encodeURIComponent(logs) + "&mode=wallet",
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Response text:", text);
      throw new Error("Invalid JSON response from server. Check console for details.");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayWalletTable(data);
  } catch (error) {
    showToast("Error parsing wallet logs: " + error.message, 'error', 'Parsing Error');
    console.error("Parse error:", error);
  } finally {
    hideSpinner();
  }
}

document.getElementById("formatWalletBtn").addEventListener("click", () => {
  const logs = document.getElementById("walletLogInput").value.trim();
  if (!logs) {
    showToast("Please paste wallet logs first!", 'warning', 'Input Required');
    return;
  }
  parseWalletLogs(logs);
});

document.getElementById("uploadWalletForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showSpinner("Uploading and parsing wallet file...");
  
  try {
    const formData = new FormData(e.target);
    formData.append('mode', 'wallet');
    const response = await fetch("parser.php", { method: "POST", body: formData });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Response text:", text);
      throw new Error("Invalid JSON response from server. Check console for details.");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    displayWalletTable(data);
  } catch (error) {
    showToast("Error: " + error.message, 'error', 'Upload Error');
    console.error("Upload error:", error);
  } finally {
    hideSpinner();
  }
});

// Store wallet data for modal
let walletDataStore = [];

function displayWalletTable(data) {
  const output = document.getElementById("walletOutput");
  const summary = document.getElementById("walletSummary");

  if (!data || !data.length) {
    output.innerHTML = "<p>No wallet logs found.</p>";
    summary.innerHTML = '';
    return;
  }

  // Store wallet data for modal
  walletDataStore = data;

  summary.innerHTML = `
    <p><b>Summary:</b> 📊 Total Entries: ${data.length}</p>
  `;

  // Simplified table with only Timestamp, Contact Number, and View button
  let html = `<table><thead><tr>
    <th>Timestamp</th><th>Contact Number</th><th>Action</th>
  </tr></thead><tbody>`;

  data.forEach((row, index) => {
    html += `<tr data-index="${index}">
      <td>${row.Timestamp || '—'}</td>
      <td>${row.ContactNumber || '—'}</td>
      <td>
        <button class="btn-view" onclick="viewWalletDetails(${index})">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          View Details
        </button>
      </td>
    </tr>`;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

// Function to view wallet details in modal - make it globally accessible
window.viewWalletDetails = function(index) {
  const row = walletDataStore[index];
  if (!row) return;

  const modal = document.getElementById('detailsModal');
  const modalContent = document.getElementById('modalContent');
  
  let detailsHtml = `
    <div class="modal-header">
      <h2>
        <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6 4.03-6 9-6 9 4.8 9 6z"/>
          <path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        </svg>
        Wallet Details
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
          <label>Timestamp</label>
          <div class="detail-value">${row.Timestamp || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Contact Number</label>
          <div class="detail-value">${row.ContactNumber || '—'}</div>
        </div>
        <div class="detail-item">
          <label>First Name</label>
          <div class="detail-value">${row.FirstName || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Last Name</label>
          <div class="detail-value">${row.LastName || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Birthday</label>
          <div class="detail-value">${row.Birthday || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Birth Place</label>
          <div class="detail-value">${row.BirthPlace || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Gender</label>
          <div class="detail-value">${row.Gender || '—'}</div>
        </div>
        <div class="detail-item">
          <label>Nationality</label>
          <div class="detail-value">${row.Nationality || '—'}</div>
        </div>
        <div class="detail-item full-width">
          <label>Address</label>
          <div class="detail-value">${row.Address || '—'}</div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn-primary" onclick="copyWalletDetails(${index})">
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
}

window.copyWalletDetails = function(index) {
  const row = walletDataStore[index];
  if (!row) return;

  const details = `Timestamp: ${row.Timestamp || '—'}
Contact Number: ${row.ContactNumber || '—'}
First Name: ${row.FirstName || '—'}
Last Name: ${row.LastName || '—'}
Birthday: ${row.Birthday || '—'}
Birth Place: ${row.BirthPlace || '—'}
Gender: ${row.Gender || '—'}
Nationality: ${row.Nationality || '—'}
Address: ${row.Address || '—'}`;

  navigator.clipboard.writeText(details);
  showToast('Details copied to clipboard!', 'success', 'Copied');
}

// Filter search for wallet logs
document.getElementById("searchWalletInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#walletOutput table tbody tr").forEach((tr) => {
    const index = parseInt(tr.getAttribute('data-index'));
    // Search in the full data, not just visible columns
    const rowData = walletDataStore[index];
    if (rowData) {
      const searchText = Object.values(rowData).join(' ').toLowerCase();
      tr.style.display = searchText.includes(filter) ? "" : "none";
    } else {
      tr.style.display = tr.textContent.toLowerCase().includes(filter) ? "" : "none";
    }
  });
});

// Copy wallet logs
document.getElementById("copyWalletBtn").addEventListener("click", () => {
  const text = document.getElementById("walletOutput").innerText;
  if (!text) {
    showToast("Nothing to copy!", 'warning', 'Copy Failed');
    return;
  }
  navigator.clipboard.writeText(text);
  showToast("Copied wallet logs!", 'success', 'Copied');
});

// Download functions for wallet logs
function downloadWalletAsCSV() {
  if (!walletDataStore || walletDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }

  // CSV Headers with all columns
  const headers = ['Timestamp', 'ContactNumber', 'FirstName', 'LastName', 'Birthday', 'BirthPlace', 'Gender', 'Nationality', 'Address'];
  
  // Escape CSV values properly
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  let csvContent = headers.map(h => escapeCSV(h)).join(',') + '\n';
  
  walletDataStore.forEach(row => {
    const values = [
      row.Timestamp || '',
      row.ContactNumber || '',
      row.FirstName || '',
      row.LastName || '',
      row.Birthday || '',
      row.BirthPlace || '',
      row.Gender || '',
      row.Nationality || '',
      row.Address || ''
    ];
    csvContent += values.map(v => escapeCSV(v)).join(',') + '\n';
  });

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wallet_logs_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadWalletAsPDF() {
  if (!walletDataStore || walletDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }

  showSpinner("Generating PDF...");

  // Load jsPDF and autoTable libraries
  const jspdfScript = document.createElement('script');
  jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  
  jspdfScript.onload = () => {
    const autoTableScript = document.createElement('script');
    autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
    
    autoTableScript.onload = () => {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(16);
        doc.text('Wallet Logs Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()} | Total Records: ${walletDataStore.length}`, 14, 22);
        
        // Table headers
        const headers = [['Timestamp', 'ContactNumber', 'FirstName', 'LastName', 'Birthday', 'BirthPlace', 'Gender', 'Nationality', 'Address']];
        
        // Prepare data - include all data
        const data = walletDataStore.map(row => [
          row.Timestamp || '',
          row.ContactNumber || '',
          row.FirstName || '',
          row.LastName || '',
          row.Birthday || '',
          row.BirthPlace || '',
          row.Gender || '',
          row.Nationality || '',
          row.Address || ''
        ]);
        
        // Create table with autoTable - optimized for landscape A4
        const pageWidth = 297; // A4 landscape width in mm
        const margins = 10; // 5mm left + 5mm right
        const usableWidth = pageWidth - margins;
        
        doc.autoTable({
          head: headers,
          body: data,
          startY: 28,
          styles: { 
            fontSize: 6, 
            cellPadding: 1.5, 
            overflow: 'linebreak',
            halign: 'left',
            valign: 'top',
            lineWidth: 0.1
          },
          headStyles: { 
            fillColor: [37, 99, 235], 
            textColor: 255, 
            fontStyle: 'bold', 
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak'
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 28, left: 5, right: 5 },
          tableWidth: usableWidth,
          showHead: 'everyPage',
          showFoot: 'never',
          // Ensure all content fits and wraps
          didParseCell: function (data) {
            // Force text wrapping for all cells, especially Address
            data.cell.styles.overflow = 'linebreak';
            data.cell.styles.cellWidth = 'auto';
            // Don't truncate text
            if (data.column.dataKey !== undefined) {
              data.cell.text = data.cell.text || '';
            }
          },
          // Column widths as percentages to ensure everything fits
          columnStyles: {
            0: { cellWidth: usableWidth * 0.12, fontSize: 6 },  // Timestamp (12%)
            1: { cellWidth: usableWidth * 0.10, fontSize: 6 },  // ContactNumber (10%)
            2: { cellWidth: usableWidth * 0.10, fontSize: 6 },  // FirstName (10%)
            3: { cellWidth: usableWidth * 0.10, fontSize: 6 },  // LastName (10%)
            4: { cellWidth: usableWidth * 0.09, fontSize: 6 },  // Birthday (9%)
            5: { cellWidth: usableWidth * 0.10, fontSize: 6 },  // BirthPlace (10%)
            6: { cellWidth: usableWidth * 0.07, fontSize: 6 },  // Gender (7%)
            7: { cellWidth: usableWidth * 0.09, fontSize: 6 },  // Nationality (9%)
            8: { cellWidth: usableWidth * 0.23, fontSize: 6 }  // Address (23% - wider for full text)
          }
        });
        
        // Save PDF
        doc.save(`wallet_logs_${new Date().toISOString().split('T')[0]}.pdf`);
        hideSpinner();
        showToast('PDF generated successfully!', 'success', 'Download Complete');
      } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Error generating PDF. Please try CSV download instead.', 'error', 'PDF Error');
        hideSpinner();
      }
    };
    
    autoTableScript.onerror = () => {
      showToast('Failed to load PDF library. Please try CSV download instead.', 'error', 'Library Error');
      hideSpinner();
    };
    
    document.head.appendChild(autoTableScript);
  };
  
  jspdfScript.onerror = () => {
    showToast('Failed to load PDF library. Please try CSV download instead.', 'error', 'Library Error');
    hideSpinner();
  };
  
  document.head.appendChild(jspdfScript);
}

// Download button with options
document.getElementById("downloadWalletBtn").addEventListener("click", () => {
  if (!walletDataStore || walletDataStore.length === 0) {
    showToast("Nothing to download!", 'warning', 'Download Failed');
    return;
  }
  
  // Show download options modal
  showConfirm(
    'Download Options',
    'Choose your download format:\n\n• Click "Confirm" for PDF download\n• Click "Cancel" for CSV download',
    () => {
      // User clicked Confirm - download PDF
      downloadWalletAsPDF();
    },
    () => {
      // User clicked Cancel - download CSV
      downloadWalletAsCSV();
    }
  );
});

// ========== QUICK FILTER BUTTONS ==========

function quickFilter(status) {
  const searchInput = document.getElementById("searchInput");
  
  if (status === 'all') {
    searchInput.value = '';
  } else {
    searchInput.value = status;
  }
  
  // Trigger the search
  const event = new Event('input');
  searchInput.dispatchEvent(event);
  
  // Update button active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active to clicked button
  if (status === 'all') {
    document.querySelector('.filter-btn').classList.add('active');
  } else {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.textContent.includes(status)) {
        btn.classList.add('active');
      }
    });
  }
}

// ========== CLEAR BUTTONS ==========

document.getElementById("clearBtn").addEventListener("click", () => {
  showConfirm(
    'Clear All SQL Logs',
    'Are you sure you want to clear all SQL logs? This action cannot be undone.',
    () => {
      document.getElementById("logInput").value = '';
      document.getElementById("output").innerHTML = '';
      document.getElementById("summary").innerHTML = '';
      document.getElementById("searchInput").value = '';
      document.getElementById("startDate").value = '';
      document.getElementById("endDate").value = '';
      fullDataStore = [];
      showToast('All SQL logs cleared successfully!', 'success', 'Cleared');
    }
  );
});

document.getElementById("clearWalletBtn").addEventListener("click", () => {
  showConfirm(
    'Clear All Wallet Logs',
    'Are you sure you want to clear all wallet logs? This action cannot be undone.',
    () => {
      document.getElementById("walletLogInput").value = '';
      document.getElementById("walletOutput").innerHTML = '';
      document.getElementById("walletSummary").innerHTML = '';
      document.getElementById("searchWalletInput").value = '';
      walletDataStore = [];
      showToast('All wallet logs cleared successfully!', 'success', 'Cleared');
    }
  );
});

// ========== DATE RANGE FILTER ==========

function filterByDateRange() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  
  if (!startDate || !endDate) {
    showToast("Please select both start and end dates!", 'warning', 'Date Range Required');
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    showToast("Start date must be before end date!", 'warning', 'Invalid Date Range');
    return;
  }
  
  let visibleCount = 0;
  
  document.querySelectorAll("#output table tbody tr").forEach(tr => {
    const dateCell = tr.children[0].textContent; // First column is Date
    if (!dateCell || dateCell === '—') {
      tr.style.display = "none";
      return;
    }
    
    const rowDate = new Date(dateCell.split(' ')[0]); // Extract just the date part
    
    if (rowDate >= start && rowDate <= end) {
      tr.style.display = "";
      visibleCount++;
    } else {
      tr.style.display = "none";
    }
  });
  
  // Update summary
  const totalRows = document.querySelectorAll("#output table tbody tr").length;
  const summaryEl = document.getElementById("summary");
  const currentSummary = summaryEl.innerHTML.split('<br>')[0];
  summaryEl.innerHTML = `${currentSummary}<br><small>📅 Showing ${visibleCount} of ${totalRows} logs (${startDate} to ${endDate})</small>`;
}

function clearDateFilter() {
  document.getElementById("startDate").value = '';
  document.getElementById("endDate").value = '';
  
  // Show all rows
  document.querySelectorAll("#output table tbody tr").forEach(tr => {
    tr.style.display = "";
  });
  
  // Reset summary
  const data = Array.from(document.querySelectorAll("#output table tbody tr"));
  let success = 0, failed = 0, deadlock = 0;
  
  data.forEach(tr => {
    const status = tr.children[1].textContent;
    if (status === 'Accepted') success++;
    else if (status === 'Failed') failed++;
    else if (status === 'Deadlock') deadlock++;
  });
  
  document.getElementById("summary").innerHTML = `
    <p><b>Summary:</b> ✅ Accepted: ${success}, ❌ Failed: ${failed}, ⚠️ Deadlock: ${deadlock} | Total: ${data.length}</p>
  `;
}

function updateVisibleCount() {
  const visibleRows = document.querySelectorAll("#output table tbody tr:not([style*='display: none'])").length;
  const totalRows = document.querySelectorAll("#output table tbody tr").length;
  
  if (visibleRows < totalRows) {
    const summaryEl = document.getElementById("summary");
    const currentSummary = summaryEl.innerHTML.split('<br>')[0];
    summaryEl.innerHTML = `${currentSummary}<br><small>🔍 Showing ${visibleRows} of ${totalRows} logs</small>`;
  }
}