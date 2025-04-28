import React from "react";

const Dashboard = () => {
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
      <div style={{ flex: 1, padding: "40px" }}>
        <h2>Welcome to Dashboard</h2>
        <p>This is the user dashboard after login.</p>
      </div>
    </div>
  );
};

export default Dashboard;
