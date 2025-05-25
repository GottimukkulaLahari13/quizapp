import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Sending login request to http://localhost:5000/api/auth/login");
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { user } = response.data;

      console.log("Login success:", user);

      localStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2 className="auth-title">Login to Your Account</h2>

        <label>Email:</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <label>Password:</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <div className="auth-extra">
          <span className="remember-checkbox">
            <input type="checkbox" /> Remember Me
          </span>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
