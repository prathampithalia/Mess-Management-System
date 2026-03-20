// PATCH /api/admin/users/:userId/delivery-location — update user's delivery location
exports.updateUserDeliveryLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { deliveryLocation } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    user.deliveryLocation = deliveryLocation;
    await user.save();
    res.json({ msg: "Delivery location updated", deliveryLocation });
  } catch (err) {
    res.status(500).json(err);
  }
};
const User = require("../models/User");
const Plan = require("../models/Plan");
const Meal = require("../models/Meal");
const { Parser } = require("json2csv");
const { calculateMealsRemaining } = require("../utils/mealUtils");

const PLAN_LABELS = {
  "2_home": "2 Meals · Home Delivery",
  "2_dine": "2 Meals · Dine In",
  "1_home": "1 Meal · Home Delivery",
  "1_dine": "1 Meal · Dine In",
};

// GET /api/admin/users — all users with their latest plan
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    const result = await Promise.all(
      users.map(async (u) => {
        const plan = await Plan.findOne({ userId: u._id }).sort({ _id: -1 });
        const meals = await Meal.find({ userId: u._id });
        const mealCount = await Meal.countDocuments({ userId: u._id, $or: [{ lunch: "cancelled" }, { dinner: "cancelled" }] });
        
        let planObj = plan ? plan.toObject() : null;
        if (planObj) planObj.mealsRemaining = calculateMealsRemaining(plan, meals);

        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          plan: planObj,
          cancelledMeals: mealCount,
        };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET /api/admin/users/:userId — full detail for one user
exports.getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, "-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    const plan = await Plan.findOne({ userId }).sort({ _id: -1 });
    const meals = await Meal.find({ userId }).sort({ date: 1 });
    let planObj = plan ? plan.toObject() : null;
    if (planObj) planObj.mealsRemaining = calculateMealsRemaining(plan, meals);
    res.json({ user, plan: planObj, meals });
  } catch (err) {
    res.status(500).json(err);
  }
};

// PATCH /api/admin/users/:userId/plan — update user's plan
exports.updateUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType, mealPreference, mealsRemaining, totalMeals } = req.body;
    const plan = await Plan.findOne({ userId }).sort({ _id: -1 });
    if (!plan) return res.status(404).json({ msg: "No plan found for this user" });
    if (planType !== undefined) plan.planType = planType;
    if (mealPreference !== undefined) plan.mealPreference = mealPreference;
    if (totalMeals !== undefined) { plan.totalMeals = totalMeals; }
    await plan.save();
    res.json(plan);
  } catch (err) {
    res.status(500).json(err);
  }
};

// PATCH /api/admin/meals/:mealId — update a specific meal status
exports.updateMealStatus = async (req, res) => {
  try {
    const { mealId } = req.params;
    const { lunch, dinner } = req.body;
    const meal = await Meal.findById(mealId);
    if (!meal) return res.status(404).json({ msg: "Meal not found" });

    const mealDate = new Date(meal.date);
    mealDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const isPast = mealDate < today;

    let balanceChange = 0;

    if (lunch !== undefined && meal.lunch !== lunch) {
        if (isPast) {
            if (meal.lunch === 'cancelled' && lunch !== 'cancelled') balanceChange -= 1;
            else if (meal.lunch !== 'cancelled' && lunch === 'cancelled') balanceChange += 1;
        }
        meal.lunch = lunch;
    }

    if (dinner !== undefined && meal.dinner !== dinner) {
        if (isPast) {
            if (meal.dinner === 'cancelled' && dinner !== 'cancelled') balanceChange -= 1;
            else if (meal.dinner !== 'cancelled' && dinner === 'cancelled') balanceChange += 1;
        }
        meal.dinner = dinner;
    }

    await meal.save();

    if (balanceChange !== 0) {
        const plan = await Plan.findOne({ userId: meal.userId }).sort({ _id: -1 });
        if (plan) {
            if (balanceChange > 0 && plan.maxExpiryDate) { // cancelled a past meal
                const is2Time = plan.planType && plan.planType.includes("2");
                const hoursToAdd = (is2Time ? 12 : 24) * balanceChange;
                const newExpiry = new Date(plan.expiryDate);
                newExpiry.setHours(newExpiry.getHours() + hoursToAdd);
                if (newExpiry <= plan.maxExpiryDate) plan.expiryDate = newExpiry;
                else plan.expiryDate = plan.maxExpiryDate;
                await plan.save();
            }
        }
    }

    res.json(meal);
  } catch (err) {
    res.status(500).json(err);
  }
};

