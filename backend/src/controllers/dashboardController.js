const branchModel = require("../models/branchModel");
const expenseModel = require("../models/expenseModel");
const settingsModel = require("../models/settingsModel");
const transactionModel = require("../models/transactionModel");

const getMonthRange = (monthValue) => {
  const [year, month] = String(monthValue || "").split("-").map(Number);

  if (!year || !month) {
    return null;
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { dateFrom: start, dateTo: end };
};

const toNumber = (value) => Number(value || 0);

const buildShareSummary = (monthTransactions, monthExpenses, settings) => {
  const netProfit = toNumber(monthTransactions.total_profit_amount) - toNumber(monthExpenses.total_expense_amount);
  const branchShareRate = toNumber(settings?.branch_manager_share_percentage);
  const headShareRate = toNumber(settings?.head_manager_share_percentage);
  const distributableProfit = Math.max(netProfit, 0);

  return {
    net_profit_amount: netProfit,
    branch_manager_share_amount: (distributableProfit * branchShareRate) / 100,
    head_manager_share_amount: (distributableProfit * headShareRate) / 100,
  };
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const today = req.query.date || new Date().toISOString().slice(0, 10);
    const month = req.query.month || today.slice(0, 7);
    const branchId = req.user.role === "admin" ? req.query.branch_id : req.user.branch_id;
    const monthRange = getMonthRange(month);
    const settings = await settingsModel.getSettings();

    const [todayTransactions, monthTransactions, monthExpenses] = await Promise.all([
      transactionModel.getTransactionSummary({
        branchId,
        dateFrom: today,
        dateTo: today,
      }),
      transactionModel.getTransactionSummary({
        branchId,
        dateFrom: monthRange?.dateFrom,
        dateTo: monthRange?.dateTo,
      }),
      expenseModel.getExpenseSummary({
        branchId,
        dateFrom: monthRange?.dateFrom,
        dateTo: monthRange?.dateTo,
      }),
    ]);

    return res.status(200).json({
      date: today,
      month,
      settings,
      today: todayTransactions,
      month_summary: {
        ...monthTransactions,
        ...monthExpenses,
        ...buildShareSummary(monthTransactions, monthExpenses, settings),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getBranchPerformance = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const monthRange = getMonthRange(month);
    const settings = await settingsModel.getSettings();
    const branches = await branchModel.getAllBranches();

    const performance = await Promise.all(
      branches.map(async (branch) => {
        const [transactionSummary, expenseSummary] = await Promise.all([
          transactionModel.getTransactionSummary({
            branchId: branch.id,
            dateFrom: monthRange?.dateFrom,
            dateTo: monthRange?.dateTo,
          }),
          expenseModel.getExpenseSummary({
            branchId: branch.id,
            dateFrom: monthRange?.dateFrom,
            dateTo: monthRange?.dateTo,
          }),
        ]);

        return {
          branch_id: branch.id,
          branch_name: branch.name,
          status: branch.status,
          ...transactionSummary,
          ...expenseSummary,
          ...buildShareSummary(transactionSummary, expenseSummary, settings),
        };
      })
    );

    return res.status(200).json({ month, settings, branches: performance });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getBranchPerformance,
};
