import React, { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import DataTable from "../components/DataTable";
import { apiRequest } from "../services/api";
import { getStoredUser } from "../utils/storage";
import {
  formatCurrency,
  formatTransactionType,
  getCurrentMonth,
  getMonthRange,
  getToday,
  exportMonthlyReportXls,
  exportRowsToCsv,
  formatMonthLabel,
} from "../utils/reporting";

const TX_COLS = [
  { key: "date", label: "Date" },
  { key: "customer_name", label: "Customer" },
  { key: "type", label: "Type", render: (r) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span className={`badge ${r.type === "cc" ? "badge-blue" : "badge-amber"}`}>
        {formatTransactionType(r.type)}
      </span>
      {r.card_ending && (
        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
          {r.card_type ? r.card_type.toUpperCase() : "CARD"}: *{r.card_ending}
        </span>
      )}
    </div>
  )},
  { key: "portal_name", label: "Portal" },
  { key: "amount", label: "Amount", render: (r) => formatCurrency(r.amount) },
  { key: "customer_charge", label: "Charge", render: (r) => formatCurrency(r.customer_charge) },
  { key: "discount", label: "Discount", render: (r) => Number(r.discount) > 0 ? <span style={{color:"var(--warning)"}}>{formatCurrency(r.discount)}</span> : "—" },
  { key: "portal_cost", label: "Portal Cost", render: (r) => formatCurrency(r.portal_cost) },
  { key: "bank_account_charges", label: "Bank Charges", render: (r) => Number(r.bank_account_charges) > 0 ? formatCurrency(r.bank_account_charges) : "—" },
  { key: "profit", label: "Profit", render: (r) => (
    <span style={{ color: Number(r.profit) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
      {formatCurrency(r.profit)}
    </span>
  )},
];

const EXP_COLS = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", render: (r) => <span style={{ color: "var(--danger)" }}>{formatCurrency(r.amount)}</span> },
];

export default function BranchDashboard() {
  const user = getStoredUser();
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { dateFrom, dateTo } = getMonthRange(month);
      const [sum, txs, exps] = await Promise.all([
        apiRequest(`/dashboard/summary?date=${getToday()}&month=${month}`),
        apiRequest(`/transactions?date_from=${dateFrom}&date_to=${dateTo}`),
        apiRequest(`/expenses?date_from=${dateFrom}&date_to=${dateTo}`),
      ]);
      setSummary(sum);
      setTransactions(txs);
      setExpenses(exps);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const today = summary?.today || {};
  const ms = summary?.month_summary || {};
  const netProfit = Number(ms.net_profit_amount || 0);

  return (
    <div>
      <div className="page-header">
        <h2>Branch Dashboard</h2>
        <p>
          Welcome back, <strong>{user?.name}</strong>
          {user?.branch_name ? ` · ${user.branch_name}` : ""}
        </p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Month selector + export */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 500 }}>
            📅 Working Month:
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: "auto" }}
            />
          </label>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => exportRowsToCsv(`transactions-${month}.csv`, TX_COLS, transactions)}
            >
              ↓ CSV
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() =>
                exportMonthlyReportXls({
                  month,
                  transactions,
                  expenses,
                  summary,
                  branchName: user?.branch_name,
                })
              }
            >
              ↓ Excel Report
            </button>
          </div>
        </div>
      </div>

      {/* TODAY */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Today's Summary
      </div>
      <div className="summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Today Total" value={formatCurrency(today.total_transaction_amount)} accent="#3b82f6" />
        <SummaryCard title="Today Bills" value={formatCurrency(today.total_bill_amount)} accent="#f59e0b" />
        <SummaryCard title="Today CC" value={formatCurrency(today.total_cc_amount)} accent="#8b5cf6" />
        <SummaryCard title="Today Profit" value={formatCurrency(today.total_profit_amount)} accent="#10b981" />
      </div>

      {/* MONTH */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {formatMonthLabel(month)} — Monthly Summary
      </div>
      <div className="summary-grid" style={{ marginBottom: 24 }}>
        <SummaryCard title="Month Total" value={formatCurrency(ms.total_transaction_amount)} accent="#3b82f6" />
        <SummaryCard title="Bill Total" value={formatCurrency(ms.total_bill_amount)} accent="#f59e0b" />
        <SummaryCard title="CC Total" value={formatCurrency(ms.total_cc_amount)} accent="#8b5cf6" />
        <SummaryCard title="Gross Profit" value={formatCurrency(ms.total_profit_amount)} accent="#10b981" />
        <SummaryCard title="Expenses" value={formatCurrency(ms.total_expense_amount)} accent="#ef4444" />
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          accent={netProfit >= 0 ? "#059669" : "#dc2626"}
          sub="After deducting expenses"
        />
        <SummaryCard title="Branch Share (30%)" value={formatCurrency(ms.branch_manager_share_amount)} accent="#8b5cf6" />
        <SummaryCard title="Head Share (70%)" value={formatCurrency(ms.head_manager_share_amount)} accent="#6366f1" />
        <SummaryCard title="Transactions" value={ms.transaction_count || 0} accent="#0ea5e9" />
      </div>

      {/* Settlement breakdown */}
      <div className="two-panel" style={{ marginBottom: 20 }}>
        <div className="panel">
          <h3 style={{ marginBottom: 14 }}>Month Settlement Breakdown</h3>
          <div className="metric-list">
            <div className="metric-row">
              <span className="metric-label">Customer Charges Collected</span>
              <span className="metric-value">{formatCurrency(ms.total_customer_charge)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Discounts Given</span>
              <span className="metric-value expense">− {formatCurrency(ms.total_discount_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Portal Costs</span>
              <span className="metric-value expense">− {formatCurrency(ms.total_portal_cost)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Gross Profit</span>
              <span className="metric-value profit">{formatCurrency(ms.total_profit_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Monthly Expenses</span>
              <span className="metric-value expense">− {formatCurrency(ms.total_expense_amount)}</span>
            </div>
            <div className="metric-row" style={{ borderTop: "2px solid var(--border)", paddingTop: 12 }}>
              <span className="metric-label" style={{ fontWeight: 700 }}>Net Profit</span>
              <span className={`metric-value ${netProfit >= 0 ? "profit" : "expense"}`} style={{ fontSize: 16 }}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: 14 }}>Profit Distribution</h3>
          <div className="metric-list">
            <div className="metric-row">
              <span className="metric-label">Distributable Profit</span>
              <span className="metric-value">{formatCurrency(Math.max(netProfit, 0))}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Branch Manager Share (30%)</span>
              <span className="metric-value share">{formatCurrency(ms.branch_manager_share_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Head Manager Share (70%)</span>
              <span className="metric-value share">{formatCurrency(ms.head_manager_share_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">CC Transfer Total</span>
              <span className="metric-value">{formatCurrency(ms.total_cc_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Bill Payment Total</span>
              <span className="metric-value">{formatCurrency(ms.total_bill_amount)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Expense Entries</span>
              <span className="metric-value">{ms.expense_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Transactions — {formatMonthLabel(month)}</h3>
          <span className="badge badge-blue">{transactions.length} records</span>
        </div>
        <DataTable columns={TX_COLS} data={transactions} emptyText="No transactions this month." />
      </div>

      {/* Expenses table */}
      <div className="panel">
        <div className="panel-header">
          <h3>Expenses — {formatMonthLabel(month)}</h3>
          <span className="badge badge-red">{expenses.length} entries</span>
        </div>
        <DataTable columns={EXP_COLS} data={expenses} emptyText="No expenses this month." />
      </div>
    </div>
  );
}
