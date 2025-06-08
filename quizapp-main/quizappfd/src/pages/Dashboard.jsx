import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [tests, setTests] = useState([]); // This would be fetched from a /api/tests endpoint in a real app
  const [userTestSessions, setUserTestSessions] = useState([]); // To store a list of completed test sessions
  const [selectedTestSessionResults, setSelectedTestSessionResults] = useState(null); // To store detailed results of a specific session

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

  const fetchUserTestSessions = async () => {
    if (!user || !user.id) {
      console.error("User not logged in or user ID not available.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user.id}/test-sessions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUserTestSessions(data.testSessions);
    } catch (error) {
      console.error("Error fetching user test sessions:", error);
      // Optionally, show an error message to the user
    }
  };

  const fetchDetailedTestResults = async (testSessionId) => {
    if (!user || !user.id || !testSessionId) {
      console.error("User or test session ID missing.");
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/results/${user.id}/${testSessionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedTestSessionResults(data); // Store the entire result object
    } catch (error) {
      console.error(`Error fetching results for session ${testSessionId}:`, error);
      setSelectedTestSessionResults(null); // Clear previous results
      // Optionally, show an error message to the user
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "mycourses") {
      // In a real application, you would fetch these tests from your backend
      // For now, using the hardcoded list
      setTests([
        {
          id: 101,
          name: "GATE 2025 Mock Test",
          type: "GATE Exam Mock Test"
        },
        // Add more tests as needed
      ]);
    } else if (tab === "results") {
      fetchUserTestSessions(); // Fetch test sessions when results tab is active
      setSelectedTestSessionResults(null); // Clear detailed results when switching to overall sessions view
    }
  };

  // This function now correctly opens the instructions in a new window
  const handleTestLaunch = (testId) => {
    const instructionURL = `${window.location.origin}/instructions/${testId}`;
    window.open(instructionURL, '_blank', 'width=1200,height=800');
  };

  // Helper function to format answers for display in results table
  const formatAnswerDisplay = (questionType, selectedOption, selectedOptionsText, natAnswer) => {
    if (questionType === 'MCQ' || questionType === 'MSQ') {
        return selectedOptionsText && selectedOptionsText.length > 0
            ? selectedOptionsText.join(', ')
            : 'No answer';
    } else if (questionType === 'NAT') {
        return natAnswer !== null && natAnswer !== undefined
            ? String(natAnswer)
            : 'No answer';
    }
    return 'N/A';
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
            <div style={{ position: "absolute", top: 50, right: 0, backgroundColor: "#fff", padding: 10, borderRadius: 6, border: "1px solid #ddd", zIndex: 1000 }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>My Profile</li>
                <li>Change Password</li>
                <li onClick={handleLogout} style={{ color: "red", cursor: "pointer" }}>Logout</li>
              </ul>
            </div>
          )}
        </div>

        {/* Tabs Content */}
        {activeTab === "home" && (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <h2>Welcome to Dashboard</h2>
            <p>This is the user dashboard after login.</p>
          </div>
        )}

        {activeTab === "mycourses" && (
          <div style={{ padding: 40 }}>
            <h2>Available Tests</h2>
            {tests.length > 0 ? (
              tests.map(test => (
                <div key={test.id} style={{ marginBottom: 20, backgroundColor: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  <h4>{test.name}</h4>
                  <button onClick={() => handleTestLaunch(test.id)} style={{ padding: "10px 20px", backgroundColor: "#2C2F48", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Start Test</button>
                </div>
              ))
            ) : (
              <p>No tests available at the moment.</p>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div style={{ padding: 40 }}>
            <h2>Test Results</h2>
            {!selectedTestSessionResults ? (
              // Display list of test sessions
              userTestSessions.length > 0 ? (
                <div>
                  <h3>Your Completed Test Sessions:</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #eee", padding: "10px", textAlign: "left", backgroundColor: "#f2f2f2" }}>Session ID</th>
                        <th style={{ border: "1px solid #eee", padding: "10px", textAlign: "left", backgroundColor: "#f2f2f2" }}>Attempted At</th>
                        <th style={{ border: "1px solid #eee", padding: "10px", textAlign: "left", backgroundColor: "#f2f2f2" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTestSessions.map((session, index) => (
                        <tr key={index}>
                          <td style={{ border: "1px solid #eee", padding: "10px" }}>{session.test_session_id}</td>
                          <td style={{ border: "1px solid #eee", padding: "10px" }}>{new Date(session.answered_at).toLocaleString()}</td>
                          <td style={{ border: "1px solid #eee", padding: "10px" }}>
                            <button
                              onClick={() => fetchDetailedTestResults(session.test_session_id)}
                              style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
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
              // Display detailed results for the selected session
              <div>
                <button
                  onClick={() => setSelectedTestSessionResults(null)}
                  style={{ marginBottom: "20px", padding: "8px 15px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  &larr; Back to Sessions
                </button>
                <h3>Results for Session: {selectedTestSessionResults.testSessionId}</h3>
                <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#e9ecef", borderRadius: "8px" }}>
                  <p><strong>Overall Score:</strong> {selectedTestSessionResults.overallScore !== undefined && selectedTestSessionResults.overallScore !== null ? `${selectedTestSessionResults.overallScore.toFixed(2)}%` : 'N/A'}</p>
                  <p><strong>Total Questions:</strong> {selectedTestSessionResults.totalQuestions}</p>
                  <p><strong>Correctly Answered:</strong> {selectedTestSessionResults.correctAnswersCount}</p>
                  <p><strong>Incorrectly Answered:</strong> {selectedTestSessionResults.incorrectAnswersCount}</p>
                  <p><strong>Unattempted:</strong> {selectedTestSessionResults.unansweredQuestionsCount}</p>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Q. No.</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Question</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Your Answer</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Correct Answer</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Marks</th>
                      <th style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTestSessionResults.results.map((result, idx) => (
                      <tr key={idx} style={{ backgroundColor: result.is_correct ? '#e6ffe6' : (result.has_user_answered ? '#ffe6e6' : '#f8f8f8') }}>
                        <td style={{ border: "1px solid #ccc", padding: "8px" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.question_text}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                            {formatAnswerDisplay(result.question_type, result.user_selected_option, result.user_selected_options_text, result.user_nat_answer)}
                        </td>
                        <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                            {result.question_type === 'MCQ' || result.question_type === 'MSQ'
                                ? result.correct_options_text.join(', ')
                                : result.question_type === 'NAT'
                                    ? result.correct_nat_answer
                                    : 'N/A'
                            }
                        </td>
                        <td style={{ border: "1px solid #ccc", padding: "8px" }}>{result.marks_obtained !== undefined ? result.marks_obtained : 'N/A'} / {result.total_marks_possible || 'N/A'}</td>
                        <td style={{ border: "1px solid #ccc", padding: "8px", color: result.is_correct ? 'green' : (result.has_user_answered ? 'red' : 'gray') }}>
                            {result.is_correct ? 'Correct' : (result.has_user_answered ? 'Incorrect' : 'Unanswered')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;