// DELETE /api/admin/users/:userId — delete user + plans + meals
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    await Plan.deleteMany({ userId });
    await Meal.deleteMany({ userId });
    res.json({ msg: "User and all data deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET /api/admin/analytics — aggregate stats
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const plans = await Plan.find().sort({ startDate: 1 });

    // Plan distribution
    const planDist = {};
    plans.forEach((p) => {
      const label = PLAN_LABELS[p.planType] || p.planType || "Unknown";
      planDist[label] = (planDist[label] || 0) + 1;
    });

    // Meal stats
    const meals = await Meal.find();
    let totalCancelled = 0;
    let totalEaten = 0;
    meals.forEach((m) => {
      if (m.lunch === "cancelled") totalCancelled++;
      if (m.dinner === "cancelled") totalCancelled++;
      if (m.lunch === "eaten") totalEaten++;
      if (m.dinner === "eaten") totalEaten++;
    });

    // Build last 12 month labels
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        newUsers: 0,
        renewals: 0,
      });
    }

    // New users per month — use ObjectId embedded timestamp
    const users = await User.find({});
    users.forEach((u) => {
      const ts = u._id.getTimestamp();
      const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.newUsers++;
    });

    // Plan renewals per month — group all plans by userId; 2nd+ plans are renewals
    const plansByUser = {};
    plans.forEach((p) => {
      const uid = p.userId.toString();
      if (!plansByUser[uid]) plansByUser[uid] = [];
      plansByUser[uid].push(p);
    });

    Object.values(plansByUser).forEach((userPlans) => {
      // Sort ascending by creation time, skip first plan (= new user), rest are renewals
      userPlans.slice(1).forEach((p) => {
        const d = p.startDate ? new Date(p.startDate) : p._id.getTimestamp();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) bucket.renewals++;
      });
    });

    res.json({
      totalUsers,
      planDist,
      totalCancelled,
      totalEaten,
      totalPlans: plans.length,
      monthlyStats: months,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// GET /api/admin/export — CSV of all users + plans + meals
exports.exportCSV = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    const rows = [];
    for (const u of users) {
      const plan = await Plan.findOne({ userId: u._id }).sort({ _id: -1 });
      const meals = await Meal.find({ userId: u._id });
      const cancelled = meals.reduce((acc, m) => acc + (m.lunch === "cancelled" ? 1 : 0) + (m.dinner === "cancelled" ? 1 : 0), 0);
      rows.push({
        Name: u.name,
        Email: u.email,
        PlanType: plan?.planType || "None",
        MealPreference: plan?.mealPreference || "-",
        TotalMeals: plan?.totalMeals || 0,
        MealsRemaining: plan ? calculateMealsRemaining(plan, meals) : 0,
        CancelledMeals: cancelled,
        StartDate: plan?.startDate ? new Date(plan.startDate).toISOString().slice(0, 10) : "-",
        ExpiryDate: plan?.expiryDate ? new Date(plan.expiryDate).toISOString().slice(0, 10) : "-",
      });
    }
    if (rows.length === 0) {
      rows.push({ Name: "", Email: "", PlanType: "", MealPreference: "", TotalMeals: 0, MealsRemaining: 0, CancelledMeals: 0, StartDate: "", ExpiryDate: "" });
    }
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header("Content-Type", "text/csv");
    res.attachment("mess_users_export.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json(err);
  }
};
