import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import "./ReportPage.module.css";// Use your existing CSS

const SolutionPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [solutionsData, setSolutionsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSolutions = async () => {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user ? user.id : null;

      const testSessionId = localStorage.getItem('lastTestSessionId'); // Get the stored session ID

      if (!userId || !testSessionId) {
        setError("User ID or Test Session ID not found. Please log in and complete a test.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5000/api/results/${userId}/${testSessionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to load solutions from backend.");
        }
        const data = await response.json();
        setSolutionsData(data.results);
      } catch (err) {
        console.error("Error fetching solutions:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutions();
  }, [testId, navigate]);

  if (isLoading) {
    return <div className="loading-container">Loading solutions...</div>;
  }

  if (error) {
    return <div className="loading-container error">Error: {error}</div>;
  }

  if (!solutionsData || solutionsData.length === 0) {
    return <div className="loading-container">No solutions available for this test session.</div>;
  }

  return (
    <div className="solutions-wrapper">
      <h2>Detailed Solutions for Test: {testId}</h2>
      {solutionsData.map((q, index) => (
        <div key={q.question_id} className="solution-block">
          <p>
            <strong>Q{index + 1}:</strong> {q.question_text}
          </p>
          {q.question_type === 'MCQ' || q.question_type === 'MSQ' ? (
            <ul>
              {q.options?.map((opt) => ( // Access options from the fetched question object if available
                <li key={opt.option_id}
                  className={
                    (q.user_selected_options_text.includes(opt.option_text) && !opt.is_correct) ? 'user-incorrect' : // User selected and it's wrong
                    (q.correct_options_text.includes(opt.option_text) && !q.user_selected_options_text.includes(opt.option_text)) ? 'correct-unselected' : // Correct option not selected by user
                    (opt.is_correct ? 'correct-option' : '') // Just a correct option
                  }
                >
                  {opt.option_text}
                </li>
              ))}
            </ul>
          ) : null}

          <p>
            <strong>Your Answer:</strong>{" "}
            {q.question_type === 'MCQ' || q.question_type === 'MSQ'
              ? (q.user_selected_options_text.length > 0 ? q.user_selected_options_text.join(', ') : 'Not Answered')
              : (q.user_nat_answer || 'Not Answered')}
          </p>
          <p>
            <strong>Correct Answer:</strong>{" "}
            {q.question_type === 'MCQ' || q.question_type === 'MSQ'
              ? (q.correct_options_text.length > 0 ? q.correct_options_text.join(', ') : 'N/A')
              : (q.correct_nat_answer || 'N/A')}
          </p>
          <p className={q.is_correct ? 'text-success' : 'text-danger'}>
            Status: {q.is_correct ? 'Correct' : 'Incorrect'} ({q.marks_obtained} / {q.total_marks_possible} Marks)
          </p>
          <p>
            <strong>Solution:</strong> {q.solution || 'No solution provided.'}
          </p>
          <hr />
        </div>
      ))}
      <button className="submit-btn" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default SolutionPage;