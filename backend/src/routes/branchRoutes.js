const express = require("express");
const {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} = require("../controllers/branchController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate, authorize("admin"));
router.get("/", getBranches);
router.post("/", createBranch);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);

module.exports = router;
