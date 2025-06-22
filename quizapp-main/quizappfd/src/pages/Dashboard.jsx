import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [tests, setTests] = useState([]);
  const [userTestSessions, setUserTestSessions] = useState([]);
  const [selectedTestSessionResults, setSelectedTestSessionResults] = useState(null);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [userProfile, setUserProfile] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) navigate("/login");
    else fetchUserProfile();
  }, [navigate, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user.id}/profile`);
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchUserTestSessions = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user.id}/test-sessions`);
      const data = await response.json();
      setUserTestSessions(data.testSessions || []);
    } catch (error) {
      console.error("Error fetching user test sessions:", error);
    }
  };

  const fetchDetailedTestResults = async (testSessionId) => {
    if (!user?.id || !testSessionId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/results/${user.id}/${testSessionId}`);
      const data = await response.json();
      setSelectedTestSessionResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      setSelectedTestSessionResults(null);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setShowDropdown(false);
    if (tab === "mycourses") {
      setTests([
        { id: 101, name: "GATE 2025 Mock Test", type: "GATE Exam Mock Test" },
      ]);
    } else if (tab === "results") {
      fetchUserTestSessions();
      setSelectedTestSessionResults(null);
    }
  };

  const handleTestLaunch = (testId) => {
    const instructionURL = `${window.location.origin}/instructions/${testId}`;
    window.open(instructionURL, '_blank', 'width=1200,height=800');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...changePasswordData }),
      });
      const data = await res.json();
      setMessage({ text: data.message || "Password updated successfully.", type: "success" });
      setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Change password error:", err);
      setMessage({ text: "Error updating password.", type: "error" });
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Dashboard</h2>
        <ul className={styles.sidebarMenu}>
          <li 
            className={`${styles.sidebarMenuItem} ${activeTab === "mycourses" ? styles.active : ""}`}
            onClick={() => handleTabClick("mycourses")}
          >
            My Courses
          </li>
          <li 
            className={`${styles.sidebarMenuItem} ${activeTab === "results" ? styles.active : ""}`}
            onClick={() => handleTabClick("results")}
          >
            Results
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Profile Section */}
        <div className={styles.profileSection}>
          <img
            src={userProfile?.profile_pic || "/uploads/default.jpg"}
            alt="Profile"
            className={styles.profileImage}
            onClick={() => setShowDropdown(!showDropdown)}
          />
          {showDropdown && (
            <div className={styles.profileDropdown}>
              <ul className={styles.dropdownMenu}>
                <li className={styles.dropdownItem} onClick={() => setActiveTab("myprofile")}>
                  My Profile
                </li>
                <li className={styles.dropdownItem} onClick={() => setActiveTab("changepassword")}>
                  Change Password
                </li>
                <li className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.contentSection}>
          {/* Tabs Content */}
          {activeTab === "home" && (
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <h2>Welcome to Dashboard</h2>
              <p>This is the user dashboard after login.</p>
            </div>
          )}

          {activeTab === "mycourses" && (
            <div>
              <h2>Available Tests</h2>
              <div className={styles.testsGrid}>
                {tests.length > 0 ? (
                  tests.map(test => (
                    <div key={test.id} className={styles.testCard}>
                      <h4>{test.name}</h4>
                      <p>{test.type}</p>
                      <button onClick={() => handleTestLaunch(test.id)} className={styles.submitButton}>
                        Start Test
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No tests available at the moment.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "results" && (
            <div>
              <h2>Test Results</h2>
              {!selectedTestSessionResults ? (
                userTestSessions.length > 0 ? (
                  <div className={styles.resultsTable}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>Attempted At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userTestSessions.map((session, index) => (
                          <tr key={index}>
                            <td>{session.test_session_id}</td>
                            <td>{new Date(session.answered_at).toLocaleString()}</td>
                            <td>
                              <button 
                                onClick={() => fetchDetailedTestResults(session.test_session_id)} 
                                className={styles.submitButton}
                              >
                                View Results
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No completed test sessions found yet.</p>
                )
              ) : (
                <div className={styles.resultsDetail}>
                  <button 
                    onClick={() => setSelectedTestSessionResults(null)} 
                    className={styles.backButton}
                  >
                    &larr; Back to Sessions
                  </button>
                  <h3>Results for Session: {selectedTestSessionResults.testSessionId}</h3>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {selectedTestSessionResults.overallScore?.toFixed(2)}%
                      </div>
                      <div className={styles.statLabel}>Score</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {selectedTestSessionResults.totalQuestions}
                      </div>
                      <div className={styles.statLabel}>Total Questions</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {selectedTestSessionResults.correctAnswersCount}
                      </div>
                      <div className={styles.statLabel}>Correct Answers</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {selectedTestSessionResults.incorrectAnswersCount}
                      </div>
                      <div className={styles.statLabel}>Incorrect Answers</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {selectedTestSessionResults.unansweredQuestionsCount}
                      </div>
                      <div className={styles.statLabel}>Unattempted</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "myprofile" && (
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <img 
                  src={userProfile?.profile_pic || "/uploads/default.jpg"} 
                  alt="Profile" 
                  className={styles.largeProfileImage} 
                />
                <h2>{userProfile?.full_name || user?.name}</h2>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileLabel}>Email:</div>
                <div className={styles.profileValue}>{userProfile?.email || user?.email}</div>
                
                <div className={styles.profileLabel}>Phone:</div>
                <div className={styles.profileValue}>{userProfile?.phone || "Not provided"}</div>
                
                <div className={styles.profileLabel}>College:</div>
                <div className={styles.profileValue}>{userProfile?.college_name || "Not provided"}</div>
                
                <div className={styles.profileLabel}>College ID:</div>
                <div className={styles.profileValue}>{userProfile?.college_id || "Not provided"}</div>
              </div>
            </div>
          )}

          {activeTab === "changepassword" && (
            <div className={styles.profileCard}>
              <h2 style={{ marginBottom: "2rem", textAlign: "center" }}>Change Password</h2>
              <form onSubmit={handleChangePassword} className={styles.changePasswordForm}>
                <input
                  type="password"
                  placeholder="Current Password"
                  required
                  className={styles.formInput}
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  className={styles.formInput}
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  className={styles.formInput}
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                />
                <button type="submit" className={styles.submitButton}>
                  Update Password
                </button>
              </form>
              {message.text && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
