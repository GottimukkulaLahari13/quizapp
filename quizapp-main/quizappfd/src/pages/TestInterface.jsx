import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import "./TestInterface.css";

const TestInterface = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [section, setSection] = useState("MCQ");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [timer, setTimer] = useState(180 * 60);
  const [submitted, setSubmitted] = useState(false);

  // Generate a unique testSessionId for this attempt
  const [testSessionId] = useState(uuidv4());

  const sectionQuestions = useMemo(() => {
    const sections = { MCQ: [], MSQ: [], NAT: [] };
    allQuestions.forEach((q) => {
      if (sections[q.type]) sections[q.type].push(q);
    });
    return sections;
  }, [allQuestions]);

  const currentSectionQuestions = sectionQuestions[section] || [];
  const currentQuestion = currentSectionQuestions[currentIndex];

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5000/api/questions");
        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
        }
        const data = await response.json();
        setAllQuestions(data.questions);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit when timer reaches zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleNavigation = (step) => {
    const nextIndex = currentIndex + step;
    if (nextIndex >= 0 && nextIndex < currentSectionQuestions.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const handleMCQSelect = (optionId) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: optionId });
  };

  const handleMSQToggle = (optionId) => {
    // Ensure currentAns is an array before attempting to use includes
    const currentAns = Array.isArray(answers[currentQuestion.question_id])
      ? answers[currentQuestion.question_id]
      : [];
    const newAns = currentAns.includes(optionId)
      ? currentAns.filter((id) => id !== optionId)
      : [...currentAns, optionId];
    setAnswers({ ...answers, [currentQuestion.question_id]: newAns });
  };

  const handleNATChange = (e) => {
    setAnswers({ ...answers, [currentQuestion.question_id]: e.target.value });
  };

  const switchSection = (sec) => {
    setSection(sec);
    setCurrentIndex(0);
  };

  const handleMarkReview = () => {
    setReview({ ...review, [currentQuestion.question_id]: true });
    handleNavigation(1);
  };

  const handleSubmit = async () => {
    setSubmitted(true); // Indicate submission in progress

    // Get user ID from localStorage (assuming it's stored after login)
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userId = user ? user.id : null;

    if (!userId) {
      alert("User not logged in. Cannot submit answers. Please log in.");
      navigate('/login'); // Redirect to login
      return;
    }

    // Prepare answers for submission
    const answersToSubmit = Object.keys(answers).map(questionId => {
      // Ensure question_id is a number for backend
      const qIdNum = parseInt(questionId); 
      let userAnswer = answers[questionId];

      // If it's an MSQ and the answer is an array, join it into a comma-separated string
      // This might depend on your backend's expected format for MSQ answers.
      // If your backend expects an array, remove this conditional.
      if (Array.isArray(userAnswer)) {
        userAnswer = userAnswer.join(',');
      }

      return {
        question_id: qIdNum, 
        user_selected_option: userAnswer,
      };
    });

    try {
      const response = await fetch("http://localhost:5000/api/submit-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          testId: testId, // Pass testId from params, though not strictly used in current submit-answers logic
          testSessionId: testSessionId, // Unique ID for this test attempt
          userAnswers: answersToSubmit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit answers to backend.");
      }

      console.log("Answers submitted successfully to backend!");

      // Store testSessionId for subsequent report fetching (important!)
      localStorage.setItem("lastTestSessionId", testSessionId);
      // No need to store answers/questions in local storage for report as we'll fetch from backend
      
      navigate(`/performance-report/${testId}`); // Redirect to performance report
    } catch (submitError) {
      console.error("Error during answer submission:", submitError);
      alert(`Error submitting test: ${submitError.message}. Please try again.`);
      setSubmitted(false); // Allow user to try submitting again if failed
    }
  };

  const getStatusColor = (qId) => {
    const ans = answers[qId];
    const isMarked = review[qId];

    // If an answer exists, check if it's a non-empty array for MSQ or any value for MCQ/NAT
    const hasAnswered = (Array.isArray(ans) && ans.length > 0) || (!Array.isArray(ans) && ans !== undefined && ans !== null && ans !== '');

    if (!hasAnswered && !isMarked) return "gray"; // Not visited or not answered and not marked
    if (!hasAnswered && isMarked) return "orange"; // Marked for review but not answered
    if (hasAnswered && !isMarked) return "green"; // Answered and not marked for review
    if (hasAnswered && isMarked) return "blue"; // Answered and marked for review
    return "red"; // This case should ideally not be reached if conditions are exhaustive
  };

  if (isLoading)
    return <div className="loading-container">Loading questions...</div>;
  if (error) return <div className="loading-container error">Error: {error}</div>;

  if (submitted) {
    return (
      <div className="submission-success-block">
        <h2>Test Submitted Successfully!</h2>
        <p>You can now view your performance report or detailed solutions.</p>
        <div className="submission-buttons">
          <button
            className="btn-report"
            onClick={() => navigate(`/performance-report/${testId}`)}
          >
            View Performance Report
          </button>
          <button
            className="btn-solutions"
            onClick={() => navigate(`/solutions/${testId}`)}
          >
            View Solutions
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion)
    return <div className="loading-container">No questions in this section.</div>;

  return (
    <>
      <div className="test-interface">
        {/* Top Class Info and Question Types */}
        <div className="class-info-container">
          <div className="class-info">
            <h1>GATE EXAM-2025</h1>
          </div>
          <div className="question-types">
            {/* Highlight current section */}
            {["MCQ", "NAT", "MSQ"].map((type) => (
              <div
                key={type}
                className={`question-type ${
                  section === type ? "active-type" : ""
                }`}
                onClick={() => switchSection(type)}
                style={{ cursor: "pointer" }}
              >
                {type}
              </div>
            ))}
          </div>
          <div className="timer-container">
            <span className="timer-label">Time Remaining:</span>
            <span className="timer-value">{formatTime(timer)}</span>
          </div>
        </div>

        {/* Question and Options */}
        <div className="question-section">
          <div className="question-area">
            <h4>
              Question {currentIndex + 1} - {section}
            </h4>
            <p>{currentQuestion.question_text}</p>

            {currentQuestion.type === "MCQ" && (
              <ul className="options-list">
                {currentQuestion.options.map((opt) => (
                  <li key={opt.option_id}>
                    <label>
                      <input
                        type="radio"
                        name={`q-${currentQuestion.question_id}`}
                        checked={answers[currentQuestion.question_id] === opt.option_id}
                        onChange={() => handleMCQSelect(opt.option_id)}
                      />
                      {opt.option_text}
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {currentQuestion.type === "MSQ" && (
              <ul className="options-list">
                {currentQuestion.options.map((opt) => (
                  <li key={opt.option_id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          // Ensure answers[currentQuestion.question_id] is an array before calling includes
                          Array.isArray(answers[currentQuestion.question_id]) && 
                          answers[currentQuestion.question_id].includes(opt.option_id)
                        }
                        onChange={() => handleMSQToggle(opt.option_id)}
                      />
                      {opt.option_text}
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {currentQuestion.type === "NAT" && (
              <div className="nat-question-container">
                <input
                  type="text"
                  value={answers[currentQuestion.question_id] || ""}
                  onChange={handleNATChange}
                  placeholder="Enter numeric answer"
                  className="nat-input"
                />
                <div className="calculator-grid">
                  {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "-"].map(
                    (symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() =>
                          setAnswers({
                            ...answers,
                            [currentQuestion.question_id]:
                              (answers[currentQuestion.question_id] || "") + symbol,
                          })
                        }
                      >
                        {symbol}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setAnswers({
                        ...answers,
                        [currentQuestion.question_id]: "",
                      })
                    }
                  >
                    C
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar with Question Palette and Legend */}
        <div className="sidebar">
          <div className="palette-container">
            <div className="palette-section">
              {currentSectionQuestions.map((q, idx) => (
                <div
                  key={q.question_id}
                  className={`palette-item ${getStatusColor(q.question_id)} ${
                    idx === currentIndex ? "current" : ""
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            <div className="legend">
              <h4>Question Palette Symbols:</h4>
              <ul>
                <li>
                  <div className="legend-shape gray"></div> You have NOT visited the
                  question yet.
                </li>
                <li>
                  <div className="legend-shape red"></div> You have NOT answered the
                  question.
                </li>
                <li>
                  <div className="legend-shape green"></div> You have answered the
                  question.
                </li>
                <li>
                  <div className="legend-shape orange"></div> Marked for review, but
                  NOT answered.
                </li>
                <li>
                  <div className="legend-shape blue"></div> Answered and Marked for
                  review. Will be evaluated.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons fixed at bottom */}
      <div className="main-footer">
        <button
          className="nav-btn"
          onClick={() => handleNavigation(-1)}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button
          className="nav-btn"
          onClick={() => handleNavigation(1)}
          disabled={currentIndex >= currentSectionQuestions.length - 1}
        >
          Save & Next
        </button>
        <button className="review-btn" onClick={handleMarkReview}>
          Mark for Review & Next
        </button>
        <button className="submit-btn" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </>
  );
};

export default TestInterface;