import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredToken } from "../utils/storage";

export default function ProtectedRoute({ children }) {
  const token = getStoredToken();
  if (!token) return <Navigate to="/" replace />;
  return children;
}
