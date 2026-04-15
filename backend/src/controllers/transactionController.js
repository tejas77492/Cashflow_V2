const settingsModel = require("../models/settingsModel");
const portalModel = require("../models/portalModel");
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

const createTransaction = async (req, res, next) => {
  try {
    const { date, branch_id, type, portal_id, amount, discount = 0, customer_name, card_ending, card_type, account_ending, bank_name, bank_account_charges = 0 } = req.body;

    if (!date || !branch_id || !type || !portal_id || typeof amount === "undefined") {
      return res
        .status(400)
        .json({ message: "date, branch_id, type, portal_id and amount are required" });
    }

    if (!["cc", "bill"].includes(type)) {
      return res.status(400).json({ message: "Transaction type must be 'cc' or 'bill'" });
    }

    if (req.user.role === "admin" && !branch_id) {
      return res.status(400).json({ message: "branch_id is required for admin transactions" });
    }

    const numericAmount = Number(amount);
    const numericDiscount = Number(discount || 0);
    const numericBankCharges = Number(bank_account_charges || 0);

    if (Number.isNaN(numericAmount) || Number.isNaN(numericDiscount) || Number.isNaN(numericBankCharges)) {
      return res.status(400).json({ message: "Amount, discount and bank account charges must be valid numbers" });
    }

    if (numericDiscount > 0 && req.user.role !== "branch_manager") {
      return res.status(403).json({ message: "Only branch managers can apply discounts" });
    }

    const settings = await settingsModel.getSettings();
    const portal = await portalModel.getPortalById(portal_id);

    if (!portal) {
      return res.status(404).json({ message: "Portal not found" });
    }

    const globalChargePercentage =
      type === "cc"
        ? Number(settings?.cc_charge_percentage || 0)
        : Number(settings?.bill_charge_percentage || 0);

    const customerCharge = (numericAmount * globalChargePercentage) / 100;
    const portalCost = (numericAmount * Number(portal.charge_percentage || 0)) / 100;
    const profit = customerCharge - numericDiscount - portalCost - numericBankCharges;

    const transaction = await transactionModel.createTransaction({
      date,
      branch_id: req.user.role === "admin" ? branch_id : req.user.branch_id,
      type,
      portal_id,
      customer_name,
      card_ending,
      card_type,
      account_ending,
      bank_name,
      bank_account_charges: numericBankCharges,
      amount: numericAmount,
      customer_charge: customerCharge,
      discount: numericDiscount,
      portal_cost: portalCost,
      profit,
      created_by: req.user.id,
    });

    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { date_from: dateFrom, date_to: dateTo, month, type, branch_id: branchId } = req.query;
    const monthRange = month ? getMonthRange(month) : null;

    const transactions = await transactionModel.getTransactions({
      branchId: req.user.role === "admin" ? branchId : req.user.branch_id,
      dateFrom: dateFrom || monthRange?.dateFrom,
      dateTo: dateTo || monthRange?.dateTo,
      type,
    });

    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
};

const getBranchTransactions = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const transactions = await transactionModel.getTransactions({ branchId });
    return res.status(200).json(transactions);
  } catch (error) {
    return next(error);
  }
};

const getTransactionSummary = async (req, res, next) => {
  try {
    const { date_from: dateFrom, date_to: dateTo, month, branch_id: branchId } = req.query;
    const monthRange = month ? getMonthRange(month) : null;

    const summary = await transactionModel.getTransactionSummary({
      branchId: req.user.role === "admin" ? branchId : req.user.branch_id,
      dateFrom: dateFrom || monthRange?.dateFrom,
      dateTo: dateTo || monthRange?.dateTo,
    });

    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete transactions" });
    }
    const transaction = await transactionModel.deleteTransactionById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    return res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getBranchTransactions,
  getTransactionSummary,
  deleteTransaction,
};
