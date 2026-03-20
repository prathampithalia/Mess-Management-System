import { Link } from "react-router-dom";
import "../stylesheets/Home.css";

export default function Home() {
  return (
    <div className="home-page">

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1 className="home-hero-title">Simple, smart<br />meal tracking.</h1>
          <p className="home-hero-sub">
            Track your meals, manage your plan, and never miss a cancellation deadline.
          </p>
          <div className="home-hero-actions">
            <Link to="/login" className="home-cta-primary">Get Started</Link>
            <Link to="/dashboard" className="home-cta-ghost">View Dashboard →</Link>
          </div>
        </div>
      </section>

      {/* Plans section */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-section-label">Plans</p>
          <h2 className="home-section-title">Choose what works for you</h2>
          
          <p className="home-section-desc">
            More information about available meal plans coming soon.
          </p>
          <div className="home-cards">
            {[
              { name: "2 Meals · Home Delivery", tag: "Popular", desc: "Lunch + Dinner delivered to your door. 60 meals per month." },
              { name: "2 Meals · Dine In",        tag: "",        desc: "Lunch + Dinner at the mess hall. 60 meals per month." },
              { name: "1 Meal · Home Delivery",   tag: "",        desc: "Choose Lunch or Dinner, delivered. 30 meals per month." },
              { name: "1 Meal · Dine In",         tag: "",        desc: "One meal of your choice at the mess hall. 30 meals per month." },
            ].map((plan) => (
              <div key={plan.name} className="home-card">
                <div className="home-card-top">
                  <span className="home-card-name">{plan.name}</span>
                  {plan.tag && <span className="home-card-tag">{plan.tag}</span>}
                </div>
                <p className="home-card-desc">{plan.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meals section */}
      <section className="home-section home-section-alt">
        <div className="home-section-inner">
          <p className="home-section-label">Menu</p>
          <h2 className="home-section-title">What's on the menu</h2>
          <p className="home-section-desc">
            Every meal is served as a wholesome Thali. Dine-in guests also get a daily Special.
          </p>

          <div className="menu-grid">

            {/* ── Thali card ── */}
            <div className="menu-card menu-card-thali">
              <div className="menu-card-stripe" />
              <div className="menu-card-body">
                <div className="menu-card-hdr">
                  <div>
                    <h3 className="menu-card-title">Thali</h3>
                    <p className="menu-card-subtitle">Lunch &amp; Dinner</p>
                  </div>
                  <span className="menu-card-icon-lg">🍽️</span>
                </div>

                <div className="menu-avail">
                  <span className="menu-pill menu-pill-green">Home Delivery</span>
                  <span className="menu-pill menu-pill-green">Dine In</span>
                </div>

                <div className="menu-items-grid">
                  {[
                    { n: "01 |", label: "2 Sabji" },
                    { n: "02 |", label: "Roti" },
                    { n: "03 |", label: "Dal" },
                    { n: "04 |", label: "Salad" },
                    { n: "05 |", label: "Pickle" },
                  ].map(({ n, label }) => (
                    <div key={n} className="menu-item-box">
                      <span className="menu-item-num">{n}</span>
                      <span className="menu-item-name">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="menu-card-footer">
                  <span className="menu-fn menu-fn-green">♾ Unlimited for Dine In</span>
                  <span className="menu-fn menu-fn-amber">⚠ Limited for Delivery</span>
                </div>
              </div>
            </div>

            {/* ── Specials card ── */}
            <div className="menu-card menu-card-specials">
              <div className="menu-card-stripe menu-card-stripe-purple" />
              <div className="menu-card-body">
                <div className="menu-card-hdr">
                  <div>
                    <h3 className="menu-card-title">Dinner Specials</h3>
                    <p className="menu-card-subtitle">Served alongside or instead of Thali</p>
                  </div>
                  <span className="menu-card-icon-lg">✦</span>
                </div>

                <div className="menu-avail">
                  <span className="menu-pill menu-pill-purple">Dine In Only</span>
                </div>

                <ul className="menu-specials-list">
                  {[
                    { day: "Mon", dish: "Chole Bhature" },
                    { day: "Tue", dish: "Dosa with Idli" },
                    { day: "Wed", dish: "Veg Biryani" },
                    { day: "Thu", dish: "Aloo Paratha" },
                    { day: "Fri", dish: "Dal Khichdi" },
                    { day: "Sat", dish: "Uttapam with Fry Idli" },
                  ].map(({ day, dish }) => (
                    <li key={day} className="menu-specials-item">
                      <span className="menu-specials-day">{day}</span>
                      <span className="menu-specials-dish">{dish}</span>
                    </li>
                  ))}
                </ul>

                <div className="menu-card-footer">
                  <span className="menu-fn menu-fn-purple">Available every evening at the mess hall</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <span>© 2026 Mess Management System | Pratham Pithalia</span>
        <Link to="/login" className="home-footer-link">Login</Link>
      </footer>

    </div>
  );
}