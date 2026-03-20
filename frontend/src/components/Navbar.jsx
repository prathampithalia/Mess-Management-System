import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../stylesheets/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState("U");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Check auth on every route change
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      // Try to extract name from token payload for initials
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const name = payload.name || payload.email || "";
        setUserInitial(name.charAt(0).toUpperCase() || "U");
      } catch {
        setUserInitial("U");
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
    setDropOpen(false);
    navigate("/login");
  };

  // Hide on admin panel — it has its own sidebar
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Mess Manager</Link>

      <div className="navbar-links">
        {/* Dashboard & Calendar only when logged in */}
        {isLoggedIn && (
          <>
            <Link to="/dashboard" className={`navbar-link${pathname === "/dashboard" ? " active" : ""}`}>
              Dashboard
            </Link>
            <Link to="/calendar" className={`navbar-link${pathname === "/calendar" ? " active" : ""}`}>
              Calendar
            </Link>
          </>
        )}

        {/* Profile or Login */}
        {isLoggedIn ? (
          <div className="navbar-profile-wrap" ref={dropRef}>
            <button
              className="navbar-avatar"
              onClick={() => setDropOpen((p) => !p)}
              aria-label="Profile menu"
            >
              {userInitial}
            </button>
            {dropOpen && (
              <div className="navbar-dropdown">
                <Link to="/dashboard" className="navbar-dropdown-item" onClick={() => setDropOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/calendar" className="navbar-dropdown-item" onClick={() => setDropOpen(false)}>
                  Calendar
                </Link>
                <div className="navbar-dropdown-divider" />
                <button className="navbar-dropdown-item logout" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className={`navbar-btn${pathname === "/login" ? " active" : ""}`}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
