import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { setStoredSession } from "../utils/storage";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStoredSession(res.token, res.user);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">CF</div>
        <h1>CashFlow</h1>
        <p className="login-sub">
          Manage transactions, track profits, and settle branch accounts — all in one place.
        </p>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email Address
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="xyz@cashflow.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="•••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-light)", textAlign: "center" }}>
          Default: admin email / admin password
        </p>
      </div>
    </div>
  );
}
