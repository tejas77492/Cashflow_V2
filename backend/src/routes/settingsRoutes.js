const express = require("express");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/", getSettings);
router.put("/", authorize("admin"), updateSettings);

module.exports = router;
