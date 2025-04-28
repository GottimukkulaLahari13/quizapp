import React, { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Normally you check email/password with backend here
    if (email && password) {
      // Successful login
      navigate("/dashboard");
    } else {
      alert("Please enter email and password");
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
            <input type="checkbox" />
            Remember Me
          </span>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button className="auth-button" type="submit">Login</button>
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
