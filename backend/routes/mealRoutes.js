const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const { cancelMeal, exportMeals, getMeals } = require("../controllers/mealController");

router.post("/cancel", auth, cancelMeal);

router.get("/export", auth, exportMeals);

router.get("/", auth, getMeals);

module.exports = router;
