const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    type: { type: String, enum: ["cc", "bill"], required: true },
    portal_id: { type: mongoose.Schema.Types.ObjectId, ref: "Portal", required: true },
    customer_name: { type: String },
    card_ending: { type: String, maxlength: 4 },
    card_type: { type: String },
    account_ending: { type: String, maxlength: 4 },
    bank_name: { type: String },
    bank_account_charges: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    customer_charge: { type: Number, required: true },
    discount: { type: Number, required: true, default: 0 },
    portal_cost: { type: Number, required: true },
    profit: { type: Number, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

const mapTransaction = (t) => {
  if (!t) return t;
  return {
    ...t,
    id: t._id,
    branch_name: t.branch_id && t.branch_id.name ? t.branch_id.name : null,
    branch_id: t.branch_id ? t.branch_id._id || t.branch_id : null,
    portal_name: t.portal_id && t.portal_id.name ? t.portal_id.name : null,
    portal_id: t.portal_id ? t.portal_id._id || t.portal_id : null,
    created_by_name: t.created_by && t.created_by.name ? t.created_by.name : null,
    created_by: t.created_by ? t.created_by._id || t.created_by : null,
  };
};

const buildTransactionFilters = ({ branchId, dateFrom, dateTo, type }) => {
  const filter = {};
  if (branchId) filter.branch_id = branchId;
  if (type) filter.type = type;
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);
  }
  return filter;
};

const createTransaction = async (data) => {
  const transaction = await Transaction.create(data);
  return getTransactionById(transaction._id);
};

const getTransactionById = async (id) => {
  const transaction = await Transaction.findById(id)
    .populate("branch_id", "name")
    .populate("portal_id", "name")
    .populate("created_by", "name")
    .lean();
  return mapTransaction(transaction);
};

const deleteTransactionById = async (id) => {
  const transaction = await Transaction.findByIdAndDelete(id);
  return transaction;
};

const getTransactions = async (params = {}) => {
  const filter = buildTransactionFilters(params);
  const transactions = await Transaction.find(filter)
    .populate("branch_id", "name")
    .populate("portal_id", "name")
    .populate("created_by", "name")
    .sort({ date: -1, _id: -1 })
    .lean();
  return transactions.map(mapTransaction);
};

const getTransactionSummary = async (params = {}) => {
  const filter = buildTransactionFilters(params);
  const transactions = await Transaction.find(filter).lean();

  let transaction_count = transactions.length;
  let total_transaction_amount = 0;
  let total_bill_amount = 0;
  let total_cc_amount = 0;
  let total_customer_charge = 0;
  let total_discount_amount = 0;
  let total_portal_cost = 0;
  let total_profit_amount = 0;
  let total_bank_account_charges = 0;

  transactions.forEach((t) => {
    total_transaction_amount += t.amount;
    if (t.type === "bill") total_bill_amount += t.amount;
    if (t.type === "cc") total_cc_amount += t.amount;
    total_customer_charge += t.customer_charge;
    total_discount_amount += t.discount;
    total_portal_cost += t.portal_cost;
    total_profit_amount += t.profit;
    total_bank_account_charges += (t.bank_account_charges || 0);
  });

  return {
    transaction_count,
    total_transaction_amount,
    total_bill_amount,
    total_cc_amount,
    total_customer_charge,
    total_discount_amount,
    total_portal_cost,
    total_profit_amount,
    total_bank_account_charges,
  };
};

module.exports = {
  Transaction,
  createTransaction,
  getTransactions,
  getTransactionSummary,
  getTransactionById,
  deleteTransactionById,
};
