import { useState } from "react";
import axios from "axios";
import "../stylesheets/Login.css";

export default function Login() {
  const [tab, setTab] = useState("login"); // "login" | "register"

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [regMsg, setRegMsg] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    setLoginErr("");
    if (!email || !password) return setLoginErr("Please fill in all fields.");
    setLoginLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      if (res.data.isAdmin) {
        localStorage.setItem("adminToken", res.data.token);
        window.location.href = "/admin";
      } else {
        localStorage.setItem("token", res.data.token);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setLoginErr(
        err.response?.data?.msg || "Login failed. Check your credentials."
      );
    }
    setLoginLoading(false);
  };

  const handleRegister = async () => {
    setRegMsg("");
    if (!rName || !rEmail || !rPassword)
      return setRegMsg("Please fill in all fields.");
    setRegLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name: rName,
        email: rEmail,
        password: rPassword,
      });
      setRegMsg("Account created! You can now log in.");
      setRName("");
      setREmail("");
      setRPassword("");
      setTimeout(() => setTab("login"), 1500);
    } catch (err) {
      setRegMsg(err.response?.data?.msg || "Registration failed.");
    }
    setRegLoading(false);
  };

  const handleKey = (fn) => (e) => {
    if (e.key === "Enter") fn();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* App name */}
        <div className="login-app-name">Mess Manager</div>
        <h1 className="login-heading">
          {tab === "login" ? "Sign in" : "Create account"}
        </h1>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab${tab === "login" ? " active" : ""}`}
            onClick={() => {
              setTab("login");
              setLoginErr("");
            }}
          >
            Login
          </button>
          <button
            className={`login-tab${tab === "register" ? " active" : ""}`}
            onClick={() => {
              setTab("register");
              setRegMsg("");
            }}
          >
            Register
          </button>
        </div>

        {/* Login form */}
        {tab === "login" && (
          <div className="login-form">
            <input
              className="login-input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey(handleLogin)}
              autoComplete="email"
            />
            <input
              className="login-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey(handleLogin)}
              autoComplete="current-password"
            />
            {loginErr && <p className="login-err">{loginErr}</p>}
            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        )}

        {/* Register form */}
        {tab === "register" && (
          <div className="login-form">
            <input
              className="login-input"
              placeholder="Full Name"
              value={rName}
              onChange={(e) => setRName(e.target.value)}
              autoComplete="name"
            />
            <input
              className="login-input"
              placeholder="Email"
              type="email"
              value={rEmail}
              onChange={(e) => setREmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="login-input"
              placeholder="Password"
              type="password"
              value={rPassword}
              onChange={(e) => setRPassword(e.target.value)}
              onKeyDown={handleKey(handleRegister)}
              autoComplete="new-password"
            />
            {regMsg && (
              <p
                className={`login-err${
                  regMsg.includes("created") ? " success" : ""
                }`}
              >
                {regMsg}
              </p>
            )}
            <button
              className="login-btn"
              onClick={handleRegister}
              disabled={regLoading}
            >
              {regLoading ? "Creating…" : "Create account"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
