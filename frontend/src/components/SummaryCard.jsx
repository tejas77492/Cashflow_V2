import React from "react";

export default function SummaryCard({ title, value, sub, accent = "#4f46e5" }) {
  return (
    <div className="summary-card" style={{ "--accent": accent }}>
      <div className="card-label">{title}</div>
      <div className="card-value">{value ?? "—"}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}
