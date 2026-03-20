/* eslint-disable no-unused-vars */
import axios from "axios";
import { useState, useEffect } from "react";
import "../stylesheets/PlanSelector.css";

export default function PlanSelector() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [mealPreference, setMealPreference] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [success, setSuccess] = useState("");

  const plans = [
    { id: "2_home", label: "2 Meals + Home Delivery" },
    { id: "2_dine", label: "2 Meals + Dine In" },
    { id: "1_home", label: "1 Meal + Home Delivery" },
    { id: "1_dine", label: "1 Meal + Dine In" },
  ];

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:5000/api/plan/current", {
          headers: { Authorization: token },
        });
        if (res.data) {
          setCurrentPlan(res.data);
        }
      } catch (err) {
        console.error("No active plan found or error fetching plan.");
      }
    };
    fetchCurrentPlan();
  }, []);

  const choosePlan = async () => {
    if (!selectedPlan || !startDate) {
      setSuccess("");
      alert("Please select a plan and start date.");
      return;
    }
    if (selectedPlan.startsWith("1_") && !mealPreference) {
      setSuccess("");
      alert("Please select your meal preference (Lunch or Dinner).");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/plan/create",
        {
          planType: selectedPlan,
          mealPreference: selectedPlan.startsWith("1_") ? mealPreference : undefined,
          startDate,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      setCurrentPlan({
        planType: selectedPlan,
        mealPreference,
        startDate,
        totalMeals: selectedPlan.startsWith("1_") ? 30 : 60,
        mealsRemaining: selectedPlan.startsWith("1_") ? 30 : 60,
      });
      setSuccess("Plan selected successfully!");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to select plan.");
    }
    setLoading(false);
  };

  return (
    <div className="plan-selector-responsive">
      <div className="plan-selector-card">
        <h3 className="plan-selector-title">Select Your Meal Plan</h3>

        <div className="plan-selector-grid">
          {plans.map((plan) => (
            <button
              key={plan.id}
              className={`plan-selector-btn${selectedPlan === plan.id ? " active" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.label}
            </button>
          ))}
        </div>

        {selectedPlan && selectedPlan.startsWith("1_") && (
          <div className="plan-selector-pref-section">
            <label className="plan-selector-label">Meal Preference:</label>
            <div className="plan-selector-pref-row">
              <button
                className={`plan-selector-pref-btn${mealPreference === "lunch" ? " active" : ""}`}
                onClick={() => setMealPreference("lunch")}
              >
                Lunch
              </button>
              <button
                className={`plan-selector-pref-btn${mealPreference === "dinner" ? " active" : ""}`}
                onClick={() => setMealPreference("dinner")}
              >
                Dinner
              </button>
            </div>
          </div>
        )}

        <div className="plan-selector-date-section">
          <label className="plan-selector-label">Start Date:</label>
          <input
            type="date"
            className="plan-selector-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <button
          className="plan-selector-submit-btn"
          onClick={choosePlan}
          disabled={loading}
        >
          {loading ? "Selecting..." : "Select Plan"}
        </button>

        {currentPlan && (
          <div className="plan-selector-current-plan">
            Current Plan: <br />
            <span className="plan-selector-current-plan-type">
              {plans.find(p => p.id === currentPlan.planType)?.label || currentPlan.planType}
            </span><br />
            {currentPlan.planType.startsWith("1_") && currentPlan.mealPreference && (
              <>Preference: <span className="plan-selector-current-plan-pref">{currentPlan.mealPreference}</span><br /></>
            )}
            Start Date: <span className="plan-selector-current-plan-date">{currentPlan.startDate && currentPlan.startDate.substring(0, 10)}</span><br />
            Meals: <span className="plan-selector-current-plan-meals">
              {currentPlan.mealsRemaining !== undefined
                ? currentPlan.mealsRemaining
                : (currentPlan.planType.startsWith("1_") ? 30 : 60)} / {currentPlan.totalMeals || (currentPlan.planType.startsWith("1_") ? 30 : 60)} remaining
            </span>
          </div>
        )}

        {success && (
          <div className="plan-selector-success">{success}</div>
        )}
      </div>
    </div>
  );
}
