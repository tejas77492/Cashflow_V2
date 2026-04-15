const express = require("express");
const {
  getDashboardSummary,
  getBranchPerformance,
} = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/summary", getDashboardSummary);
router.get("/branch-performance", authorize("admin"), getBranchPerformance);

module.exports = router;
