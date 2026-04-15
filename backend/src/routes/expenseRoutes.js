const express = require("express");
const { createExpense, getExpenses } = require("../controllers/expenseController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getExpenses);
router.post("/", authorize("admin", "branch_manager", "operator"), createExpense);

module.exports = router;
