import { useEffect, useState } from "react";
import "../stylesheets/MealCalendar.css";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function toLocal(dateStr) {
  return new Date(dateStr + "T00:00:00");
}

export default function MealCalendar({ data = [], totalMeals = 30 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 30-day window starting from earliest data date or today
  const startDate = data.length > 0 ? toLocal(data[0].date) : new Date(today);

  function buildMeals(sourceData) {
    const meals = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ds = fmt(d);
      const found = sourceData.find((x) => x.date === ds);
      // Only cancelled status matters; everything else is green (active)
      const status = found?.status === "cancelled" ? "cancelled" : "active";
      meals.push({ date: ds, status });
    }
    return meals;
  }

  const [meals, setMeals] = useState(() => buildMeals(data));

  useEffect(() => {
    setMeals(buildMeals(data));
  }, [data]);

  const cancelled = meals.filter((m) => m.status === "cancelled").length;
  const active = meals.filter((m) => m.status === "active").length;

  const firstDayOffset = toLocal(meals[0]?.date || fmt(startDate)).getDay();

  return (
    <div className="meal-calendar-wrap">
      {/* Stats row */}
      <div className="meal-calendar-stats">
        <div className="meal-calendar-stat-item">
          <span className="meal-calendar-dot" style={{ background: "#22c55e" }} />
          <span className="meal-calendar-stat-label">Active</span>
          <strong style={{ color: "#22c55e" }}>{active}</strong>
        </div>
        <div className="meal-calendar-stat-item">
          <span className="meal-calendar-dot" style={{ background: "#ef4444" }} />
          <span className="meal-calendar-stat-label">Cancelled</span>
          <strong style={{ color: "#ef4444" }}>{cancelled}</strong>
        </div>
        <div className="meal-calendar-stat-item">
          <span className="meal-calendar-stat-label">Total</span>
          <strong style={{ color: "#333" }}>{totalMeals}</strong>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="meal-calendar-grid">
        {DAY_LABELS.map((d) => (
          <div key={d} className="meal-calendar-day-label">{d}</div>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={"blank-" + i} />
        ))}
        {meals.map((m) => {
          const dt = toLocal(m.date);
          const isToday = m.date === fmt(today);
          const isFuture = dt > today;
          const bg =
            m.status === "cancelled"
              ? "#ef4444"
              : isFuture
              ? "#dcfce7"
              : "#22c55e";
          const color =
            m.status === "cancelled"
              ? "#fff"
              : isFuture
              ? "#16a34a"
              : "#fff";

          return (
            <div
              key={m.date}
              title={dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " — " + (m.status === "cancelled" ? "Cancelled" : "Active")}
              className="meal-calendar-cell"
              style={{
                background: bg,
                color,
                outline: isToday ? "2px solid #f59e0b" : "none",
                outlineOffset: 2,
              }}
            >
              {dt.getDate()}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="meal-calendar-legend">
        <div className="meal-calendar-legend-item">
          <span className="meal-calendar-dot" style={{ background: "#22c55e" }} /> Active
        </div>
        <div className="meal-calendar-legend-item">
          <span className="meal-calendar-dot" style={{ background: "#dcfce7", border: "1px solid #86efac" }} /> Upcoming
        </div>
        <div className="meal-calendar-legend-item">
          <span className="meal-calendar-dot" style={{ background: "#ef4444" }} /> Cancelled
        </div>
      </div>
    </div>
  );
}