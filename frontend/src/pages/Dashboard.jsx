import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../stylesheets/Dashboard.css";

const PLANS = [
  { id: "2_home", label: "2 Meals · Home Delivery", meals: 60 },
  { id: "2_dine", label: "2 Meals · Dine In", meals: 60 },
  { id: "1_home", label: "1 Meal · Home Delivery", meals: 30 },
  { id: "1_dine", label: "1 Meal · Dine In", meals: 30 },
];

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

export default function Dashboard() {
  const [view, setView] = useState("loading"); // "loading" | "active" | "select"
  const [currentPlan, setCurrentPlan] = useState(null);

  // Selection state
  const [selectedPlan, setSelectedPlan] = useState("");
  const [mealPreference, setMealPreference] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setView("select"); return; }
        const res = await axios.get("http://localhost:5000/api/plan/current", {
          headers: { Authorization: token },
        });
        if (res.data && res.data.planType) {
          setCurrentPlan(res.data);
          setView("active");
        } else {
          setView("select");
        }
      } catch {
        setView("select");
      }
    };
    fetchPlan();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!selectedPlan) return setError("Please choose a plan.");
    if (!startDate) return setError("Please pick a start date.");
    if (selectedPlan.startsWith("1_") && !mealPreference) return setError("Choose Lunch or Dinner.");
    if ((selectedPlan.endsWith("home")) && !deliveryLocation) return setError("Please enter delivery location.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // Save plan
      const res = await axios.post(
        "http://localhost:5000/api/plan/create",
        {
          planType: selectedPlan,
          mealPreference: selectedPlan.startsWith("1_") ? mealPreference : undefined,
          startDate,
        },
        { headers: { Authorization: token } }
      );
      setCurrentPlan(res.data);
      setView("active");

      // Get userId (assume it's in localStorage or returned from plan API)
      let userId = localStorage.getItem("userId");
      if (!userId && res.data.userId) userId = res.data.userId;
      // If not found, try to fetch from /api/admin/users/me or similar if available

      // Set delivery location
      let locationToSet = "";
      if (selectedPlan.endsWith("dine")) {
        locationToSet = "Dine in";
      } else if (selectedPlan.endsWith("home")) {
        locationToSet = deliveryLocation;
      }
      if (userId && locationToSet) {
        await axios.patch(
          `http://localhost:5000/api/admin/users/${userId}/delivery-location`,
          { deliveryLocation: locationToSet },
          { headers: { Authorization: token } }
        );
      }
    } catch {
      setError("Failed to save plan. Please try again.");
    }
    setSubmitting(false);
  };

  const planMeta = PLANS.find(p => p.id === currentPlan?.planType);
  const expiryStr = currentPlan?.expiryDate
    ? new Date(currentPlan.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>

        {/* Loading */}
        {view === "loading" && (
          <p className="dashboard-muted">Loading your plan…</p>
        )}

        {/* Active plan view */}
        {view === "active" && currentPlan && (
          <>
            <div className="dashboard-card">
              <div className="dashboard-card-label">Current Plan</div>
              <div className="dashboard-plan-name">{planMeta?.label || currentPlan.planType}</div>

              {currentPlan.mealPreference && (
                <div className="dashboard-badge">{cap(currentPlan.mealPreference)}</div>
              )}

              <div className="dashboard-meta-grid">
                <div className="dashboard-meta-item">
                  <span className="dashboard-meta-label">Meals left</span>
                  <span className="dashboard-meta-val">
                    {Math.min(currentPlan.mealsRemaining ?? currentPlan.totalMeals ?? planMeta?.meals, currentPlan.totalMeals ?? planMeta?.meals)}
                    <span className="dashboard-meta-of"> / {currentPlan.totalMeals ?? planMeta?.meals}</span>
                  </span>
                </div>
                {expiryStr && (
                  <div className="dashboard-meta-item">
                    <span className="dashboard-meta-label">Expires</span>
                    <span className="dashboard-meta-val">{expiryStr}</span>
                  </div>
                )}
                {currentPlan?.maxExpiryDate && (
                  <div className="dashboard-meta-item">
                    <span className="dashboard-meta-label">Max extension</span>
                    <span className="dashboard-meta-val">
                      {new Date(currentPlan.maxExpiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {(() => {
                const total = currentPlan.totalMeals ?? planMeta?.meals ?? 30;
                const remaining = currentPlan.mealsRemaining ?? total;
                const pct = Math.round((remaining / total) * 100);
                return (
                  <div className="dashboard-progress-wrap">
                    <div className="dashboard-progress-bar" style={{ width: pct + "%" }} />
                  </div>
                );
              })()}
            </div>

            <div className="dashboard-actions">
              <Link to="/calendar" className="dashboard-primary-btn">View Meal Calendar →</Link>
            </div>
          </>
        )}

        {/* Plan selection view */}
        {view === "select" && (
          <>
            <div className="dashboard-card">
              <div className="dashboard-card-label">Choose a Plan</div>

              <div className="dashboard-plan-grid">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    className={`dashboard-plan-btn${selectedPlan === p.id ? " active" : ""}`}
                    onClick={() => { setSelectedPlan(p.id); setMealPreference(""); }}
                  >
                    <span className="dashboard-plan-btn-label">{p.label}</span>
                    <span className="dashboard-plan-btn-meals">{p.meals} meals</span>
                  </button>
                ))}
              </div>

              {/* Lunch / Dinner choice for 1-meal plans */}
              {selectedPlan.startsWith("1_") && (
                <div className="dashboard-pref-section">
                  <div className="dashboard-sub-label">Meal Preference</div>
                  <div className="dashboard-pref-row">
                    {["lunch", "dinner"].map(pref => (
                      <button
                        key={pref}
                        className={`dashboard-pref-btn${mealPreference === pref ? " active" : ""}`}
                        onClick={() => setMealPreference(pref)}
                      >
                        {cap(pref)}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* Delivery location for Home Delivery */}
              {(selectedPlan.endsWith("home")) && (
                <div className="dashboard-date-section">
                  <div className="dashboard-sub-label">Delivery Location</div>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={e => setDeliveryLocation(e.target.value)}
                    className="dashboard-date-input"
                    placeholder="Enter delivery address"
                  />
                </div>
              )}

              {/* Start date */}
              <div className="dashboard-date-section">
                <div className="dashboard-sub-label">Start Date</div>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="dashboard-date-input"
                />
              </div>

              {error && <p className="dashboard-err-text">{error}</p>}

              <button
                className="dashboard-primary-btn dashboard-confirm-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Confirm Plan"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
