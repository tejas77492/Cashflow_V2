import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import BranchDashboard from "./pages/BranchDashboard";
import TransactionFormPage from "./pages/TransactionFormPage";
import TransactionListPage from "./pages/TransactionListPage";
import ExpensePage from "./pages/ExpensePage";
import { getStoredToken, getStoredUser } from "./utils/storage";

function App() {
  const token = getStoredToken();
  const user = getStoredUser();

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              {user?.role === "admin" ? <AdminDashboard /> : <BranchDashboard />}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/new"
        element={
          <ProtectedRoute>
            <Layout><TransactionFormPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Layout><TransactionListPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Layout><ExpensePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
