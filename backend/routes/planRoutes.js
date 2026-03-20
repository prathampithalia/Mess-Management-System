const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const { createPlan, getCurrentPlan } = require("../controllers/planController");

router.post("/create", auth, createPlan);
router.get("/current", auth, getCurrentPlan);

module.exports = router;
