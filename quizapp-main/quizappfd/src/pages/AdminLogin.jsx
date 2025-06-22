import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", {
        username,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminUser", JSON.stringify(res.data.admin));
        navigate("/admin/dashboard");
      } else {
        setError("Login failed: No token received");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Admin Login</h2>
        
        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            marginBottom: '15px', 
            padding: '8px', 
            backgroundColor: 'rgba(255, 107, 107, 0.1)', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#fff'
            }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px', textAlign: 'left' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: '#fff'
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
