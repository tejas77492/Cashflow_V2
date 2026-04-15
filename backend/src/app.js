const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { login } = require("./controllers/authController");
const authRoutes = require("./routes/authRoutes");
const branchRoutes = require("./routes/branchRoutes");
const userRoutes = require("./routes/userRoutes");
const portalRoutes = require("./routes/portalRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Cashflow API is running" });
});

app.post("/login", login);
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portals", portalRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
