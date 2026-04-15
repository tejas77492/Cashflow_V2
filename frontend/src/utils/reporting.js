// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (value) => {
  const num = Number(value || 0);
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPercent = (value) => {
  const num = Number(value || 0);
  return num.toFixed(2) + "%";
};

export const formatTransactionType = (type) =>
  type === "cc" ? "CC Transfer" : type === "bill" ? "Bill Payment" : type;

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const getToday = () => new Date().toISOString().slice(0, 10);

export const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export const getMonthRange = (monthStr) => {
  const [year, month] = String(monthStr || "").split("-").map(Number);
  if (!year || !month) return { dateFrom: "", dateTo: "" };
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { dateFrom: start, dateTo: end };
};

export const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
};

// ─── CSV Export ───────────────────────────────────────────────────────────────

const getCellValue = (row, col) => {
  if (col.exportValue) {
    return col.exportValue(row);
  }
  if (col.render) {
    const rendered = col.render(row);
    if (typeof rendered === "object" && rendered !== null) {
      return row[col.key] ?? "";
    }
    // strip currency symbols for export
    return String(rendered || "").replace(/[₹,]/g, "");
  }
  return row[col.key] ?? "";
};

export const exportRowsToCsv = (filename, columns, rows) => {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = String(getCellValue(row, col)).replace(/"/g, '""');
      return `"${val}"`;
    }).join(",")
  );
  // Add BOM for Excel UTF-8 recognition
  const csv = "\uFEFF" + [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Excel-style Monthly Report Export ───────────────────────────────────────
// Creates an HTML-based .xls file that opens in Excel with full formatting

export const exportMonthlyReportXls = ({ month, transactions, expenses, summary, branchName }) => {
  const toNum = (v) => Number(v || 0);
  const cur = (v) => toNum(v).toFixed(2);

  const txRows = transactions
    .map(
      (t) => `
    <tr>
      <td>${t.date}</td>
      <td>${formatTransactionType(t.type)}</td>
      <td>${t.portal_name || ""}</td>
      <td style="text-align:right">${cur(t.amount)}</td>
      <td style="text-align:right">${cur(t.customer_charge)}</td>
      <td style="text-align:right">${cur(t.discount)}</td>
      <td style="text-align:right">${cur(t.portal_cost)}</td>
      <td style="text-align:right;color:${toNum(t.profit) >= 0 ? "green" : "red"}">${cur(t.profit)}</td>
    </tr>`
    )
    .join("");

  const expRows = expenses
    .map(
      (e) => `
    <tr>
      <td>${e.date}</td>
      <td>${e.description}</td>
      <td style="text-align:right;color:red">${cur(e.amount)}</td>
    </tr>`
    )
    .join("");

  const ms = summary?.month_summary || {};
  const netProfit = toNum(ms.net_profit_amount);
  const branchShare = toNum(ms.branch_manager_share_amount);
  const headShare = toNum(ms.head_manager_share_amount);

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; }
    h1 { font-size:16pt; color:#1e293b; margin-bottom:4px; }
    h2 { font-size:13pt; color:#334155; margin:20px 0 6px; border-bottom:2px solid #e2e8f0; padding-bottom:4px; }
    table { border-collapse:collapse; width:100%; margin-bottom:16px; }
    th { background:#1e293b; color:white; padding:8px 10px; text-align:left; font-size:11pt; }
    td { padding:7px 10px; border-bottom:1px solid #f1f5f9; }
    tr:nth-child(even) td { background:#f8fafc; }
    .summary-table td { padding:8px 10px; }
    .summary-table .key { font-weight:bold; color:#475569; width:220px; }
    .summary-table .val { text-align:right; font-weight:600; }
    .green { color:green; font-weight:600; }
    .red { color:red; font-weight:600; }
    .purple { color:#7c3aed; font-weight:700; font-size:13pt; }
  </style>
</head>
<body>
  <h1>CashFlow Monthly Report</h1>
  <p><b>Branch:</b> ${branchName || "All Branches"} &nbsp;&nbsp; <b>Month:</b> ${formatMonthLabel(month)}</p>

  <h2>Monthly Summary</h2>
  <table class="summary-table">
    <tr><td class="key">Total Transactions</td><td class="val">${ms.transaction_count || 0}</td></tr>
    <tr><td class="key">Total Transaction Amount</td><td class="val">₹ ${cur(ms.total_transaction_amount)}</td></tr>
    <tr><td class="key">Bill Payment Total</td><td class="val">₹ ${cur(ms.total_bill_amount)}</td></tr>
    <tr><td class="key">CC Transfer Total</td><td class="val">₹ ${cur(ms.total_cc_amount)}</td></tr>
    <tr><td class="key">Customer Charges Collected</td><td class="val">₹ ${cur(ms.total_customer_charge)}</td></tr>
    <tr><td class="key">Discounts Given</td><td class="val red">₹ ${cur(ms.total_discount_amount)}</td></tr>
    <tr><td class="key">Portal Costs</td><td class="val red">₹ ${cur(ms.total_portal_cost)}</td></tr>
    <tr><td class="key">Gross Profit</td><td class="val green">₹ ${cur(ms.total_profit_amount)}</td></tr>
    <tr><td class="key">Total Expenses</td><td class="val red">₹ ${cur(ms.total_expense_amount)}</td></tr>
    <tr><td class="key"><b>Net Profit (after expenses)</b></td><td class="val ${netProfit >= 0 ? "green" : "red"}">₹ ${cur(netProfit)}</td></tr>
    <tr><td class="key">Branch Manager Share (30%)</td><td class="val purple">₹ ${cur(branchShare)}</td></tr>
    <tr><td class="key">Head Manager Share (70%)</td><td class="val purple">₹ ${cur(headShare)}</td></tr>
  </table>

  <h2>Transaction Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Type</th><th>Portal</th>
        <th>Amount (₹)</th><th>Charge (₹)</th><th>Discount (₹)</th>
        <th>Portal Cost (₹)</th><th>Profit (₹)</th>
      </tr>
    </thead>
    <tbody>${txRows || "<tr><td colspan='8'>No transactions</td></tr>"}</tbody>
  </table>

  <h2>Expenses</h2>
  <table>
    <thead>
      <tr><th>Date</th><th>Description</th><th>Amount (₹)</th></tr>
    </thead>
    <tbody>${expRows || "<tr><td colspan='3'>No expenses</td></tr>"}</tbody>
  </table>

  <p style="margin-top:30px;color:#94a3b8;font-size:10pt">
    Generated by CashFlow · ${new Date().toLocaleString("en-IN")}
  </p>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cashflow-report-${month}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Admin Comprehensive Excel-style Export ──────────────────────────────────
// Separates the overall metrics from branch-wise metrics and transactions

export const exportAdminReportXls = ({ month, branches, performance, transactions, summary }) => {
  const toNum = (v) => Number(v || 0);
  const cur = (v) => toNum(v).toFixed(2);

  // Overall summary
  const ms = summary?.month_summary || {};

  const renderSummaryTable = (title, summ) => {
    const net = toNum(summ.net_profit_amount);
    const bs = toNum(summ.branch_manager_share_amount);
    const hs = toNum(summ.head_manager_share_amount);
    return `
  <div style="background:#f8fafc; padding:15px; border:1px solid #cbd5e1; margin-bottom: 20px;">
    <h2>${title}</h2>
    <table class="summary-table">
      <tr><td class="key">Total Transactions</td><td class="val">${summ.transaction_count || 0}</td></tr>
      <tr><td class="key">Total Transaction Amount</td><td class="val">₹ ${cur(summ.total_transaction_amount)}</td></tr>
      <tr><td class="key">Bill Payment Total</td><td class="val">₹ ${cur(summ.total_bill_amount)}</td></tr>
      <tr><td class="key">CC Transfer Total</td><td class="val">₹ ${cur(summ.total_cc_amount)}</td></tr>
      <tr><td class="key">Customer Charges Collected</td><td class="val">₹ ${cur(summ.total_customer_charge)}</td></tr>
      <tr><td class="key">Discounts Given</td><td class="val red">₹ ${cur(summ.total_discount_amount)}</td></tr>
      <tr><td class="key">Portal Costs</td><td class="val red">₹ ${cur(summ.total_portal_cost)}</td></tr>
      <tr><td class="key">Gross Profit</td><td class="val green">₹ ${cur(summ.total_profit_amount)}</td></tr>
      <tr><td class="key">Total Expenses</td><td class="val red">₹ ${cur(summ.total_expense_amount)}</td></tr>
      <tr><td class="key"><b>Net Profit (after expenses)</b></td><td class="val ${net >= 0 ? "green" : "red"}">₹ ${cur(net)}</td></tr>
      <tr><td class="key">Branch Manager Share (30%)</td><td class="val purple">₹ ${cur(bs)}</td></tr>
      <tr><td class="key">Head Manager Share (70%)</td><td class="val purple">₹ ${cur(hs)}</td></tr>
    </table>
  </div>`;
  };

  const renderTransactionsTable = (txs) => {
    const rows = txs.map(t => {
      // Adding customer name to admin export 
      return `
      <tr>
        <td>${t.date}</td>
        <td>${t.customer_name || '—'}</td>
        <td>${formatTransactionType(t.type)}</td>
        <td>${t.portal_name || ""}</td>
        <td style="text-align:right">${cur(t.amount)}</td>
        <td style="text-align:right">${cur(t.customer_charge)}</td>
        <td style="text-align:right">${cur(t.discount)}</td>
        <td style="text-align:right">${cur(t.portal_cost)}</td>
        <td style="text-align:right;color:${toNum(t.profit) >= 0 ? "green" : "red"}">${cur(t.profit)}</td>
      </tr>`;
    }).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Customer</th><th>Type</th><th>Portal</th>
          <th>Amount (₹)</th><th>Charge (₹)</th><th>Discount (₹)</th>
          <th>Portal Cost (₹)</th><th>Profit (₹)</th>
        </tr>
      </thead>
      <tbody>${rows || "<tr><td colspan='9'>No transactions</td></tr>"}</tbody>
    </table>`;
  };

  let htmlBody = `
    <h1 style="color:#0f172a; font-size: 20pt; text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 10px;">
      CASHFLOW COMPREHENSIVE ADMIN REPORT
    </h1>
    <p style="text-align: center; font-size: 14pt; margin-bottom: 30px;">
      <b>Month:</b> ${formatMonthLabel(month)}
    </p>

    <div class="section overall">
      <h1 style="color:#b91c1c; font-size: 18pt; border-bottom: 2px solid #b91c1c;">1. OVERALL REPORT (ALL BRANCHES COMBINED)</h1>
      ${renderSummaryTable("Overall Aggregate Summary", ms)}
      <h2>Overall Transactions Log</h2>
      ${renderTransactionsTable(transactions)}
    </div>
  `;

  // Branch Side-by-side comparison
  if (performance && Array.isArray(performance) && performance.length > 0) {
    const perfRows = performance.map(p => `
      <tr>
        <td>${p.branch_name}</td>
        <td>${p.transaction_count}</td>
        <td>₹ ${cur(p.total_transaction_amount)}</td>
        <td>₹ ${cur(p.total_bill_amount)}</td>
        <td style="color:red">₹ ${cur(p.total_expense_amount)}</td>
        <td style="color:green;font-weight:bold;">₹ ${cur(p.total_profit_amount)}</td>
        <td style="color:${toNum(p.net_profit_amount) >= 0 ? "green" : "red"};font-weight:bold;">₹ ${cur(p.net_profit_amount)}</td>
        <td style="color:#7c3aed;font-weight:bold;">₹ ${cur(p.branch_manager_share_amount)}</td>
      </tr>
    `).join("");

    htmlBody += `
      <br><br><br>
      <div class="section branch-totals">
        <h1 style="color:#047857; font-size: 18pt; border-bottom: 2px solid #047857; padding-top: 20px;">
          2. BRANCH TOTALS COMPARISON
        </h1>
        <table>
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Txns</th>
              <th>Total Txn Amt</th>
              <th>Bill Amt</th>
              <th>Expenses</th>
              <th>Gross Profit</th>
              <th>Net Profit</th>
              <th>Branch Share</th>
            </tr>
          </thead>
          <tbody>
            ${perfRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Branch Sections
  if (performance && Array.isArray(performance)) {
    performance.forEach((perf, index) => {
      // branch_id in performance might be nested or string, match it safely
      const branchTxs = transactions.filter(t => String(t.branch_id) === String(perf.branch_id));
      
      htmlBody += `
      <br><br><br>
      <div class="section branch">
        <h1 style="color:#1d4ed8; font-size: 18pt; border-bottom: 2px solid #1d4ed8; padding-top: 20px;">
          ${(index + 3)}. BRANCH INDIVIDUAL: ${perf.branch_name.toUpperCase()}
        </h1>
        ${renderSummaryTable("Branch Totals: " + perf.branch_name, perf)}
        <h2>${perf.branch_name} Transactions Log</h2>
        ${renderTransactionsTable(branchTxs)}
      </div>`;
    });
  }

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; padding: 20px; }
    h1 { font-size:16pt; margin-bottom:10px; }
    h2 { font-size:13pt; color:#334155; margin:20px 0 6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }
    table { border-collapse:collapse; width:100%; margin-bottom:20px; }
    th { background:#1e293b; color:white; padding:8px 10px; text-align:left; font-size:11pt; border: 1px solid #334155; }
    td { padding:7px 10px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) td { background:#f8fafc; }
    .summary-table { width: 50%; min-width: 400px; border: 2px solid #94a3b8; }
    .summary-table td { padding:8px 10px; }
    .summary-table .key { font-weight:bold; color:#475569; width:220px; background: #e2e8f0; }
    .summary-table .val { text-align:right; font-weight:600; background: #fff; }
    .green { color:green !important; font-weight:600; }
    .red { color:red !important; font-weight:600; }
    .purple { color:#7c3aed !important; font-weight:700; font-size:13pt; }
  </style>
</head>
<body>
  ${htmlBody}
  <p style="margin-top:40px;color:#94a3b8;font-size:10pt;border-top:1px solid #e2e8f0;padding-top:10px;">
    Generated by CashFlow Admin Panel · ${new Date().toLocaleString("en-IN")}
  </p>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cashflow-admin-comprehensive-${month}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
