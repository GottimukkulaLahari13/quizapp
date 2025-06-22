import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Constants for mock stats
const MOCK_USERS_REGISTERED = 150;
const MOCK_SUBMISSIONS = 320;

// Card style for statistics
const cardStyle = {
  backgroundColor: "rgba(0, 0, 50, 0.75)",
  padding: "25px",
  borderRadius: "12px",
  textAlign: "center",
};

const AdminDashboard = () => {
  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({ name: "", description: "", questions: [] });
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    usersRegistered: 0,
    submissions: 0,
    activeTests: 0,
  });
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [editTest, setEditTest] = useState(null);
  const [questionsFromDB, setQuestionsFromDB] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [users, setUsers] = useState([]); // Registered users
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [changePwd, setChangePwd] = useState({ current: '', new: '', confirm: '' });
  const [changePwdMsg, setChangePwdMsg] = useState(null);
  const [showStudents, setShowStudents] = useState(false); // State to toggle students table

  const navigate = useNavigate();

  // Memoize statistics for performance
  const statistics = useMemo(
    () => [
      {
        label: "Total Tests",
        value: stats.totalTests,
        color: "#4CAF50",
      },
      {
        label: "Users Registered",
        value: stats.usersRegistered,
        color: "#2196F3",
      },
      {
        label: "Submissions",
        value: stats.submissions,
        color: "#FF9800",
      },
      {
        label: "Active Tests",
        value: stats.activeTests,
        color: "#9C27B0",
      },
    ],
    [stats]
  );

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (user) {
      setAdminUser(JSON.parse(user));
    }

    fetchDashboardData();
    fetchUsers();
    // eslint-disable-next-line
  }, [navigate]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      // Fetch tests
      const res = await axios.get("http://localhost:5000/api/admin/tests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(
        res.data.map((t) => ({
          ...t,
          questions: t.questions || [],
        }))
      );
      // Fetch users count
      const usersRes = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersRegistered = usersRes.data.users ? usersRes.data.users.length : 0;
      // Fetch submissions count
      const submissionsRes = await axios.get("http://localhost:5000/api/admin/submissions-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const submissions = submissionsRes.data.count || 0;
      setStats({
        totalTests: res.data.length,
        usersRegistered,
        submissions,
        activeTests:
          res.data.filter((test) => test.status === "active").length ||
          res.data.length,
      });
    } catch (error) {
      console.error("Error fetching tests:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (error) {
      setUsersError("Failed to fetch users from database.");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Create Test
  const handleCreate = useCallback(async () => {
    if (!newTest.name.trim() || !newTest.description.trim()) {
      alert("Please fill in both test name and description");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      // Send questions if backend supports, else just name/description
      const res = await axios.post("http://localhost:5000/api/admin/tests", newTest, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Add to local state for instant UI update
      setTests((prev) => [
        ...prev,
        {
          ...newTest,
          id: res.data.id || Date.now(), // Use backend id if available
        },
      ]);
      setNewTest({ name: "", description: "", questions: [] });
      setShowCreateTest(false);
      setStats((prev) => ({
        ...prev,
        totalTests: prev.totalTests + 1,
      }));
      alert("Test created successfully!");
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test");
    }
  }, [newTest]);

  // Delete Test
  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this test?")) {
        return;
      }
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(`http://localhost:5000/api/admin/tests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTests((prev) => prev.filter((t) => t.id !== id));
        setStats((prev) => ({
          ...prev,
          totalTests: prev.totalTests - 1,
        }));
        alert("Test deleted successfully!");
      } catch (error) {
        console.error("Error deleting test:", error);
        alert("Failed to delete test");
      }
    },
    []
  );

  // Edit Test
  const handleEdit = (test) => {
    setEditTest({ ...test });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editTest.name.trim() || !editTest.description.trim()) {
      alert("Please fill in both test name and description");
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      console.log("Sending to backend:", editTest); // <--- Add this line
      await axios.put(
        `http://localhost:5000/api/admin/tests/${editTest.id}`,
        editTest,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTests((prev) =>
        prev.map((t) => (t.id === editTest.id ? { ...editTest } : t))
      );
      setShowEditModal(false);
      alert("Test updated successfully!");
    } catch (error) {
      console.error("Error updating test:", error);
      alert("Failed to update test");
    }
  };

  // View Questions
  const handleViewQuestions = async (test) => {
    setSelectedTest(test);
    setShowQuestionsModal(true);
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get("http://localhost:5000/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestionsFromDB(res.data.questions || []);
    } catch (err) {
      setQuestionsError("Failed to fetch questions from database.");
      setQuestionsFromDB([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  }, [navigate]);

  // Admin Profile Modal handlers
  const handleOpenAdminProfile = () => setShowAdminProfile(true);
  const handleCloseAdminProfile = () => {
    setShowAdminProfile(false);
    setChangePwd({ current: '', new: '', confirm: '' });
    setChangePwdMsg(null);
  };
  const handleChangePwd = async () => {
    setChangePwdMsg(null);
    if (!changePwd.current || !changePwd.new || !changePwd.confirm) {
      setChangePwdMsg('All fields required');
      return;
    }
    if (changePwd.new !== changePwd.confirm) {
      setChangePwdMsg('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const adminUser = JSON.parse(localStorage.getItem("adminUser"));
      const res = await axios.post("http://localhost:5000/api/admin/change-password", {
        adminId: adminUser.id,
        currentPassword: changePwd.current,
        newPassword: changePwd.new
      }, { headers: { Authorization: `Bearer ${token}` } });
      setChangePwdMsg(res.data.message || 'Password changed successfully');
      setChangePwd({ current: '', new: '', confirm: '' });
    } catch (err) {
      setChangePwdMsg(err.response?.data?.message || 'Failed to change password');
    }
  };

  // View Report Modal handlers
  const handleViewReports = useCallback(async () => {
    setShowReportModal(true);
    setReportLoading(true);
    setReportError(null);
    setReportData(null);
    try {
      // For demo: fetch all user test sessions, then fetch report for the first one
      const token = localStorage.getItem("adminToken");
      // Fetch all users
      const usersRes = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersList = usersRes.data.users || [];
      if (usersList.length === 0) throw new Error('No users found');
      // For demo, pick the first user
      const userId = usersList[0].id;
      // Fetch test sessions for this user
      const sessionsRes = await axios.get(`http://localhost:5000/api/user/${userId}/test-sessions`);
      const sessions = sessionsRes.data.testSessions || [];
      if (sessions.length === 0) throw new Error('No test sessions found for user');
      // For demo, pick the first session
      const testSessionId = sessions[0].test_session_id;
      // Fetch report
      const reportRes = await axios.get(`http://localhost:5000/api/results/${userId}/${testSessionId}`);
      setReportData(reportRes.data);
    } catch (err) {
      setReportError(err.response?.data?.message || err.message || 'Failed to fetch report');
    } finally {
      setReportLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e1e2f, #000033)",
        color: "white",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "rgba(0, 0, 50, 0.75)",
          borderRadius: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem" }}>Admin Dashboard</h1>
          {adminUser && (
            <p style={{ margin: "5px 0 0 0", color: "#ccc" }}>
              Welcome, {adminUser.username}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleOpenAdminProfile}
            aria-label="Admin Profile"
            style={{
              padding: "10px 20px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Admin Profile
          </button>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {statistics.map((stat) => (
          <div key={stat.label} style={cardStyle}>
            <h3 style={{ margin: "0 0 10px 0", color: stat.color }}>
              {stat.label}
            </h3>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowCreateTest((prev) => !prev)}
          aria-label="Create Test"
          style={{
            padding: "12px 25px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          {showCreateTest ? "Hide Create Test" : "Create Test"}
        </button>

        <button
          onClick={handleViewReports}
          aria-label="View Reports"
          style={{
            padding: "12px 25px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
          }}
        >
          View Reports
        </button>
      </div>

      {/* Create Test Section */}
      {showCreateTest && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 50, 0.75)",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
            Create New Test
          </h3>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Test Name"
              value={newTest.name}
              onChange={(e) =>
                setNewTest({ ...newTest, name: e.target.value })
              }
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
              aria-label="Test Name"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTest.description}
              onChange={(e) =>
                setNewTest({ ...newTest, description: e.target.value })
              }
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
              }}
              aria-label="Test Description"
            />
          </div>

          {/* Advanced Question Management */}
          <QuestionBuilder
            questions={newTest.questions}
            onQuestionsChange={(questions) =>
              setNewTest((prev) => ({ ...prev, questions }))
            }
          />

          <button
            onClick={handleCreate}
            aria-label="Create Test"
            style={{
              padding: "12px 25px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              marginTop: "20px",
            }}
          >
            Create Test
          </button>
        </div>
      )}

      {/* Tests List */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 50, 0.75)",
          padding: "25px",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
          Existing Tests
        </h3>
        {tests.length === 0 ? (
          <p style={{ color: "#ccc", fontStyle: "italic" }}>
            No tests created yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {tests.map((test) => (
              <div
                key={test.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{test.name}</h4>
                  <p style={{ margin: 0, color: "#ccc" }}>
                    {test.description}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleViewQuestions(test)}
                    aria-label={`View Questions for ${test.name}`}
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    View Questions
                  </button>
                  <button
                    onClick={() => handleEdit(test)}
                    aria-label={`Edit ${test.name}`}
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#FFC107",
                      color: "#222",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    aria-label={`Delete ${test.name}`}
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#ff6b6b",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Students Section */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 50, 0.75)",
          padding: "25px",
          borderRadius: "12px",
          marginTop: "30px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
          Registered Students
        </h3>
        <button
          onClick={() => setShowStudents(!showStudents)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            margin: "30px 0 20px",
          }}
        >
          {showStudents ? "Hide Registered Students" : "View Registered Students"}
        </button>
        {showStudents && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ borderBottom: '2px solid #2196F3', paddingBottom: 10, marginBottom: 20 }}>Registered Students</h2>
            {usersLoading ? <p>Loading users...</p> : usersError ? <p style={{ color: '#ff6b6b' }}>{usersError}</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
                  <thead>
                    <tr style={{ background: "#222" }}>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>Name</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>Email</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>Phone</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>College Name</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>College ID</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>Profile Pic</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>ID Card</th>
                      <th style={{ padding: "8px", border: "1px solid #333" }}>Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.full_name}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.email}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.phone}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.college_name}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.college_id}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>
                          {user.profile_pic ? (
                            <a href={`http://localhost:5000/uploads/${user.profile_pic}`} target="_blank" rel="noopener noreferrer" style={{ color: '#87CEEB' }}>
                              .jpeg
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>
                          {user.id_card ? (
                            <a href={`http://localhost:5000/uploads/${user.id_card}`} target="_blank" rel="noopener noreferrer" style={{ color: '#87CEEB' }}>
                              .jpeg
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Questions Modal */}
      {showQuestionsModal && selectedTest && (
        <Modal onClose={() => setShowQuestionsModal(false)} title={`Questions in Database`}>
          <div>
            {questionsLoading ? (
              <p style={{ color: "#ccc" }}>Loading questions...</p>
            ) : questionsError ? (
              <p style={{ color: "#ff6b6b" }}>{questionsError}</p>
            ) : questionsFromDB.length > 0 ? (
              questionsFromDB.map((q, idx) => (
                <div key={q.question_id} style={{ marginBottom: "18px", paddingBottom: "10px", borderBottom: "1px solid #333" }}>
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                    Q{idx + 1}: {q.question_text}
                  </div>
                  <div style={{ fontSize: "0.95em", color: "#aaa", marginBottom: 2 }}>
                    Type: {q.type} | Marks: {q.marks}
                  </div>
                  <ul style={{ margin: "5px 0 0 0", padding: 0, listStyle: "none" }}>
                    {q.options && q.options.length > 0 ? (
                      q.options.map((opt, i) => (
                        <li key={opt.option_id} style={{ color: "#fff" }}>
                          {String.fromCharCode(65 + i)}. {opt.option_text}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "#ccc" }}>No options</li>
                    )}
                  </ul>
                  {/* Correct Answer Display */}
                  <div style={{ marginTop: 6, color: "#4CAF50", fontWeight: "bold", fontSize: "0.98em" }}>
                    Correct Answer: {(() => {
                      if (q.type === 'MCQ' && q.correct_answer) {
                        // MCQ: single correct option
                        const idx = q.options.findIndex(opt => opt.option_id === q.correct_answer.option_id);
                        return idx !== -1 ? `${String.fromCharCode(65 + idx)}. ${q.correct_answer.option_text}` : q.correct_answer.option_text;
                      } else if (q.type === 'MSQ' && Array.isArray(q.correct_answer)) {
                        // MSQ: multiple correct options
                        return q.correct_answer.length > 0
                          ? q.correct_answer.map(ans => {
                              const idx = q.options.findIndex(opt => opt.option_id === ans.option_id);
                              return idx !== -1 ? `${String.fromCharCode(65 + idx)}. ${ans.option_text}` : ans.option_text;
                            }).join(', ')
                          : 'None';
                      } else if (q.type === 'NAT') {
                        return q.correct_answer !== null && q.correct_answer !== undefined && q.correct_answer !== '' ? q.correct_answer : 'None';
                      } else {
                        return 'None';
                      }
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#ccc" }}>No questions found in the database.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editTest && (
        <Modal onClose={() => setShowEditModal(false)} title={`Edit Test: ${editTest.name}`}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              value={editTest.name}
              onChange={(e) => setEditTest((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "1rem",
                marginBottom: "10px",
              }}
              placeholder="Test Name"
            />
            <input
              type="text"
              value={editTest.description}
              onChange={(e) => setEditTest((prev) => ({ ...prev, description: e.target.value }))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "1rem",
                marginBottom: "10px",
              }}
              placeholder="Description"
            />
            <QuestionBuilder
              questions={editTest.questions}
              onQuestionsChange={(questions) =>
                setEditTest((prev) => ({ ...prev, questions }))
              }
            />
            <button
              onClick={handleEditSave}
              style={{
                padding: "10px 25px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                marginTop: "10px",
              }}
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* Admin Profile Modal */}
      {showAdminProfile && (
        <Modal onClose={handleCloseAdminProfile} title="Admin Profile">
          <div style={{ marginBottom: 16 }}>
            <strong>Username:</strong> {adminUser?.username}
          </div>
          <div style={{ marginBottom: 16 }}>
            <h4>Change Password</h4>
            <input
              type="password"
              placeholder="Current Password"
              value={changePwd.current}
              onChange={e => setChangePwd(p => ({ ...p, current: e.target.value }))}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #333' }}
            />
            <input
              type="password"
              placeholder="New Password"
              value={changePwd.new}
              onChange={e => setChangePwd(p => ({ ...p, new: e.target.value }))}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #333' }}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={changePwd.confirm}
              onChange={e => setChangePwd(p => ({ ...p, confirm: e.target.value }))}
              style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 4, border: '1px solid #333' }}
            />
            <button onClick={handleChangePwd} style={{ padding: '8px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Change Password</button>
            {changePwdMsg && <div style={{ marginTop: 8, color: changePwdMsg.includes('success') ? '#4CAF50' : '#ff6b6b' }}>{changePwdMsg}</div>}
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 20px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
        </Modal>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Modal onClose={() => setShowReportModal(false)} title="User Test Report">
          {reportLoading ? (
            <p style={{ color: '#ccc' }}>Loading report...</p>
          ) : reportError ? (
            <p style={{ color: '#ff6b6b' }}>{reportError}</p>
          ) : reportData ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <strong>Test Session ID:</strong> {reportData.testSessionId}<br />
                <strong>Total Questions:</strong> {reportData.totalQuestions}<br />
                <strong>Correct Answers:</strong> {reportData.correctAnswersCount}<br />
                <strong>Incorrect Answers:</strong> {reportData.incorrectAnswersCount}<br />
                <strong>Unanswered:</strong> {reportData.unansweredQuestionsCount}<br />
                <strong>Score:</strong> {reportData.totalMarksObtained} / {reportData.maxMarks} ({typeof reportData.overallScore === 'number' && !isNaN(reportData.overallScore) ? reportData.overallScore.toFixed(2) : '-'}%)
                {reportData.results ? (
                  <span style={{ color: '#aaa', fontSize: '0.95em', marginLeft: 8 }}>
                    (Frontend sum: {reportData.results.reduce((sum, q) => sum + (typeof q.marks_obtained === 'number' ? q.marks_obtained : 0), 0)})
                  </span>
                ) : null}
                <br />
                <strong>Time Taken:</strong> {reportData.timeTaken}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#222' }}>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Q#</th>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Question</th>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Your Answer</th>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Correct Answer</th>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Marks</th>
                    <th style={{ padding: '6px', border: '1px solid #333' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.results.map((q, idx) => (
                    <tr key={q.question_id}>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{idx + 1}</td>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{q.question_text}</td>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{q.question_type === 'NAT' ? (q.user_nat_answer ?? '-') : (q.user_selected_options_text?.join(', ') || '-')}</td>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{q.question_type === 'NAT' ? (q.correct_nat_answer ?? '-') : (q.correct_options_text?.join(', ') || '-')}</td>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{q.marks_obtained} / {q.total_marks_possible}</td>
                      <td style={{ padding: '6px', border: '1px solid #333' }}>{q.is_correct ? <span style={{ color: '#4CAF50' }}>Correct</span> : (q.has_user_answered ? <span style={{ color: '#ff6b6b' }}>Incorrect</span> : <span style={{ color: '#ccc' }}>Unanswered</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;

// Modal component for reuse
function Modal({ onClose, title, children }) {
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#222",
          borderRadius: "10px",
          padding: "30px",
          minWidth: "350px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "1.5rem",
              cursor: "pointer",
              marginLeft: "10px",
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div style={{ marginTop: "20px" }}>{children}</div>
      </div>
    </div>
  );
}

// QuestionBuilder component
function QuestionBuilder({ questions = [], onQuestionsChange }) {
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [current, setCurrent] = useState({
    text: "",
    options: ["", ""],
    correct: 0,
  });
  const [editIdx, setEditIdx] = useState(null);

  // Sync localQuestions with prop
  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  // Add or update a question
  const saveQuestion = () => {
    if (!current.text.trim() || current.options.some((o) => !o.trim())) {
      alert("Fill question and all options");
      return;
    }
    let updated;
    if (editIdx !== null) {
      updated = localQuestions.map((q, i) =>
        i === editIdx
          ? {
              text: current.text,
              options: [...current.options],
              correct: current.correct,
            }
          : q
      );
    } else {
      updated = [
        ...localQuestions,
        {
          text: current.text,
          options: [...current.options],
          correct: current.correct,
        },
      ];
    }
    setLocalQuestions(updated);
    setCurrent({ text: "", options: ["", ""], correct: 0 });
    setEditIdx(null);
    onQuestionsChange(updated);
  };

  // Edit a question
  const editQuestion = (idx) => {
    const q = localQuestions[idx];
    setCurrent({
      text: q.text,
      options: [...q.options],
      correct: q.correct,
    });
    setEditIdx(idx);
  };

  // Delete a question
  const deleteQuestion = (idx) => {
    const updated = localQuestions.filter((_, i) => i !== idx);
    setLocalQuestions(updated);
    onQuestionsChange(updated);
    // If editing this question, reset form
    if (editIdx === idx) {
      setCurrent({ text: "", options: ["", ""], correct: 0 });
      setEditIdx(null);
    }
  };

  // Add an option to current question
  const addOption = () => {
    setCurrent((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  // Delete an option from current question
  const deleteOption = (idx) => {
    setCurrent((prev) => {
      const newOpts = prev.options.filter((_, i) => i !== idx);
      let newCorrect = prev.correct;
      if (idx === prev.correct) newCorrect = 0;
      else if (idx < prev.correct) newCorrect = prev.correct - 1;
      return { ...prev, options: newOpts, correct: newCorrect };
    });
  };

  // Update option text
  const updateOption = (idx, value) => {
    setCurrent((prev) => {
      const newOpts = prev.options.map((o, i) => (i === idx ? value : o));
      return { ...prev, options: newOpts };
    });
  };

  // Set correct answer
  const setCorrect = (idx) => {
    setCurrent((prev) => ({ ...prev, correct: idx }));
  };

  // Cancel editing
  const cancelEdit = () => {
    setCurrent({ text: "", options: ["", ""], correct: 0 });
    setEditIdx(null);
  };

  return (
    <div style={{ marginTop: "10px", marginBottom: "10px" }}>
      <h4 style={{ margin: "10px 0" }}>Questions</h4>
      {localQuestions.length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          {localQuestions.map((q, idx) => (
            <div
              key={idx}
              style={{
                background: "#222",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                Q{idx + 1}: {q.text}
              </div>
              <ul style={{ margin: "5px 0 0 0", padding: 0, listStyle: "none" }}>
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    style={{
                      color: i === q.correct ? "#4CAF50" : "#fff",
                      fontWeight: i === q.correct ? "bold" : "normal",
                    }}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                    {i === q.correct && " (Correct)"}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => editQuestion(idx)}
                style={{
                  marginTop: "5px",
                  marginRight: "8px",
                  background: "#FFC107",
                  color: "#222",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => deleteQuestion(idx)}
                style={{
                  marginTop: "5px",
                  background: "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Question */}
      <div
        style={{
          background: "#222",
          borderRadius: "8px",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Question"
          value={current.text}
          onChange={(e) => setCurrent((prev) => ({ ...prev, text: e.target.value }))}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "none",
            marginBottom: "8px",
            fontSize: "1rem",
          }}
        />
        {current.options.map((opt, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
            <input
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "4px",
                border: "none",
                fontSize: "1rem",
              }}
            />
            <input
              type="radio"
              name="correct"
              checked={current.correct === idx}
              onChange={() => setCorrect(idx)}
              style={{ marginLeft: "8px" }}
              aria-label={`Mark option ${idx + 1} as correct`}
            />
            <span style={{ marginLeft: "4px", color: "#4CAF50" }}>
              {current.correct === idx ? "Correct" : ""}
            </span>
            {current.options.length > 2 && (
              <button
                type="button"
                onClick={() => deleteOption(idx)}
                style={{
                  marginLeft: "8px",
                  background: "#ff6b6b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
                aria-label={`Delete option ${idx + 1}`}
              >
                Delete
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          style={{
            marginTop: "5px",
            background: "#2196F3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Add Option
        </button>
        <button
          type="button"
          onClick={saveQuestion}
          style={{
            marginTop: "5px",
            marginLeft: "10px",
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {editIdx !== null ? "Update Question" : "Add Question"}
        </button>
        {editIdx !== null && (
          <button
            type="button"
            onClick={cancelEdit}
            style={{
              marginTop: "5px",
              marginLeft: "10px",
              background: "#888",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}