import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css"; // Assuming you have this CSS file
import Register from "./Register";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState({ message: "", error: false });
  const navigate = useNavigate();

  // Check for remembered credentials on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const rememberedPassword = localStorage.getItem("rememberedPassword");
    if (rememberedEmail && rememberedPassword) {
      setEmail(rememberedEmail);
      setPassword(rememberedPassword);
      setRememberMe(true);
    }
  }, []);

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

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      localStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);

      if (err.response) {
        console.log("Error data:", err.response.data);
        console.log("Error status:", err.response.status);
        console.log("Error headers:", err.response.headers);
        alert(err.response.data.message || "Login failed. Please check your credentials.");
      } else if (err.request) {
        console.log("No response received:", err.request);
        alert("No response from server. Please check your network connection.");
      } else {
        console.log("Error setting up request:", err.message);
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetStatus({ message: "", error: false });

    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: resetEmail
      });
      
      if (response.data.password) {
        setResetStatus({
          message: `Password reset successful! Your new password is: ${response.data.password}. Please save this password and use it to login.`,
          error: false
        });
      } else {
        setResetStatus({
          message: "A new password has been sent to your email!",
          error: false
        });
      }
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetStatus({ message: "", error: false });
      }, 5000); // Increased timeout to give user time to read the password
    } catch (err) {
      setResetStatus({
        message: err.response?.data?.message || "Failed to send new password. Please try again.",
        error: true
      });
    } finally {
      setLoading(false);
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
            <input 
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            /> Remember Me
          </span>
          <button 
            type="button" 
            className="forgot-password"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </div>

        <button className="auth-button" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Password</h3>
            <form onSubmit={handleForgotPassword}>
              <label>Email:</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              {resetStatus.message && (
                <div className={`reset-status ${resetStatus.error ? 'error' : 'success'}`}>
                  {resetStatus.message}
                </div>
              )}
              <div className="modal-buttons">
                <button type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Password"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetStatus({ message: "", error: false });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;