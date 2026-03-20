import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../stylesheets/Admin.css";

const API = "http://localhost:5000/api/admin";
const PLAN_LABELS = {
  "2_home": "2 Meals · Home Delivery",
  "2_dine": "2 Meals · Dine In",
  "1_home": "1 Meal · Home Delivery",
  "1_dine": "1 Meal · Dine In",
};
const PLAN_IDS = ["2_home", "2_dine", "1_home", "1_dine"];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"; }

function getToken() { return localStorage.getItem("adminToken"); }
function authHeader() { return { Authorization: getToken() }; }

export default function Admin() {
  const [tab, setTab] = useState("users"); // "users" | "analytics"
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // { user, plan, meals }
  const [detailLoading, setDetailLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");

  // Guard — redirect if not admin
  useEffect(() => {
    if (!getToken()) window.location.href = "/login";
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, { headers: authHeader() });
      setUsers(res.data);
    } catch { window.location.href = "/login"; }
    setLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/analytics`, { headers: authHeader() });
      setAnalytics(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (tab === "analytics") fetchAnalytics(); }, [tab, fetchAnalytics]);

  const openUser = async (userId) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await axios.get(`${API}/users/${userId}`, { headers: authHeader() });
      setSelectedUser(res.data);
    } catch {}
    setDetailLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };

  // --- Admin actions ---
  const handlePlanChange = async (userId, field, value) => {
    try {
      await axios.patch(`${API}/users/${userId}/plan`, { [field]: value }, { headers: authHeader() });
      flash("Plan updated.");
      openUser(userId);
      fetchUsers();
    } catch { flash("Failed to update plan."); }
  };

  const handleMealStatus = async (mealId, field, value, userId) => {
    try {
      await axios.patch(`${API}/meals/${mealId}`, { [field]: value }, { headers: authHeader() });
      flash("Meal updated.");
      openUser(userId);
    } catch { flash("Failed to update meal."); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their data? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/users/${userId}`, { headers: authHeader() });
      flash("User deleted.");
      setSelectedUser(null);
      fetchUsers();
    } catch { flash("Failed to delete user."); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/export`, { headers: authHeader(), responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      const curDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }).replace(/ /g, "_");
      a.href = url; 
      a.download = `mess_users_export_${curDate}.csv`; a.click();
    } catch { flash("Export failed."); }
    setExporting(false);
  };

  return (
    <div className="admin-page">
      {/* Top Navbar */}
      <nav className="admin-navbar">
        <div className="admin-navbar-left">
          <span className="admin-navbar-title">Admin Panel</span>
          <div className="admin-nav">
            <button
              className={`admin-nav-btn${tab === "users" ? " active" : ""}`}
              onClick={() => setTab("users")}
            >
              Users
            </button>
            <button
              className={`admin-nav-btn${tab === "analytics" ? " active" : ""}`}
              onClick={() => setTab("analytics")}
            >
              Analytics
            </button>
          </div>
        </div>
        <div className="admin-navbar-right">
          <button className="admin-export-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <button
            className="admin-logout-btn"
            onClick={() => { localStorage.removeItem("adminToken"); window.location.href = "/login"; }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="admin-main">
        {msg && <div className="admin-toast">{msg}</div>}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="admin-two-col">
            {/* User list */}
            <div className="admin-list-pane">
              <div className="admin-pane-header">
                <span className="admin-pane-title">All Users</span>
                <span className="admin-sub-text">{users.length} registered</span>
              </div>
              {loading ? <p className="admin-muted">Loading…</p> : (
                users.length === 0 ? <p className="admin-muted">No users found.</p> :
                users.map(u => (
                  <div
                    key={u._id}
                    className={`admin-user-row${selectedUser?.user?._id === u._id ? " active" : ""}`}
                    onClick={() => openUser(u._id)}
                  >
                    <div>
                      <div className="admin-user-name">{u.name || "—"}</div>
                      <div className="admin-user-email">{u.email}</div>
                    </div>
                    <div className="admin-text-right">
                      <div className="admin-plan-chip">{u.plan ? PLAN_LABELS[u.plan.planType] || u.plan.planType : "No plan"}</div>
                      {u.plan && (
                        <div className="admin-meals-left">{u.plan.mealsRemaining ?? u.plan.totalMeals}/{u.plan.totalMeals} meals</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail pane */}
            <div className="admin-detail-pane">
              {detailLoading && <p className="admin-muted">Loading…</p>}
              {!detailLoading && !selectedUser && (
                <div className="admin-empty-detail">
                  <div className="admin-empty-icon">👤</div>
                  <p className="admin-muted">Select a user to view details</p>
                </div>
              )}
              {!detailLoading && selectedUser && (
                <UserDetail
                  data={selectedUser}
                  onPlanChange={handlePlanChange}
                  onMealChange={handleMealStatus}
                  onDelete={handleDeleteUser}
                />
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          <div className="admin-analytics-wrap">
            <div className="admin-pane-header">
              <span className="admin-pane-title">Analytics</span>
            </div>
            {!analytics ? <p className="admin-muted">Loading…</p> : <AnalyticsView data={analytics} />}
          </div>
        )}
      </main>
    </div>
  );
}

// --- User Detail Component ---
function UserDetail({ data, onPlanChange, onMealChange, onDelete }) {
  const { user, plan, meals } = data;
  const [editPlan, setEditPlan] = useState(false);
  const [newPlanType, setNewPlanType] = useState(plan?.planType || "");
  const [newPref, setNewPref] = useState(plan?.mealPreference || "");

  const cancelledMeals = meals.filter(m => m.lunch === "cancelled" || m.dinner === "cancelled");

  return (
    <div>
      {/* User header */}
      <div className="admin-detail-header">
        <div>
          <div className="admin-detail-name">{user.name || "—"}</div>
          <div className="admin-detail-email">{user.email}</div>
        </div>
        <button className="admin-delete-btn" onClick={() => onDelete(user._id)}>Delete account</button>
      </div>

      {/* Plan card */}
      <div className="admin-section">
        <div className="admin-section-label">Plan</div>
        {!plan ? (
          <p className="admin-muted">No plan selected.</p>
        ) : !editPlan ? (
          <div className="admin-plan-card">
            <div className="admin-plan-card-row">
              <span className="admin-plan-card-label">Type</span>
              <span>{PLAN_LABELS[plan.planType] || plan.planType}</span>
            </div>
            {plan.mealPreference && (
              <div className="admin-plan-card-row">
                <span className="admin-plan-card-label">Preference</span>
                <span>{cap(plan.mealPreference)}</span>
              </div>
            )}
            <div className="admin-plan-card-row">
              <span className="admin-plan-card-label">Meals left</span>
              <span className="admin-meals-remaining">{Math.min(plan.mealsRemaining, plan.totalMeals)} / {plan.totalMeals}</span>
            </div>
            <div className="admin-plan-card-row">
              <span className="admin-plan-card-label">Plan Buy Date</span>
              <span>{fmtDate(plan.startDate)}</span>
            </div>
            <div className="admin-plan-card-row">
              <span className="admin-plan-card-label">Expires</span>
              <span>{fmtDate(plan.expiryDate)}</span>
            </div>
            {plan.maxExpiryDate && (
              <div className="admin-plan-card-row">
                <span className="admin-plan-card-label">Max Extension</span>
                <span>{fmtDate(plan.maxExpiryDate)}</span>
              </div>
            )}
            <button className="admin-edit-btn" onClick={() => setEditPlan(true)}>Edit plan</button>
          </div>
        ) : (
          <div className="admin-plan-card">
            <div className="admin-section-label">Plan Type</div>
            <select className="admin-select" value={newPlanType} onChange={e => setNewPlanType(e.target.value)}>
              {PLAN_IDS.map(id => <option key={id} value={id}>{PLAN_LABELS[id]}</option>)}
            </select>
            {newPlanType.startsWith("1_") && (
              <>
                <div className="admin-pref-label">Meal Preference</div>
                <div className="admin-pref-row">
                  {["lunch", "dinner"].map(p => (
                    <button
                      key={p}
                      className={`admin-pref-toggle${newPref === p ? " active" : ""}`}
                      onClick={() => setNewPref(p)}
                    >
                      {cap(p)}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="admin-btn-row">
              <button
                className="admin-save-btn"
                onClick={() => {
                  onPlanChange(user._id, "planType", newPlanType);
                  if (newPlanType.startsWith("1_")) onPlanChange(user._id, "mealPreference", newPref);
                  setEditPlan(false);
                }}
              >
                Save
              </button>
              <button className="admin-cancel-btn" onClick={() => setEditPlan(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Meals with cancelled status */}
      <div className="admin-section">
        <div className="admin-section-label">Cancelled Meals ({cancelledMeals.length})</div>
        {cancelledMeals.length === 0 ? <p className="admin-muted">No cancelled meals.</p> : (
          <div className="admin-flex-col-gap">
            {cancelledMeals.map(m => (
              <div key={m._id} className="admin-meal-row">
                <span className="admin-meal-date">{new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                {m.lunch === "cancelled" && (
                  <div className="admin-meal-item">
                    <span className="admin-meal-chip-red">Lunch · Cancelled</span>
                    <button className="admin-fix-btn" onClick={() => onMealChange(m._id, "lunch", "eaten", user._id)}>Mark Eaten</button>
                  </div>
                )}
                {m.dinner === "cancelled" && (
                  <div className="admin-meal-item">
                    <span className="admin-meal-chip-red">Dinner · Cancelled</span>
                    <button className="admin-fix-btn" onClick={() => onMealChange(m._id, "dinner", "eaten", user._id)}>Mark Eaten</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All meals quick view */}
      <div className="admin-section">
        <div className="admin-section-label">All Meal Records ({meals.length})</div>
        {meals.length === 0 ? <p className="admin-muted">No meal records yet.</p> : (
          <div className="admin-overflow-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Date</th>
                  <th className="admin-th">Lunch</th>
                  <th className="admin-th">Dinner</th>
                  <th className="admin-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {meals.map(m => (
                  <tr key={m._id} className="admin-tr">
                    <td className="admin-td">{new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className={`admin-td lunch-${m.lunch}`}>{cap(m.lunch)}</td>
                    <td className={`admin-td dinner-${m.dinner}`}>{cap(m.dinner)}</td>
                    <td className="admin-td">
                      <div className="admin-action-btns">
                        {m.lunch !== "eaten" && <button className="admin-tiny-btn" onClick={() => onMealChange(m._id, "lunch", "eaten", user._id)}>L→Eaten</button>}
                        {m.dinner !== "eaten" && <button className="admin-tiny-btn" onClick={() => onMealChange(m._id, "dinner", "eaten", user._id)}>D→Eaten</button>}
                        {m.lunch !== "cancelled" && <button className="admin-tiny-btn cancel" onClick={() => onMealChange(m._id, "lunch", "cancelled", user._id)}>L→Cancel</button>}
                        {m.dinner !== "cancelled" && <button className="admin-tiny-btn cancel" onClick={() => onMealChange(m._id, "dinner", "cancelled", user._id)}>D→Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Analytics Component ---
function AnalyticsView({ data }) {
  const { totalUsers, planDist, totalCancelled, totalEaten, totalPlans, monthlyStats = [] } = data;
  const maxPlan = Math.max(...Object.values(planDist), 1);
  const maxMonthly = Math.max(...monthlyStats.map(m => Math.max(m.newUsers, m.renewals)), 1);

  const statCards = [
    { label: "Total Users", val: totalUsers, cls: "total" },
    { label: "Active Plans", val: totalPlans, cls: "plans" },
    { label: "Meals Eaten", val: totalEaten, cls: "eaten" },
    { label: "Meals Cancelled", val: totalCancelled, cls: "cancelled" },
  ];

  return (
    <div>
      {/* Summary stats */}
      <div className="admin-stats-row">
        {statCards.map(({ label, val, cls }) => (
          <div key={label} className="admin-stat-card">
            <div className="admin-stat-label">{label}</div>
            <div className={`admin-stat-val ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Monthly Users Chart */}
      <div className="admin-section" style={{ marginTop: "1.5rem" }}>
        <div className="admin-section-label">Monthly Activity (last 12 months)</div>
        <div className="admin-chart-wrap">
          {monthlyStats.map((m) => {
            const newH = Math.max(2, Math.round((m.newUsers / maxMonthly) * 100));
            const renH = Math.max(2, Math.round((m.renewals / maxMonthly) * 100));
            return (
              <div key={m.key} className="admin-chart-col">
                <div className="admin-chart-bars">
                  <div
                    title={`New users: ${m.newUsers}`}
                    className="admin-chart-bar-new"
                    style={{ height: newH }}
                  />
                  <div
                    title={`Renewals: ${m.renewals}`}
                    className="admin-chart-bar-renewal"
                    style={{ height: renH }}
                  />
                </div>
                <div className="admin-chart-month-label">{m.label}</div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="admin-chart-legend">
          <div className="admin-legend-item">
            <div className="admin-legend-dot new" /> New Users
          </div>
          <div className="admin-legend-item">
            <div className="admin-legend-dot renewal" /> Plan Renewals
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="admin-section" style={{ marginTop: "0.75rem" }}>
        <div className="admin-section-label">Breakdown</div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-th">Month</th>
                <th className="admin-th">New Users</th>
                <th className="admin-th">Renewals</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyStats].reverse().map(m => (
                <tr key={m.key} className="admin-tr">
                  <td className="admin-td">{m.label}</td>
                  <td className="admin-td" style={{ fontWeight: 600, color: m.newUsers > 0 ? "#111" : "#ccc" }}>{m.newUsers}</td>
                  <td className="admin-td" style={{ fontWeight: 600, color: m.renewals > 0 ? "#22c55e" : "#ccc" }}>{m.renewals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="admin-section" style={{ marginTop: "0.75rem" }}>
        <div className="admin-section-label">Plan Distribution</div>
        {Object.entries(planDist).length === 0 ? <p className="admin-muted">No plans yet.</p> : (
          Object.entries(planDist).map(([label, count]) => (
            <div key={label} className="admin-plan-dist-row">
              <div className="admin-plan-dist-header">
                <span>{label}</span>
                <span className="admin-plan-dist-count">{count}</span>
              </div>
              <div className="admin-progress-track">
                <div
                  className="admin-progress-fill"
                  style={{ width: `${(count / maxPlan) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
