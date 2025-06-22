// src/pages/SolutionsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ReportPage.module.css"; // CSS Module

const SolutionsPage = () => {
  const navigate = useNavigate();
  const { testId } = useParams(); // Get testId from URL params
  const [solutions, setSolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testInfo, setTestInfo] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchSolutions = async () => {
      try {
        const sessionId = localStorage.getItem("lastTestSessionId");

        if (!sessionId) {
          setError("Test Session ID not found.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/solutions/${sessionId}`);
        if (!response.ok) throw new Error("Failed to fetch solutions.");

        const data = await response.json();
        setSolutions(data || []);
        
        // Fetch test information if available
        try {
          const testResponse = await fetch(`http://localhost:5000/api/results/${user.id}/${sessionId}`);
          if (testResponse.ok) {
            const testData = await testResponse.json();
            setTestInfo(testData);
          }
        } catch (err) {
          console.log("Could not fetch test info:", err);
        }
      } catch (err) {
        console.error("Error fetching solutions:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutions();
  }, [navigate, testId]);

  const handleBackToDashboard = () => {
    // Check if this window was opened by another window
    if (window.opener) {
      // If the main window exists, ensure it's on the dashboard
      if (!window.opener.closed) {
        window.opener.location.href = '/dashboard';
      }
      // Close the current window
      window.close();
    } else {
      // If opened directly (not as a popup), just navigate
      navigate('/dashboard');
    }
  };

  const formatUserAnswer = (question, userAnswer) => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return "Not Answered";
    }

    if (question.type === "NAT") {
      return userAnswer;
    }

    if (question.type === "MSQ") {
      const selectedOptions = Array.isArray(userAnswer) 
        ? userAnswer.map(optId => 
            question.options.find(opt => opt.option_id === parseInt(optId))?.option_text
          ).filter(Boolean)
        : [];
      return selectedOptions.length > 0 ? selectedOptions.join(", ") : "Not Answered";
    }

    // MCQ
    const selectedOption = question.options.find(opt => opt.option_id === parseInt(userAnswer));
    return selectedOption ? selectedOption.option_text : "Not Answered";
  };

  const formatCorrectAnswer = (question) => {
    if (question.type === "NAT") {
      return question.correct_nat_answer || "Not specified";
    }

    if (question.type === "MSQ") {
      const correctOptions = question.options.filter(opt => opt.is_correct_option);
      return correctOptions.length > 0 
        ? correctOptions.map(opt => opt.option_text).join(", ")
        : "Not specified";
    }

    // MCQ
    const correctOption = question.options.find(opt => opt.is_correct_option);
    return correctOption ? correctOption.option_text : "Not specified";
  };

  const isAnswerCorrect = (question, userAnswer) => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return false;
    }

    if (question.type === "NAT") {
      return userAnswer === question.correct_nat_answer;
    }

    if (question.type === "MSQ") {
      const userSelectedIds = Array.isArray(userAnswer) 
        ? userAnswer.map(id => parseInt(id)).sort()
        : [];
      const correctIds = question.options
        .filter(opt => opt.is_correct_option)
        .map(opt => opt.option_id)
        .sort();
      return JSON.stringify(userSelectedIds) === JSON.stringify(correctIds);
    }

    // MCQ
    const correctOptionId = question.options.find(opt => opt.is_correct_option)?.option_id;
    return parseInt(userAnswer) === correctOptionId;
  };

  if (isLoading) return <div className={styles.loading}>Loading solutions...</div>;
  if (error) return <div className={styles.loading}>Error: {error}</div>;
  if (!solutions.length) return <div className={styles.loading}>No solutions available.</div>;

  return (
    <div className={styles.reportContainer}>
      <h2 className={styles.mainHeading}>Detailed Solutions</h2>
      
      {testInfo && (
        <div className={styles.testInfo}>
          <h3 className={styles.subHeading}>Test Information</h3>
          <p><strong>Total Questions:</strong> {solutions.length}</p>
          <p><strong>Total Marks:</strong> {solutions.reduce((sum, q) => sum + q.marks, 0)}</p>
        </div>
      )}

      {solutions.map((question, index) => {
        const userAnswer = formatUserAnswer(question, question.user_answer);
        const correctAnswer = formatCorrectAnswer(question);
        const isCorrect = isAnswerCorrect(question, question.user_answer);
        const hasAnswered = question.user_answer && 
          (Array.isArray(question.user_answer) ? question.user_answer.length > 0 : true);

        return (
          <div key={question.question_id} className={styles.solutionItem}>
            <div className={styles.questionHeader}>
              <h4 className={styles.questionHeading}>
                Question {index + 1}: {question.question_text}
              </h4>
              <div className={styles.questionMeta}>
                <span className={styles.questionType}>{question.type}</span>
                <span className={styles.questionMarks}>Marks: {question.marks}</span>
              </div>
            </div>

            {/* Options for MCQ/MSQ */}
            {question.type !== "NAT" && question.options && question.options.length > 0 && (
              <div className={styles.optionsSection}>
                <h5 className={styles.sectionTitle}>Options:</h5>
                <ul className={styles.solutionOptionsList}>
                  {question.options.map((option, optIndex) => {
                    const isUserSelected = question.type === "MSQ"
                      ? Array.isArray(question.user_answer) && 
                        question.user_answer.includes(option.option_id.toString())
                      : parseInt(question.user_answer) === option.option_id;

                    const isCorrectOption = option.is_correct_option;

                    let liClassName = "";
                    if (isUserSelected && isCorrectOption) {
                      liClassName = styles.userCorrect;
                    } else if (isUserSelected && !isCorrectOption) {
                      liClassName = styles.userIncorrect;
                    } else if (!isUserSelected && isCorrectOption) {
                      liClassName = styles.correctMissing;
                    }

                    return (
                      <li key={option.option_id} className={liClassName}>
                        <span className={styles.optionLabel}>
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className={styles.optionText}>{option.option_text}</span>
                        {isUserSelected && (
                          <span className={styles.userChoice}>Your Answer</span>
                        )}
                        {isCorrectOption && !isUserSelected && (
                          <span className={styles.correctAnswerLabel}>Correct Answer</span>
                        )}
                        {isUserSelected && isCorrectOption && (
                          <span className={styles.bothCorrect}>Correct ✓</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Answer Summary */}
            <div className={styles.answerSummary}>
              <h5 className={styles.sectionTitle}>Answer Summary:</h5>
              <div className={styles.answerGrid}>
                <div className={styles.answerItem}>
                  <strong>Your Answer:</strong>
                  <span className={hasAnswered ? styles.userAnswer : styles.notAnswered}>
                    {userAnswer}
                  </span>
                </div>
                <div className={styles.answerItem}>
                  <strong>Correct Answer:</strong>
                  <span className={styles.correctAnswer}>{correctAnswer}</span>
                </div>
                <div className={styles.answerItem}>
                  <strong>Status:</strong>
                  <span className={isCorrect ? styles.correct : styles.incorrect}>
                    {isCorrect ? 'Correct' : (hasAnswered ? 'Incorrect' : 'Unanswered')}
                  </span>
                </div>
                <div className={styles.answerItem}>
                  <strong>Marks:</strong>
                  <span className={isCorrect ? styles.correct : styles.incorrect}>
                    {isCorrect ? question.marks : 0} / {question.marks}
                  </span>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div className={styles.solutionExplanation}>
              <h5 className={styles.sectionTitle}>Solution:</h5>
              <p className={styles.solutionText}>
                {question.solution || 'No solution provided for this question.'}
              </p>
            </div>
          </div>
        );
      })}

      <button
        className={styles.viewSolutionsBtn}
        onClick={handleBackToDashboard}
        style={{ marginTop: "20px" }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default SolutionsPage;
