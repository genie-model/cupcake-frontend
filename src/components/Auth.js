import React, { useState } from "react";
import api from "../api";
import "./Auth.css";

const ADMIN_EMAILS = ["pthak006@ucr.edu", "andy@seao2.org"];

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // "login", "register", or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const res = await api.post(endpoint, { email, password });
      const { token, user } = res.data;

      if (mode === "admin" && !ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
        setError("This account does not have admin privileges");
        return;
      }

      localStorage.setItem("ctoaster_token", token);
      const userData = mode === "admin"
        ? { ...user, isAdmin: true }
        : user;
      localStorage.setItem("ctoaster_user", JSON.stringify(userData));
      onAuthSuccess(userData);
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Authentication failed";
      setError(detail);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError("");
  };

  const subtitle = mode === "admin" ? "Admin Login" : mode === "login" ? "Sign in" : "Create account";
  const buttonLabel = mode === "admin" ? "Admin Login" : mode === "login" ? "Login" : "Register";

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ctoaster</h1>
        <h2 className="auth-subtitle">{subtitle}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="you@example.com"
          />
          <label className="auth-label">Password</label>
          <div className="auth-password-row">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-button">{buttonLabel}</button>
        </form>
        {mode === "admin" ? (
          <div className="auth-toggle">
            <button type="button" className="auth-link" onClick={() => { setMode("login"); setError(""); }}>
              Back to Login
            </button>
          </div>
        ) : (
          <div className="auth-toggle">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button type="button" className="auth-link" onClick={toggleMode}>
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="auth-link" onClick={toggleMode}>
                  Login
                </button>
              </>
            )}
          </div>
        )}
        <div className="auth-admin-link">
          {mode !== "admin" && (
            <button type="button" className="auth-link auth-link-dim" onClick={() => { setMode("admin"); setError(""); }}>
              System Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
