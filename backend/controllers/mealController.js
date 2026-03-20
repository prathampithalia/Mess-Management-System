const Meal = require("../models/Meal");
const Plan = require("../models/Plan");
const { Parser } = require("json2csv");

exports.cancelMeal = async (req, res) => {
  const { date, type } = req.body;

  // --- Backend Validation for Cancellation Cutoff ---
  const now = new Date();
  const hour = now.getHours();
  // Get strict today string in local timezone
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  if (date < todayStr) {
    return res.status(400).json({ msg: "Cannot cancel meals for past dates." });
  }

  if (date === todayStr) {
    if (type === "lunch" && hour >= 12) {
      return res.status(400).json({ msg: "Lunch cancellation cutoff (12 PM) has passed." });
    }
    if (type === "dinner" && hour >= 17) {
      return res.status(400).json({ msg: "Dinner cancellation cutoff (5 PM) has passed." });
    }
  }
  // --------------------------------------------------

  let meal = await Meal.findOne({
    userId: req.user.id,
    date,
  });

  if (!meal) {
    meal = await Meal.create({
      userId: req.user.id,
      date,
    });
  }

  if (meal[type] !== "cancelled") {
    meal[type] = "cancelled";
    await meal.save();

    // Add back the meal to remaining (capped at totalMeals)
    const currentPlan = await Plan.findOne({ userId: req.user.id }).sort({ _id: -1 });
    if (currentPlan) {
      // Extend expiryDate by 0.5 days (12 hours) if 2-time plan, else 1 day per cancellation
      if (currentPlan.maxExpiryDate) {
        const is2Time = currentPlan.planType && currentPlan.planType.includes("2");
        const hoursToAdd = is2Time ? 12 : 24;

        const newExpiry = new Date(currentPlan.expiryDate);
        newExpiry.setHours(newExpiry.getHours() + hoursToAdd);

        if (newExpiry <= currentPlan.maxExpiryDate) {
          currentPlan.expiryDate = newExpiry;
        } else {
          currentPlan.expiryDate = currentPlan.maxExpiryDate;
        }
      }

      await currentPlan.save();
    }
  }

  res.json(meal);
};

exports.exportMeals = async (req, res) => {
  const meals = await Meal.find({ userId: req.user.id });

  const parser = new Parser();

  const csv = parser.parse(meals);

  res.header("Content-Type", "text/csv");
  res.attachment("meals.csv");

  return res.send(csv);
};

exports.getMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.user.id });
    res.json(meals);
  } catch (err) {
    res.status(500).json(err);
  }
};
