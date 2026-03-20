import MealCalendar from "../components/MealCalendar";
import { useState, useEffect } from "react";
import axios from "axios";
import "../stylesheets/Calendar.css";

export default function Calendar() {
  const [lunchData, setLunchData] = useState([]);
  const [dinnerData, setDinnerData] = useState([]);
  const [planType, setPlanType] = useState(null);
  const [mealPreference, setMealPreference] = useState(null);
  const [totalMeals, setTotalMeals] = useState(30);

  const [selectedDate, setSelectedDate] = useState("");
  const [cancelledLunch, setCancelledLunch] = useState(false);
  const [cancelledDinner, setCancelledDinner] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  const now = new Date();
  const hour = now.getHours();

  // Create a strict "today string" in local timezone
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  // Determine if cancel should be disabled based on the currently selected date
  let lunchDisabled = true;
  let dinnerDisabled = true;

  if (selectedDate) {
    if (selectedDate < todayStr) {
      // Past days: cannot cancel
      lunchDisabled = true;
      dinnerDisabled = true;
    } else if (selectedDate === todayStr) {
      // Today: Cutoff is 12 PM for lunch, 5 PM for dinner
      lunchDisabled = hour >= 12;
      dinnerDisabled = hour >= 17;
    } else {
      // Future days: always allowed
      lunchDisabled = false;
      dinnerDisabled = false;
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [planRes, mealRes] = await Promise.all([
        axios.get("http://localhost:5000/api/plan/current", { headers: { Authorization: token } }),
        axios.get("http://localhost:5000/api/meals", { headers: { Authorization: token } })
      ]);
      setPlanType(planRes.data.planType);
      setMealPreference(planRes.data.mealPreference);
      setTotalMeals(planRes.data.totalMeals || (planRes.data.planType?.includes("2") ? 60 : 30));

      const meals = mealRes.data;
      const lData = meals.map(m => ({ date: m.date.slice(0, 10), status: m.lunch }));
      const dData = meals.map(m => ({ date: m.date.slice(0, 10), status: m.dinner }));
      setLunchData(lData);
      setDinnerData(dData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (type) => {
    if (!selectedDate) {
      setCancelMsg("Please select a date to cancel.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/meals/cancel",
        { date: selectedDate, type },
        { headers: { Authorization: token } }
      );

      const updatedMeal = res.data;
      const updatedDate = updatedMeal.date.slice(0, 10);

      if (type === "lunch") {
        setLunchData(prev => [...prev.filter(m => m.date !== updatedDate), { date: updatedDate, status: "cancelled" }]);
        setCancelledLunch(true);
      }
      if (type === "dinner") {
        setDinnerData(prev => [...prev.filter(m => m.date !== updatedDate), { date: updatedDate, status: "cancelled" }]);
        setCancelledDinner(true);
      }
      setCancelMsg("Meal cancelled for " + selectedDate + ".");
    } catch (err) {
      setCancelMsg("Failed to cancel meal.");
    }
  };

  const is2Time = planType && planType.includes("2");

  return (
    <div className="calendar-page">
      <div className="calendar-container">

        {/* Header */}
        <div className="calendar-header">
          <h2 className="calendar-title">Meal Calendar</h2>
          <p className="calendar-subtitle">
            {planType
              ? (is2Time
                ? "Lunch + Dinner Plan"
                : `1 Meal Plan — ${mealPreference ? mealPreference.charAt(0).toUpperCase() + mealPreference.slice(1) : ""}`)
              : "Loading plan..."}
          </p>
        </div>

        {/* Cancel section */}
        {planType && (
          <div className="calendar-cancel-section">
            <div className="calendar-section-label">Cancel a Meal</div>
            <input
              type="date"
              className="calendar-date-input"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCancelledLunch(false);
                setCancelledDinner(false);
                setCancelMsg("");
              }}
            />
            <div className="calendar-btn-row">
              {(is2Time || mealPreference === "lunch") && (
                <button
                  className="calendar-cancel-btn lunch"
                  onClick={() => handleCancel("lunch")}
                  disabled={lunchDisabled || cancelledLunch}
                >
                  Cancel Lunch
                </button>
              )}
              {(is2Time || mealPreference === "dinner") && (
                <button
                  className="calendar-cancel-btn dinner"
                  onClick={() => handleCancel("dinner")}
                  disabled={dinnerDisabled || cancelledDinner}
                >
                  Cancel Dinner
                </button>
              )}
            </div>
            {cancelMsg && <p className="calendar-cancel-msg">{cancelMsg}</p>}
            <p className="calendar-cutoff-note">
              Lunch cancellation closes at 12 PM · Dinner at 5 PM
            </p>
          </div>
        )}

        {/* Calendar(s) */}
        {!planType ? (
          <p className="calendar-loading">Loading plan...</p>
        ) : is2Time ? (
          <>
            <div className="calendar-meal-section">
              <div className="calendar-meal-label">Lunch</div>
              <div className="calendar-meal-box">
                <MealCalendar data={lunchData} totalMeals={totalMeals / 2} />
              </div>
            </div>
            <div className="calendar-meal-section">
              <div className="calendar-meal-label">Dinner</div>
              <div className="calendar-meal-box">
                <MealCalendar data={dinnerData} totalMeals={totalMeals / 2} />
              </div>
            </div>
          </>
        ) : (
          <div className="calendar-meal-section">
            <div className="calendar-meal-label">
              {mealPreference === "lunch" ? "Lunch" : "Dinner"}
            </div>
            <div className="calendar-meal-box">
              <MealCalendar data={mealPreference === "lunch" ? lunchData : dinnerData} totalMeals={totalMeals} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
