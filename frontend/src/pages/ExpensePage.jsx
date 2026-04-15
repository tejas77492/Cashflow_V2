import React, { useEffect, useState } from "react";
import DataTable from "../components/DataTable";
import SummaryCard from "../components/SummaryCard";
import { apiRequest } from "../services/api";
import { getStoredUser } from "../utils/storage";
import { exportRowsToCsv, formatCurrency, getCurrentMonth, getMonthRange, formatMonthLabel } from "../utils/reporting";

const EXP_COLS = [
  { key: "date", label: "Date" },
  { key: "branch_name", label: "Branch" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", render: (r) => <span style={{ color: "var(--danger)", fontWeight: 600 }}>{formatCurrency(r.amount)}</span> },
];

export default function ExpensePage() {
  const user = getStoredUser();
  const [branches, setBranches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [form, setForm] = useState({
    branch_id: user?.branch_id || "",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [status, setStatus] = useState({ type: "", msg: "" });

  const load = async () => {
    const { dateFrom, dateTo } = getMonthRange(month);
    const [exps, bs] = await Promise.all([
      apiRequest(`/expenses?date_from=${dateFrom}&date_to=${dateTo}`),
      user?.role === "admin" ? apiRequest("/branches") : Promise.resolve([]),
    ]);
    setExpenses(exps);
    setBranches(bs);
  };

  useEffect(() => { load(); }, [month]);

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });
    try {
      await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount), branch_id: form.branch_id || user?.branch_id }),
      });
      setStatus({ type: "success", msg: "✓ Expense saved." });
      setForm((f) => ({ ...f, amount: "", description: "" }));
      load();
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Expenses</h2>
        <p>Track monthly branch expenses. These are deducted from profit at month-end settlement.</p>
      </div>

      {status.msg && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
          {status.msg}
        </div>
      )}

      <div className="two-panel" style={{ alignItems: "start", marginBottom: 20 }}>
        {/* Form */}
        <div className="panel">
          <h3 style={{ marginBottom: 16 }}>Add Expense</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            {user?.role === "admin" && (
              <label>
                Branch
                <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required>
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
            <label>
              Amount (₹)
              <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
            </label>
            <label>
              Description
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Office rent, electricity bill…" required />
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </label>
            <button className="btn btn-primary" type="submit">Save Expense</button>
          </form>
        </div>

        {/* Summary */}
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 14 }}>Filter & Export</h3>
            <div className="form-grid">
              <label>
                Month
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </label>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => exportRowsToCsv(`expenses-${month}.csv`, EXP_COLS, expenses)}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>
          <div className="summary-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <SummaryCard title="Entries" value={expenses.length} accent="#3b82f6" />
            <SummaryCard title="Total Expenses" value={formatCurrency(total)} accent="#ef4444" sub={formatMonthLabel(month)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Expense Records — {formatMonthLabel(month)}</h3>
          <span className="badge badge-red">{expenses.length} entries</span>
        </div>
        <DataTable columns={EXP_COLS} data={expenses} emptyText="No expenses recorded this month." />
      </div>
    </div>
  );
}
