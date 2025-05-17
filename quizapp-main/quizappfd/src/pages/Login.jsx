import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Replace this with real backend auth later
    const demoEmail = "demo@example.com";
    const demoPassword = "Demo@123";
    const demoProfile = "/uploads/profile.jpg"; // should exist in public/uploads

    if (email === demoEmail && password === demoPassword) {
      localStorage.setItem("user", JSON.stringify({ email, profile: demoProfile }));
      navigate("/dashboard");
    } else {
      alert("Invalid email or password.");
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
        />

        <label>Password:</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-extra">
          <span className="remember-checkbox">
            <input type="checkbox" /> Remember Me
          </span>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button className="auth-button" type="submit">Login</button>
        <p>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
