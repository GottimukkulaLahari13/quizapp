import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  return (
    <div className="auth-container">
      <form className="auth-form">
        <h2 className="auth-title">Login to Your Account</h2>
        <label>Email:</label>
        <input type="email" placeholder="Enter your email" />

        <label>Password:</label>
        <input type="password" placeholder="Enter your password" />

        <div className="auth-extra">
          <span className="remember-checkbox">
            <input type="checkbox" />
            Remember Me
          </span>
          <a href="#" className="forgot-password">Forgot Password?</a>
        </div>

        <button className="auth-button">Login</button>
        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
