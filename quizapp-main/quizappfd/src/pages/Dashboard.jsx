// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "mycourses") {
      setTests([
        {
          id: 101,
          name: "GATE 2025 Mock Test",
          type: "GATE Exam Mock Test"
        }
      ]);
    }
    if (tab === "results") {
      const storedResults = JSON.parse(localStorage.getItem("results")) || [];
      setResults(storedResults);
    }
  };

  const handleTestLaunch = (testId) => {
    navigate(`/test/${testId}`);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", margin: 0 }}>
      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          backgroundColor: "#2C2F48",
          color: "#fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <h2>Dashboard</h2>
        <ul style={{ listStyle: "none", padding: 0, marginTop: "30px" }}>
          <li onClick={() => handleTabClick("mycourses")} style={{ cursor: "pointer", marginBottom: 10 }}>My Courses</li>
          <li onClick={() => handleTabClick("results")} style={{ cursor: "pointer" }}>Results</li>
        </ul>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: "relative", backgroundColor: "#f9f9f9" }}>
        {/* Profile */}
        <div style={{ position: "absolute", top: 20, right: 30 }}>
          <img
            src={user?.profile || "/uploads/default.jpg"}
            alt="Profile"
            style={{ width: 45, height: 45, borderRadius: "50%", border: "2px solid #ccc", cursor: "pointer" }}
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div style={{ position: "absolute", top: 50, right: 0, backgroundColor: "#fff", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>My Profile</li>
                <li>Change Password</li>
                <li onClick={handleLogout} style={{ color: "red", cursor: "pointer" }}>Logout</li>
              </ul>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === "home" && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <h2>Welcome to Dashboard</h2>
            <p>This is the user dashboard after login.</p>
          </div>
        )}

        {activeTab === "mycourses" && (
          <div style={{ padding: 40 }}>
            <h2>Available Tests</h2>
            {tests.map(test => (
              <div key={test.id} style={{ marginBottom: 20, backgroundColor: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <h4>{test.name}</h4>
                <button onClick={() => handleTestLaunch(test.id)} style={{ padding: "10px 20px", backgroundColor: "#2C2F48", color: "#fff", border: "none", borderRadius: 4 }}>Start Test</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "results" && (
          <div style={{ padding: 40 }}>
            <h2>Test Results</h2>
            {results.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>Question</th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>Your Answer</th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>Correct Answer</th>
                    <th style={{ border: "1px solid #ccc", padding: "8px" }}>Solution</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.question}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.userAnswer}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.correctAnswer}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.solution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No results available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
