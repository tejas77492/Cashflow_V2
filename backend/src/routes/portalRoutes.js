const express = require("express");
const {
  getPortals,
  createPortal,
  updatePortal,
  deletePortal,
} = require("../controllers/portalController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getPortals);
router.post("/", authorize("admin"), createPortal);
router.put("/:id", authorize("admin"), updatePortal);
router.delete("/:id", authorize("admin"), deletePortal);

module.exports = router;
