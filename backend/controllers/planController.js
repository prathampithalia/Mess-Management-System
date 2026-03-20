const Plan = require("../models/Plan");
const Meal = require("../models/Meal");
const { calculateMealsRemaining } = require("../utils/mealUtils");

exports.createPlan = async (req, res) => {

  try {

    const { planType, mealPreference } = req.body;

    let totalMeals = planType.includes("2") ? 60 : 30;

    const startDate = new Date();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const maxExpiryDate = new Date(startDate);
    maxExpiryDate.setDate(maxExpiryDate.getDate() + 45);

    const plan = await Plan.create({
      userId: req.user.id,
      planType,
      mealPreference,
      totalMeals,
      mealsRemaining: totalMeals,
      startDate,
      expiryDate,
      maxExpiryDate
    });

    res.json(plan);

  } catch (err) {

    res.status(500).json(err);

  }
};

exports.getCurrentPlan = async (req, res) => {
    try {
      const plan = await Plan.findOne({ userId: req.user.id }).sort({ _id: -1 });
      if (!plan) return res.status(404).json({ msg: "No active plan found" });

      const meals = await Meal.find({ userId: req.user.id, date: { $gte: plan.startDate } });
      const dynamicRemaining = calculateMealsRemaining(plan, meals);

      const planObj = plan.toObject();
      planObj.mealsRemaining = dynamicRemaining;

      res.json(planObj);
    } catch (err) {
      res.status(500).json(err);
    }
  };