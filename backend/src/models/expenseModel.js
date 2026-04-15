const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

const mapExpense = (expense) => {
  if (!expense) return expense;
  return {
    ...expense,
    id: expense._id,
    branch_name: expense.branch_id ? expense.branch_id.name : null,
    branch_id: expense.branch_id ? expense.branch_id._id || expense.branch_id : null,
  };
};

const buildExpenseFilters = ({ branchId, dateFrom, dateTo }) => {
  const filter = {};
  if (branchId) filter.branch_id = branchId;
  
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }
  return filter;
};

const createExpense = async (data) => {
  const expense = await Expense.create(data);
  return getExpenseById(expense._id);
};

const getExpenseById = async (id) => {
  const expense = await Expense.findById(id).populate("branch_id", "name").lean();
  return mapExpense(expense);
};

const getExpenses = async (params = {}) => {
  const filter = buildExpenseFilters(params);
  const expenses = await Expense.find(filter).populate("branch_id", "name").sort({ date: -1, _id: -1 }).lean();
  return expenses.map(mapExpense);
};

const getExpenseSummary = async (params = {}) => {
  const filter = buildExpenseFilters(params);
  const expenses = await Expense.find(filter).lean();
  
  const total_expense_amount = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    expense_count: expenses.length,
    total_expense_amount
  };
};

module.exports = {
  Expense,
  createExpense,
  getExpenses,
  getExpenseSummary,
  getExpenseById
};
