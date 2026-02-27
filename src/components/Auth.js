import React, { useState } from "react";
import api from "../api";
import "./Auth.css";

const Auth = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, { email, password });
      const { token, user } = res.data;
      localStorage.setItem("ctoaster_token", token);
      localStorage.setItem("ctoaster_user", JSON.stringify(user));
      onAuthSuccess(user);
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ctoaster</h1>
        <h2 className="auth-subtitle">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>
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
          <button type="submit" className="auth-button">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
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
      </div>
    </div>
  );
};

export default Auth;
