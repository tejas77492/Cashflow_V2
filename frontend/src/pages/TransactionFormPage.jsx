import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { getStoredUser } from "../utils/storage";
import { formatCurrency } from "../utils/reporting";

export default function TransactionFormPage() {
  const user = getStoredUser();
  const [branches, setBranches] = useState([]);
  const [portals, setPortals] = useState([]);
  const [settings, setSettings] = useState({ cc_charge_percentage: 2.5, bill_charge_percentage: 3.5 });
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    branch_id: user?.branch_id || "",
    type: "bill",
    portal_id: "",
    amount: "",
    discount: "",
    customer_name: "",
    card_ending: "",
    card_type: "",
    account_ending: "",
    bank_name: "",
    bank_account_charges: "",
  });
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [portalData, settingsData, branchData] = await Promise.all([
        apiRequest("/portals"),
        apiRequest("/settings"),
        user?.role === "admin" ? apiRequest("/branches") : Promise.resolve([]),
      ]);
      setPortals(portalData);
      setSettings(settingsData);
      setBranches(branchData);
      if (portalData[0]) {
        setForm((f) => ({ ...f, portal_id: f.portal_id || String(portalData[0].id) }));
      }
    };
    load();
  }, []);

  const preview = useMemo(() => {
    const amount = Number(form.amount || 0);
    const discount = Number(form.discount || 0);
    const portal = portals.find((p) => String(p.id) === String(form.portal_id));
    const globalPct =
      form.type === "cc"
        ? Number(settings.cc_charge_percentage || 0)
        : Number(settings.bill_charge_percentage || 0);
    const portalPct = Number(portal?.charge_percentage || 0);
    const customerCharge = (amount * globalPct) / 100;
    const portalCost = (amount * portalPct) / 100;
    const bankCharges = Number(form.bank_account_charges || 0);
    const profit = customerCharge - discount - portalCost - bankCharges;
    return { customerCharge, portalCost, profit, globalPct, portalPct, bankCharges };
  }, [form, portals, settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: "", msg: "" });
    try {
      await apiRequest("/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          discount: Number(form.discount || 0),
          bank_account_charges: Number(form.bank_account_charges || 0),
          branch_id: form.branch_id || user?.branch_id,
          portal_id: form.portal_id,
        }),
      });
      setStatus({ type: "success", msg: "✓ Transaction saved successfully!" });
      setForm((f) => ({ ...f, amount: "", discount: "", customer_name: "", card_ending: "", card_type: "", account_ending: "", bank_name: "", bank_account_charges: "" }));
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const canDiscount = user?.role === "branch_manager" || user?.role === "admin";

  return (
    <div>
      <div className="page-header">
        <h2>New Transaction</h2>
        <p>Enter transaction details — profit is calculated in real-time below.</p>
      </div>

      {status.msg && (
        <div className={`alert ${status.type === "success" ? "alert-success" : "alert-error"}`}>
          {status.msg}
        </div>
      )}

      <div className="two-panel" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="panel">
          <div className="panel-header">
            <h3>Transaction Details</h3>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>

            {user?.role === "admin" && (
              <label>
                Branch
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  required
                >
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              Transaction Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="bill">Bill Payment ({Number(settings.bill_charge_percentage).toFixed(2)}% charge)</option>
                <option value="cc">CC Transfer ({Number(settings.cc_charge_percentage).toFixed(2)}% charge)</option>
              </select>
            </label>

            <label>
              Portal
              <select
                value={form.portal_id}
                onChange={(e) => setForm({ ...form, portal_id: e.target.value })}
                required
              >
                <option value="">— Select Portal —</option>
                {portals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({Number(p.charge_percentage).toFixed(2)}% cost)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Transaction Amount (₹)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Customer Name
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </label>

            {form.type === "cc" && (
              <>
                <label>
                  Card Ending (Last 4 digits)
                  <input
                    type="text"
                    maxLength="4"
                    value={form.card_ending}
                    onChange={(e) => setForm({ ...form, card_ending: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. 1234"
                  />
                </label>

                <label>
                  Card Details (Bank / Network)
                  <input
                    type="text"
                    value={form.card_type}
                    onChange={(e) => setForm({ ...form, card_type: e.target.value })}
                    placeholder="e.g. HDFC Visa"
                  />
                </label>

                <label>
                  Destination Account (Last 4 digits)
                  <input
                    type="text"
                    maxLength="4"
                    value={form.account_ending}
                    onChange={(e) => setForm({ ...form, account_ending: e.target.value.replace(/\D/g, "") })}
                    placeholder="e.g. 5678"
                  />
                </label>

                <label>
                  Destination Bank Name
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. SBI"
                  />
                </label>
              </>
            )}

            <label>
              Bank Account Charges (₹)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.bank_account_charges}
                onChange={(e) => setForm({ ...form, bank_account_charges: e.target.value })}
                placeholder="0.00"
              />
            </label>

            <label>
              Discount Amount (₹)
              <span className="label-hint">
                {canDiscount ? "Applied on customer charge" : "Only branch managers can apply discounts"}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="0.00"
                disabled={!canDiscount}
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 6 }}>
              {saving ? "Saving…" : "Save Transaction"}
            </button>
          </form>
        </div>

        {/* Live Preview */}
        <div>
          <div className="preview-card">
            <h3>Live Calculation Preview</h3>

            <div className="preview-row">
              <span className="label">Transaction Amount</span>
              <span className="value">{formatCurrency(form.amount || 0)}</span>
            </div>
            <div className="preview-row">
              <span className="label">
                Customer Charge ({preview.globalPct.toFixed(2)}%)
              </span>
              <span className="value">{formatCurrency(preview.customerCharge)}</span>
            </div>
            {Number(form.discount) > 0 && (
              <div className="preview-row">
                <span className="label">Discount Applied</span>
                <span className="value negative">− {formatCurrency(form.discount)}</span>
              </div>
            )}
            <div className="preview-row">
              <span className="label">
                Portal Cost ({preview.portalPct.toFixed(2)}%)
              </span>
              <span className="value negative">− {formatCurrency(preview.portalCost)}</span>
            </div>
            {Number(form.bank_account_charges) > 0 && (
              <div className="preview-row">
                <span className="label">Bank Account Charges</span>
                <span className="value negative">− {formatCurrency(form.bank_account_charges)}</span>
              </div>
            )}
            <div className="preview-row" style={{ borderTop: "1px solid rgba(255,255,255,0.3)", paddingTop: 12, marginTop: 4 }}>
              <span className="label" style={{ fontWeight: 700 }}>Net Profit</span>
              <span className={`value ${preview.profit >= 0 ? "profit" : "negative"}`}>
                {formatCurrency(preview.profit)}
              </span>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 12 }}>Formula</h3>
            <div className="metric-list">
              <div className="metric-row">
                <span className="metric-label">Customer Charge</span>
                <span className="metric-value">Amount × {preview.globalPct.toFixed(2)}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Portal Cost</span>
                <span className="metric-value">Amount × {preview.portalPct.toFixed(2)}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Profit</span>
                <span className="metric-value">Charge − Discount − Portal Cost − Bank Charges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
