const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminMiddleware");
const {
  getAllUsers,
  getUserDetail,
  updateUserPlan,
  updateMealStatus,
  deleteUser,
  getAnalytics,
  exportCSV,
  updateUserDeliveryLocation,
} = require("../controllers/adminController");

router.use(adminAuth);


router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetail);
router.patch("/users/:userId/plan", updateUserPlan);
router.patch("/users/:userId/delivery-location", updateUserDeliveryLocation);
router.patch("/meals/:mealId", updateMealStatus);
router.delete("/users/:userId", deleteUser);
router.get("/analytics", getAnalytics);
router.get("/export", exportCSV);

module.exports = router;
