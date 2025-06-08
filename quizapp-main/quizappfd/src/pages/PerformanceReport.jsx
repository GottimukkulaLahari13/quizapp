import React, { useState, useEffect } from "react";
// Removed useParams because testId is no longer part of the URL route
import { useNavigate } from "react-router-dom";
import "./ReportPage.module.css"; // Ensure this path is correct for your CSS module

const PerformanceReport = () => {
  // Removed const { testId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSolutions, setShowSolutions] = useState(false); // New state for toggling view

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user ? user.id : null;

        const lastTestSessionId = localStorage.getItem('lastTestSessionId');

        console.log("Frontend: Fetching report with:");
        console.log("  userId:", userId);
        console.log("  testSessionId:", lastTestSessionId);
        // Removed console.log for testId

        if (!userId) {
          setError("User not logged in. Cannot fetch performance report.");
          setIsLoading(false);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!lastTestSessionId) {
          setError("No recent test session found to generate a report. Please complete a test first.");
          setIsLoading(false);
          return;
        }

        // *** CRITICAL FIX: The fetch URL MUST MATCH THE BACKEND ROUTE EXACTLY ***
        // Backend route is: /api/results/:userId/:testSessionId
        const response = await fetch(`http://localhost:5000/api/results/${userId}/${lastTestSessionId}`);
        // ********************************************

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server.' }));
          throw new Error(errorData.message || "Failed to fetch performance report. Server responded with an error.");
        }

        const data = await response.json();
        if (!data || !data.results || !Array.isArray(data.results)) {
          throw new Error("Invalid report data structure received from server. Expected an array of results.");
        }

        setReport({
            testSessionId: data.testSessionId,
            totalQuestions: data.totalQuestions,
            correctAnswers: data.correctAnswersCount,
            incorrectAnswers: data.incorrectAnswersCount,
            unansweredQuestions: data.unansweredQuestionsCount,
            score: data.overallScore,
            questionResults: data.results
        });

      } catch (err) {
        console.error("Error fetching performance report:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Removed testId from dependencies array as it's no longer used or passed
    fetchReport();
  }, [navigate]);

  if (isLoading) {
    return <div className="report-container loading">Loading performance report...</div>;
  }

  if (error) {
    return (
      <div className="report-container error-message">
        <h2>Error Loading Report</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">Go to Home</button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-container no-data">
        <h2>No Performance Report Available</h2>
        <p>It seems there's no report for this session. Please ensure you've completed a test.</p>
        <button onClick={() => navigate('/')} className="back-button">Go to Home</button>
      </div>
    );
  }

  // Helper function to render options (for Solutions Page)
  const renderOptions = (question) => {
    if (question.question_type === 'MCQ' || question.question_type === 'MSQ') {
      const allOptions = question.options || [];
      return (
        <ul>
          {allOptions.map(option => (
            <li
              key={option.option_id}
              style={{
                color: option.is_correct ? 'green' : 'inherit',
                fontWeight: option.is_correct ? 'bold' : 'normal'
              }}
            >
              {option.option_text} {option.is_correct && '(Correct)'}
            </li>
          ))}
        </ul>
      );
    }
    return null;
  };

  return (
    <div className="performance-report-page">
      <div className="report-navigation-buttons">
        <button
          onClick={() => setShowSolutions(false)}
          className={!showSolutions ? "active-button" : ""}
        >
          View Performance Report
        </button>
        <button
          onClick={() => setShowSolutions(true)}
          className={showSolutions ? "active-button" : ""}
        >
          View Solutions
        </button>
        <button onClick={() => navigate('/')} className="back-button">Go to Home</button>
      </div>

      {/* --- Performance Report View --- */}
      {!showSolutions && (
        <>
          <div className="report-header">
            <h1>Performance Report</h1>
            <p>Session ID: {report.testSessionId || 'N/A'}</p>
            <p>Total Questions in Test: {report.totalQuestions}</p>
            <p>Questions Correctly Answered: {report.correctAnswers}</p>
            <p>Questions Incorrectly Answered: {report.incorrectAnswers}</p>
            <p>Questions Unanswered: {report.unansweredQuestions}</p>
            {/* FIX APPLIED HERE: Added conditional check for report.score */}
            <p>Overall Score: {report.score !== undefined && report.score !== null ? `${report.score.toFixed(2)}%` : 'N/A'}</p>
          </div>

          <div className="report-details">
            <h2>Question-wise Analysis</h2>
            {report.questionResults && report.questionResults.length > 0 ? (
              <table className="question-analysis-table">
                <thead>
                  <tr>
                    <th>Q No.</th>
                    <th>Question Text</th>
                    <th>Your Answer</th>
                    <th>Correct Answer</th>
                    <th>Status</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {report.questionResults.map((qr, index) => (
                    <tr key={qr.question_id}>
                      <td>{index + 1}</td>
                      <td>{qr.question_text}</td>
                      <td>
                        {qr.has_user_answered ? (
                          qr.question_type === 'NAT' ? qr.user_nat_answer :
                          (Array.isArray(qr.user_selected_options_text) ? qr.user_selected_options_text.join(', ') : qr.user_selected_options_text || 'N/A')
                        ) : 'Not Answered'}
                      </td>
                      <td>
                        {qr.question_type === 'NAT' ? qr.correct_nat_answer :
                          (Array.isArray(qr.correct_options_text) ? qr.correct_options_text.join(', ') : qr.correct_options_text || 'N/A')}
                      </td>
                      <td className={qr.has_user_answered ? (qr.is_correct ? 'status-correct' : 'status-incorrect') : 'status-unanswered'}>
                        {qr.has_user_answered ? (qr.is_correct ? 'Correct' : 'Incorrect') : 'Unanswered'}
                      </td>
                      <td>{qr.marks_obtained !== undefined ? qr.marks_obtained : 'N/A'} / {qr.total_marks_possible || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No detailed question analysis available.</p>
            )}
          </div>
        </>
      )}

      {/* --- Solutions Page View --- */}
      {showSolutions && (
        <div className="solutions-page">
          <h1>Solutions for Test</h1>
          {report.questionResults && report.questionResults.length > 0 ? (
            report.questionResults.map((qr, index) => (
              <div key={qr.question_id} className="solution-item">
                <h3>Q {index + 1}: {qr.question_text}</h3>
                {qr.question_type !== 'NAT' && (
                    <div className="options-list">
                        <h4>Options:</h4>
                        <ul>
                            {qr.options && qr.options.length > 0 ? (
                                qr.options.map(option => (
                                    <li key={option.option_id} className={option.is_correct ? 'correct-option' : ''}>
                                        {option.option_text} {option.is_correct && '(Correct Answer)'}
                                    </li>
                                ))
                            ) : (
                                <li>No options available.</li>
                            )}
                        </ul>
                    </div>
                )}
                {qr.question_type === 'NAT' && (
                    <p><strong>Correct Answer:</strong> {qr.correct_nat_answer}</p>
                )}
                <p><strong>Your Answer:</strong> {qr.has_user_answered ? (qr.question_type === 'NAT' ? qr.user_nat_answer : (Array.isArray(qr.user_selected_options_text) ? qr.user_selected_options_text.join(', ') : qr.user_selected_options_text)) : 'Not Answered'}</p>
                <p><strong>Status:</strong> {qr.has_user_answered ? (qr.is_correct ? 'Correct' : 'Incorrect') : 'Unanswered'}</p>
                <p><strong>Solution:</strong> {qr.solution || 'No solution provided.'}</p>
              </div>
            ))
          ) : (
            <p>No questions found for solutions.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceReport;