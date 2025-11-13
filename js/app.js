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
    const data = await response.json();
    displayTable(data);
  } catch (error) {
    alert("❌ Error parsing logs: " + error.message);
  } finally {
    hideSpinner();
  }
}

document.getElementById("formatBtn").addEventListener("click", () => {
  const logs = document.getElementById("logInput").value.trim();
  if (!logs) return alert("Please paste logs first!");
  parseLogs(logs);
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showSpinner("Uploading and parsing file...");
  
  try {
    const formData = new FormData(e.target);
    formData.append('mode', 'sql');
    const response = await fetch("parser.php", { method: "POST", body: formData });
    const data = await response.json();
    displayTable(data);
  } catch (error) {
    alert("❌ Error: " + error.message);
  } finally {
    hideSpinner();
  }
});

function displayTable(data) {
  const output = document.getElementById("output");
  const summary = document.getElementById("summary");

  if (!data || !data.length) {
    output.innerHTML = "<p>No logs found.</p>";
    summary.innerHTML = '';
    return;
  }

  let success = data.filter(d => d.Color === "green").length;
  let failed = data.filter(d => d.Color === "red").length;
  let deadlock = data.filter(d => d.Color === "orange").length;

  summary.innerHTML = `
    <p><b>Summary:</b> ✅ Accepted: ${success}, ❌ Failed: ${failed}, ⚠️ Deadlock: ${deadlock} | Total: ${data.length}</p>
  `;

  let html = `<table><thead><tr>
    <th>Date</th><th>Status</th><th>InstrId</th><th>TxId</th><th>Amount</th>
    <th>CdtrNm</th><th>CdtrAcctId</th><th>DbtrNm</th><th>DbtrAcctId</th>
    <th>TxSts</th><th>Rsn</th><th>MrchntCtgyCd</th><th>MsgId</th>
  </tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr>
      <td>${row.Date || '—'}</td>
      <td style="color:${row.Color}; font-weight:600;">${row.Status}</td>
      <td>${row.InstrId || '—'}</td>
      <td>${row.TxId || '—'}</td>
      <td>${row.Amount || '—'}</td>
      <td>${row.CdtrNm || '—'}</td>
      <td>${row.CdtrAcctId || '—'}</td>
      <td>${row.DbtrNm || '—'}</td>
      <td>${row.DbtrAcctId || '—'}</td>
      <td>${row.TxSts || '—'}</td>
      <td>${row.Rsn || '—'}</td>
      <td>${row.MrchntCtgyCd || '—'}</td>
      <td>${row.MsgId || '—'}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

// Filter search for SQL logs
document.getElementById("searchInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#output table tbody tr").forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
  
  updateVisibleCount();
});

// Copy SQL logs
document.getElementById("copyBtn").addEventListener("click", () => {
  const text = document.getElementById("output").innerText;
  if (!text) return alert("Nothing to copy!");
  navigator.clipboard.writeText(text);
  alert("Copied formatted logs!");
});

// Download CSV for SQL logs
document.getElementById("downloadBtn").addEventListener("click", () => {
  const rows = [...document.querySelectorAll("#output table tr")]
    .map(tr => [...tr.children].map(td => `"${td.innerText}"`).join(","))
    .join("\n");
  if (!rows) return alert("Nothing to download!");
  const blob = new Blob([rows], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sql_logs.csv";
  a.click();
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
    const data = await response.json();
    displayWalletTable(data);
  } catch (error) {
    alert("❌ Error parsing wallet logs: " + error.message);
  } finally {
    hideSpinner();
  }
}

document.getElementById("formatWalletBtn").addEventListener("click", () => {
  const logs = document.getElementById("walletLogInput").value.trim();
  if (!logs) return alert("Please paste wallet logs first!");
  parseWalletLogs(logs);
});

document.getElementById("uploadWalletForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showSpinner("Uploading and parsing wallet file...");
  
  try {
    const formData = new FormData(e.target);
    formData.append('mode', 'wallet');
    const response = await fetch("parser.php", { method: "POST", body: formData });
    const data = await response.json();
    displayWalletTable(data);
  } catch (error) {
    alert("❌ Error: " + error.message);
  } finally {
    hideSpinner();
  }
});

function displayWalletTable(data) {
  const output = document.getElementById("walletOutput");
  const summary = document.getElementById("walletSummary");

  if (!data || !data.length) {
    output.innerHTML = "<p>No wallet logs found.</p>";
    summary.innerHTML = '';
    return;
  }

  summary.innerHTML = `
    <p><b>Summary:</b> 📊 Total Entries: ${data.length}</p>
  `;

  let html = `<table><thead><tr>
    <th>Timestamp</th><th>Contact Number</th><th>First Name</th><th>Last Name</th>
    <th>Birthday</th><th>Birth Place</th><th>Gender</th><th>Nationality</th><th>Address</th>
  </tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr>
      <td>${row.Timestamp || '—'}</td>
      <td>${row.ContactNumber || '—'}</td>
      <td>${row.FirstName || '—'}</td>
      <td>${row.LastName || '—'}</td>
      <td>${row.Birthday || '—'}</td>
      <td>${row.BirthPlace || '—'}</td>
      <td>${row.Gender || '—'}</td>
      <td>${row.Nationality || '—'}</td>
      <td>${row.Address || '—'}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

// Filter search for wallet logs
document.getElementById("searchWalletInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#walletOutput table tbody tr").forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
});

// Copy wallet logs
document.getElementById("copyWalletBtn").addEventListener("click", () => {
  const text = document.getElementById("walletOutput").innerText;
  if (!text) return alert("Nothing to copy!");
  navigator.clipboard.writeText(text);
  alert("Copied wallet logs!");
});

// Download CSV for wallet logs
document.getElementById("downloadWalletBtn").addEventListener("click", () => {
  const rows = [...document.querySelectorAll("#walletOutput table tr")]
    .map(tr => [...tr.children].map(td => `"${td.innerText}"`).join(","))
    .join("\n");
  if (!rows) return alert("Nothing to download!");
  const blob = new Blob([rows], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "wallet_logs.csv";
  a.click();
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
  if (confirm("🗑️ Clear all SQL logs?")) {
    document.getElementById("logInput").value = '';
    document.getElementById("output").innerHTML = '';
    document.getElementById("summary").innerHTML = '';
    document.getElementById("searchInput").value = '';
    document.getElementById("startDate").value = '';
    document.getElementById("endDate").value = '';
  }
});

document.getElementById("clearWalletBtn").addEventListener("click", () => {
  if (confirm("🗑️ Clear all wallet logs?")) {
    document.getElementById("walletLogInput").value = '';
    document.getElementById("walletOutput").innerHTML = '';
    document.getElementById("walletSummary").innerHTML = '';
    document.getElementById("searchWalletInput").value = '';
  }
});

// ========== DATE RANGE FILTER ==========

function filterByDateRange() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  
  if (!startDate || !endDate) {
    alert("⚠️ Please select both start and end dates!");
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    alert("⚠️ Start date must be before end date!");
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