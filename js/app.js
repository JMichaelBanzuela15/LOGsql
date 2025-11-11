async function parseLogs(logs) {
  const response = await fetch("parser.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "logs=" + encodeURIComponent(logs),
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
  const response = await fetch("parser.php", { method: "POST", body: formData });
  const data = await response.json();
  displayTable(data);
});

function displayTable(data) {
  const output = document.getElementById("output");
  const summary = document.getElementById("summary");

  if (!data || !data.length) {
    output.innerHTML = "<p>No logs found.</p>";
    return;
  }

  let success = data.filter(d => d.Color === "green").length;
  let failed = data.filter(d => d.Color === "red").length;
  let deadlock = data.filter(d => d.Color === "orange").length;

  summary.innerHTML = `
    <p><b>Summary:</b> ✅ Accepted: ${success}, ❌ Failed: ${failed}, ⚠️ Deadlock: ${deadlock}</p>
  `;

  let html = `<table><thead><tr>
    <th>Date</th><th>Status</th><th>InstrId</th><th>TxId</th><th>CdtrAcctId</th>
    <th>DbtrNm</th><th>DbtrAcctId</th><th>TxSts</th><th>Rsn</th><th>MrchntCtgyCd</th>
  </tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr>
      <td>${row.Date}</td>
      <td style="color:${row.Color}">${row.Status}</td>
      <td>${row.InstrId}</td>
      <td>${row.TxId}</td>
      <td>${row.CdtrAcctId}</td>
      <td>${row.DbtrNm}</td>
      <td>${row.DbtrAcctId}</td>
      <td>${row.TxSts}</td>
      <td>${row.Rsn}</td>
      <td>${row.MrchntCtgyCd}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}

// Filter search
document.getElementById("searchInput").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  document.querySelectorAll("#output table tbody tr").forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
});

// Copy
document.getElementById("copyBtn").addEventListener("click", () => {
  const text = document.getElementById("output").innerText;
  if (!text) return alert("Nothing to copy!");
  navigator.clipboard.writeText(text);
  alert("Copied formatted logs!");
});

// Download CSV
document.getElementById("downloadBtn").addEventListener("click", () => {
  const rows = [...document.querySelectorAll("#output table tr")]
    .map(tr => [...tr.children].map(td => `"${td.innerText}"`).join(","))
    .join("\n");
  const blob = new Blob([rows], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "formatted_logs.csv";
  a.click();
});
