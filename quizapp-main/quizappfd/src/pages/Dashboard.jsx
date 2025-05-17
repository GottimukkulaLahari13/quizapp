import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Sidebar */}
      <div style={{ width: "250px", backgroundColor: "#2C2F48", color: "#fff", padding: "20px" }}>
        <h2>Dashboard</h2>
        <ul style={{ listStyle: "none", padding: 0, marginTop: "30px" }}>
          <li style={{ marginBottom: "20px", cursor: "pointer" }}>My Courses</li>
          <li style={{ marginBottom: "20px", cursor: "pointer" }}>Results</li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px", position: "relative" }}>
        {/* Profile Section */}
        <div style={{ position: "absolute", top: 20, right: 30 }}>
          <img
            src={user?.profile || "/uploads/default.jpg"}
            alt="Profile"
            style={{
              width: 45,
              height: 45,
              borderRadius: "50%",
              cursor: "pointer",
              border: "2px solid #ccc"
            }}
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: 50,
                right: 0,
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                borderRadius: 6,
                width: 160,
                zIndex: 1000
              }}
            >
              <ul style={{ listStyle: "none", padding: 10, margin: 0 }}>
                <li style={{ padding: "8px 12px", cursor: "pointer" }}>My Profile</li>
                <li style={{ padding: "8px 12px", cursor: "pointer" }}>Change Password</li>
                <li
                  onClick={handleLogout}
                  style={{ padding: "8px 12px", cursor: "pointer", color: "red" }}
                >
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>

        <h2>Welcome to Dashboard</h2>
        <p>This is the user dashboard after login.</p>
      </div>
    </div>
  );
};

export default Dashboard;
