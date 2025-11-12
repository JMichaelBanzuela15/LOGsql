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

// ========== SQL LOGS PARSER ==========

async function parseLogs(logs) {
  const response = await fetch("parser.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "logs=" + encodeURIComponent(logs) + "&mode=sql",
  });
  const data = await response.json();
  displayTable(data);
}

document.getElementById("formatBtn").addEventListener("click", () => {
  const logs = document.getElementById("logInput").value.trim();
  if (!logs) return alert("Please paste logs first!");
  parseLogs(logs);
});

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  formData.append('mode', 'sql');
  const response = await fetch("parser.php", { method: "POST", body: formData });
  const data = await response.json();
  displayTable(data);
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
    <th>Date</th><th>Status</th><th>InstrId</th><th>TxId</th><th>CdtrAcctId</th>
    <th>DbtrNm</th><th>DbtrAcctId</th><th>TxSts</th><th>Rsn</th><th>MrchntCtgyCd</th>
  </tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr>
      <td>${row.Date || '—'}</td>
      <td style="color:${row.Color}; font-weight:600;">${row.Status}</td>
      <td>${row.InstrId || '—'}</td>
      <td>${row.TxId || '—'}</td>
      <td>${row.CdtrAcctId || '—'}</td>
      <td>${row.DbtrNm || '—'}</td>
      <td>${row.DbtrAcctId || '—'}</td>
      <td>${row.TxSts || '—'}</td>
      <td>${row.Rsn || '—'}</td>
      <td>${row.MrchntCtgyCd || '—'}</td>
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
  const response = await fetch("parser.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "logs=" + encodeURIComponent(logs) + "&mode=wallet",
  });
  const data = await response.json();
  displayWalletTable(data);
}

document.getElementById("formatWalletBtn").addEventListener("click", () => {
  const logs = document.getElementById("walletLogInput").value.trim();
  if (!logs) return alert("Please paste wallet logs first!");
  parseWalletLogs(logs);
});

document.getElementById("uploadWalletForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  formData.append('mode', 'wallet');
  const response = await fetch("parser.php", { method: "POST", body: formData });
  const data = await response.json();
  displayWalletTable(data);
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