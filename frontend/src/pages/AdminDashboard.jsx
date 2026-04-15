import React, { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import DataTable from "../components/DataTable";
import { apiRequest } from "../services/api";
import {
  formatCurrency,
  formatPercent,
  formatTransactionType,
  getCurrentMonth,
  getMonthRange,
  getToday,
  exportAdminReportXls,
  formatMonthLabel,
} from "../utils/reporting";

const TABS = ["Overview", "Branches", "Users", "Portals", "Settings", "All Transactions"];

const defaultBranch = { name: "", status: "active" };
const defaultUser = { name: "", email: "", password: "", role: "branch_manager", branch_id: "" };
const defaultPortal = { name: "", charge_percentage: "" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const [month, setMonth] = useState(getCurrentMonth());

  // data
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [portals, setPortals] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({
    cc_charge_percentage: "2.50",
    bill_charge_percentage: "3.50",
    branch_manager_share_percentage: "30",
    head_manager_share_percentage: "70",
  });
  const [overviewSummary, setOverviewSummary] = useState(null);

  // forms
  const [branchForm, setBranchForm] = useState(defaultBranch);
  const [userForm, setUserForm] = useState(defaultUser);
  const [portalForm, setPortalForm] = useState(defaultPortal);
  const [editBranch, setEditBranch] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editPortal, setEditPortal] = useState(null);

  // ui
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [filterBranch, setFilterBranch] = useState("");

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const loadAll = async () => {
    try {
      const [b, u, p, s, perf, txs, sum] = await Promise.all([
        apiRequest("/branches"),
        apiRequest("/users"),
        apiRequest("/portals"),
        apiRequest("/settings"),
        apiRequest(`/dashboard/branch-performance?month=${month}`),
        apiRequest(`/transactions?month=${month}`),
        apiRequest(`/dashboard/summary?date=${getToday()}&month=${month}`),
      ]);
      setBranches(b);
      setUsers(u);
      setPortals(p);
      setPerformance(perf.branches || []);
      setTransactions(txs);
      setOverviewSummary(sum);
      setSettings({
        cc_charge_percentage: String(s.cc_charge_percentage ?? "2.50"),
        bill_charge_percentage: String(s.bill_charge_percentage ?? "3.50"),
        branch_manager_share_percentage: String(s.branch_manager_share_percentage ?? "30"),
        head_manager_share_percentage: String(s.head_manager_share_percentage ?? "70"),
      });
    } catch (e) {
      flash("error", e.message);
    }
  };

  useEffect(() => { loadAll(); }, [month]);

  /* ── Branch CRUD ── */
  const saveBranch = async () => {
    try {
      if (editBranch) {
        await apiRequest(`/branches/${editBranch.id}`, { method: "PUT", body: JSON.stringify(branchForm) });
        flash("success", "Branch updated.");
        setEditBranch(null);
      } else {
        await apiRequest("/branches", { method: "POST", body: JSON.stringify(branchForm) });
        flash("success", "Branch created.");
      }
      setBranchForm(defaultBranch);
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  const deleteBranch = async (id) => {
    if (!confirm("Delete this branch? This cannot be undone.")) return;
    try {
      await apiRequest(`/branches/${id}`, { method: "DELETE" });
      flash("success", "Branch deleted.");
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  /* ── User CRUD ── */
  const saveUser = async () => {
    try {
      const payload = { ...userForm, branch_id: userForm.branch_id || null };
      if (editUser) {
        if (!payload.password) delete payload.password;
        await apiRequest(`/users/${editUser.id}`, { method: "PUT", body: JSON.stringify(payload) });
        flash("success", "User updated.");
        setEditUser(null);
      } else {
        await apiRequest("/users", { method: "POST", body: JSON.stringify(payload) });
        flash("success", "User created.");
      }
      setUserForm(defaultUser);
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      flash("success", "User deleted.");
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  /* ── Portal CRUD ── */
  const savePortal = async () => {
    try {
      if (editPortal) {
        await apiRequest(`/portals/${editPortal.id}`, { method: "PUT", body: JSON.stringify(portalForm) });
        flash("success", "Portal updated.");
        setEditPortal(null);
      } else {
        await apiRequest("/portals", { method: "POST", body: JSON.stringify(portalForm) });
        flash("success", "Portal created.");
      }
      setPortalForm(defaultPortal);
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  const deletePortal = async (id) => {
    if (!confirm("Delete this portal?")) return;
    try {
      await apiRequest(`/portals/${id}`, { method: "DELETE" });
      flash("success", "Portal deleted.");
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  /* ── Transactions ── */
  const deleteTransaction = async (id) => {
    if (!confirm("Delete this transaction? This affects calculations permanently.")) return;
    try {
      await apiRequest(`/transactions/${id}`, { method: "DELETE" });
      flash("success", "Transaction deleted.");
      loadAll();
    } catch (e) { flash("error", e.message); }
  };

  /* ── Settings ── */
  const saveSettings = async () => {
    try {
      await apiRequest("/settings", { method: "PUT", body: JSON.stringify(settings) });
      flash("success", "Settings updated successfully.");
    } catch (e) { flash("error", e.message); }
  };

  /* ── Helpers ── */
  const startEditBranch = (b) => { setEditBranch(b); setBranchForm({ name: b.name, status: b.status }); setTab("Branches"); };
  const startEditUser = (u) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, password: "", role: u.role, branch_id: u.branch_id || "" }); setTab("Users"); };
  const startEditPortal = (p) => { setEditPortal(p); setPortalForm({ name: p.name, charge_percentage: p.charge_percentage }); setTab("Portals"); };

  const ms = overviewSummary?.month_summary || {};
  const filteredTx = filterBranch ? transactions.filter((t) => String(t.branch_id) === filterBranch) : transactions;

  /* ── Columns ── */
  const perfCols = [
    { key: "branch_name", label: "Branch" },
    { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "active" ? "badge-green" : "badge-gray"}`}>{r.status}</span> },
    { key: "transaction_count", label: "Txns" },
    { key: "total_transaction_amount", label: "Total", render: (r) => formatCurrency(r.total_transaction_amount) },
    { key: "total_bill_amount", label: "Bills", render: (r) => formatCurrency(r.total_bill_amount) },
    { key: "total_profit_amount", label: "Profit", render: (r) => <span style={{ color: "var(--success)", fontWeight: 600 }}>{formatCurrency(r.total_profit_amount)}</span> },
    { key: "total_expense_amount", label: "Expenses", render: (r) => <span style={{ color: "var(--danger)" }}>{formatCurrency(r.total_expense_amount)}</span> },
    { key: "net_profit_amount", label: "Net Profit", render: (r) => <span style={{ fontWeight: 700, color: Number(r.net_profit_amount) >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(r.net_profit_amount)}</span> },
    { key: "branch_manager_share_amount", label: "Branch Share", render: (r) => formatCurrency(r.branch_manager_share_amount) },
    { key: "head_manager_share_amount", label: "Head Share", render: (r) => formatCurrency(r.head_manager_share_amount) },
  ];

  const txCols = [
    { key: "date", label: "Date" },
    { key: "customer_name", label: "Customer" },
    { key: "branch_name", label: "Branch" },
    { key: "type", label: "Type", render: (r) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span className={`badge ${r.type === "cc" ? "badge-blue" : "badge-amber"}`}>{formatTransactionType(r.type)}</span>
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
    { key: "discount", label: "Discount", render: (r) => Number(r.discount) > 0 ? formatCurrency(r.discount) : "—" },
    { key: "portal_cost", label: "Portal Cost", render: (r) => formatCurrency(r.portal_cost) },
    { key: "bank_account_charges", label: "Bank Charges", render: (r) => Number(r.bank_account_charges) > 0 ? formatCurrency(r.bank_account_charges) : "—" },
    { key: "profit", label: "Profit", render: (r) => <span style={{ color: Number(r.profit) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{formatCurrency(r.profit)}</span> },
    { key: "actions", label: "", render: (r) => (
      <button className="btn btn-danger btn-sm" onClick={() => deleteTransaction(r.id)} title="Delete Transaction">Del</button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Admin Control Panel</h2>
        <p>Manage branches, users, portals and view all transaction data across the system.</p>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-error"}`}>
          {msg.text}
        </div>
      )}

      {/* Month picker */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 500 }}>
            📅 Reporting Month:
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: "auto" }} />
          </label>
          <div style={{ marginLeft: "auto" }}>
            <button
              className="btn btn-success btn-sm"
              onClick={() => exportAdminReportXls({ 
                month, 
                branches, 
                performance, 
                transactions, 
                summary: overviewSummary 
              })}
            >
              ↓ Export Excel Report
            </button>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "Overview" && (
        <div>
          <div className="summary-grid">
            <SummaryCard title="Branches" value={branches.length} accent="#3b82f6" />
            <SummaryCard title="Users" value={users.length} accent="#10b981" />
            <SummaryCard title="Portals" value={portals.length} accent="#f59e0b" />
            <SummaryCard title="Month Total" value={formatCurrency(ms.total_transaction_amount)} accent="#6366f1" />
            <SummaryCard title="Month Bills" value={formatCurrency(ms.total_bill_amount)} accent="#f59e0b" />
            <SummaryCard title="Month CC" value={formatCurrency(ms.total_cc_amount)} accent="#8b5cf6" />
            <SummaryCard title="Gross Profit" value={formatCurrency(ms.total_profit_amount)} accent="#10b981" />
            <SummaryCard title="Expenses" value={formatCurrency(ms.total_expense_amount)} accent="#ef4444" />
            <SummaryCard title="Net Profit" value={formatCurrency(ms.net_profit_amount)} accent={Number(ms.net_profit_amount) >= 0 ? "#059669" : "#dc2626"} />
          </div>
          <div className="panel">
            <div className="panel-header">
              <h3>Branch-wise Performance — {formatMonthLabel(month)}</h3>
            </div>
            <DataTable columns={perfCols} data={performance} emptyText="No branch data." />
          </div>
        </div>
      )}

      {/* ── BRANCHES ── */}
      {tab === "Branches" && (
        <div className="two-panel" style={{ alignItems: "start" }}>
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>{editBranch ? "✏ Edit Branch" : "➕ New Branch"}</h3>
            <div className="form-grid">
              <label>
                Branch Name
                <input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="e.g. Nashik Branch" />
              </label>
              <label>
                Status
                <select value={branchForm.status} onChange={(e) => setBranchForm({ ...branchForm, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={saveBranch} style={{ flex: 1 }}>
                  {editBranch ? "Update Branch" : "Create Branch"}
                </button>
                {editBranch && (
                  <button className="btn btn-outline" onClick={() => { setEditBranch(null); setBranchForm(defaultBranch); }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>All Branches</h3>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "status", label: "Status", render: (r) => <span className={`badge ${r.status === "active" ? "badge-green" : "badge-gray"}`}>{r.status}</span> },
                { key: "actions", label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEditBranch(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteBranch(r.id)}>Del</button>
                  </div>
                )},
              ]}
              data={branches}
            />
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "Users" && (
        <div className="two-panel" style={{ alignItems: "start" }}>
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>{editUser ? "✏ Edit User" : "➕ New User"}</h3>
            <div className="form-grid">
              <label>Full Name<input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></label>
              <label>Email<input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></label>
              <label>
                Password
                <span className="label-hint">{editUser ? "Leave blank to keep existing" : "Required"}</span>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="••••••••" />
              </label>
              <label>
                Role
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="operator">Operator</option>
                </select>
              </label>
              <label>
                Assign Branch
                <select value={userForm.branch_id} onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })}>
                  <option value="">— No Branch (Admin) —</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={saveUser} style={{ flex: 1 }}>
                  {editUser ? "Update User" : "Create User"}
                </button>
                {editUser && (
                  <button className="btn btn-outline" onClick={() => { setEditUser(null); setUserForm(defaultUser); }}>Cancel</button>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>All Users</h3>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "role", label: "Role", render: (r) => <span className={`badge ${r.role === "admin" ? "badge-purple" : r.role === "branch_manager" ? "badge-blue" : "badge-gray"}`}>{r.role.replace("_", " ")}</span> },
                { key: "branch_name", label: "Branch", render: (r) => r.branch_name || "—" },
                { key: "actions", label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEditUser(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(r.id)}>Del</button>
                  </div>
                )},
              ]}
              data={users}
            />
          </div>
        </div>
      )}

      {/* ── PORTALS ── */}
      {tab === "Portals" && (
        <div className="two-panel" style={{ alignItems: "start" }}>
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>{editPortal ? "✏ Edit Portal" : "➕ New Portal"}</h3>
            <div className="form-grid">
              <label>Portal Name<input value={portalForm.name} onChange={(e) => setPortalForm({ ...portalForm, name: e.target.value })} placeholder="e.g. PayTM Portal" /></label>
              <label>
                Portal Charge %
                <span className="label-hint">This is the cost deducted from your profit</span>
                <input type="number" step="0.01" min="0" value={portalForm.charge_percentage} onChange={(e) => setPortalForm({ ...portalForm, charge_percentage: e.target.value })} placeholder="e.g. 1.00" />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={savePortal} style={{ flex: 1 }}>
                  {editPortal ? "Update Portal" : "Create Portal"}
                </button>
                {editPortal && (
                  <button className="btn btn-outline" onClick={() => { setEditPortal(null); setPortalForm(defaultPortal); }}>Cancel</button>
                )}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>All Portals</h3>
            <DataTable
              columns={[
                { key: "name", label: "Portal Name" },
                { key: "charge_percentage", label: "Charge %", render: (r) => <span className="badge badge-amber">{formatPercent(r.charge_percentage)}</span> },
                { key: "actions", label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => startEditPortal(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePortal(r.id)}>Del</button>
                  </div>
                )},
              ]}
              data={portals}
            />
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "Settings" && (
        <div className="two-panel" style={{ alignItems: "start" }}>
          <div className="panel">
            <h3 style={{ marginBottom: 4 }}>Fixed Charge Rates</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              These are the rates charged to customers. Each portal also has its own cost that is deducted from profit.
            </p>
            <div className="form-grid">
              <label>
                Bill Payment Charge %
                <span className="label-hint">Currently: {settings.bill_charge_percentage}%</span>
                <input type="number" step="0.01" min="0" value={settings.bill_charge_percentage} onChange={(e) => setSettings({ ...settings, bill_charge_percentage: e.target.value })} />
              </label>
              <label>
                CC Transfer Charge %
                <span className="label-hint">Currently: {settings.cc_charge_percentage}%</span>
                <input type="number" step="0.01" min="0" value={settings.cc_charge_percentage} onChange={(e) => setSettings({ ...settings, cc_charge_percentage: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 4 }}>Profit Split</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              Net profit (after expenses) is split between branch manager and head manager.
            </p>
            <div className="form-grid">
              <label>
                Branch Manager Share %
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.branch_manager_share_percentage}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSettings({ ...settings, branch_manager_share_percentage: v, head_manager_share_percentage: v === "" ? "" : String(Math.max(0, 100 - Number(v))) });
                  }}
                />
              </label>
              <label>
                Head Manager Share %
                <input type="number" value={settings.head_manager_share_percentage} disabled />
              </label>
              <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALL TRANSACTIONS ── */}
      {tab === "All Transactions" && (
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                Branch:
                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} style={{ width: "auto" }}>
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <span className="badge badge-blue" style={{ alignSelf: "center" }}>{filteredTx.length} records</span>
            </div>
          </div>
          <div className="panel">
            <DataTable columns={txCols} data={filteredTx} emptyText="No transactions found." />
          </div>
        </div>
      )}
    </div>
  );
}
