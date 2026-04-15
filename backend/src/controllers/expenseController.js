const expenseModel = require("../models/expenseModel");

const getMonthRange = (monthValue) => {
  const [year, month] = String(monthValue || "").split("-").map(Number);

  if (!year || !month) {
    return null;
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { dateFrom: start, dateTo: end };
};

const createExpense = async (req, res, next) => {
  try {
    const { branch_id, amount, description, date } = req.body;

    if (!date || !description || typeof amount === "undefined") {
      return res.status(400).json({ message: "date, amount and description are required" });
    }

    if (req.user.role === "admin" && !branch_id) {
      return res.status(400).json({ message: "branch_id is required for admin expenses" });
    }

    const expense = await expenseModel.createExpense({
      branch_id: req.user.role === "admin" ? branch_id : req.user.branch_id,
      amount,
      description,
      date,
    });

    return res.status(201).json(expense);
  } catch (error) {
    return next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { date_from: dateFrom, date_to: dateTo, month, branch_id: branchId } = req.query;
    const monthRange = month ? getMonthRange(month) : null;

    const expenses = await expenseModel.getExpenses({
      branchId: req.user.role === "admin" ? branchId : req.user.branch_id,
      dateFrom: dateFrom || monthRange?.dateFrom,
      dateTo: dateTo || monthRange?.dateTo,
    });

    return res.status(200).json(expenses);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
};
