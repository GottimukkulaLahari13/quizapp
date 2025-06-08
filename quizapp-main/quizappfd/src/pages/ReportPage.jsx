// src/pages/ReportPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from "./ReportPage.module.css"; // Import as a module

const ReportPage = () => {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [allQuestions, setAllQuestions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Create a ref for the scrollable container
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (location.state) {
      setAnswers(location.state.answers || {});
      setReview(location.state.review || {});
      setAllQuestions(location.state.allQuestions || []);
      setLoaded(true);
    } else {
      alert("No test data found. Please complete a test first.");
      navigate("/");
    }
  }, [location.state, navigate]);

  // Enhanced useEffect for scrolling
  useEffect(() => {
    // Ensure data is loaded AND the ref to the DOM element is available
    if (loaded && scrollContainerRef.current) {
      // Use setTimeout with 0ms to defer until after browser paint cycle.
      setTimeout(() => {
        scrollContainerRef.current.scrollTo({
          top: 0,
          behavior: "instant", // Use 'instant' for immediate jump to top
        });
        console.log("Scrolling .full-page-scroll-container to top.");
      }, 0); // Defer to the next event loop tick
    }
  }, [loaded, allQuestions]);

  const calculateScore = () => {
    let totalMarks = 0;
    let marksObtained = 0;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;
    let notAttemptedCount = 0;

    allQuestions.forEach((q) => {
      totalMarks += q.marks;
      const userAnswer = answers[q.question_id];

      const answered =
        q.type === "MSQ"
          ? Array.isArray(userAnswer) && userAnswer.length > 0
          : userAnswer !== undefined && userAnswer !== null && userAnswer !== "";

      if (!answered) {
        notAttemptedCount++;
      } else {
        let isCorrect = false;

        if (q.type === "MCQ") {
          isCorrect = userAnswer === q.correct_answer;
        } else if (q.type === "MSQ") {
          const sortedUser = [...(userAnswer || [])].sort();
          const sortedCorrect = [...(q.correct_answer || [])].sort();
          isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
        } else if (q.type === "NAT") {
          const userNum = parseFloat(userAnswer);
          const correctNum = parseFloat(q.correct_answer);
          isCorrect =
            !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.0001;
        }

        if (isCorrect) {
          marksObtained += q.marks;
          correctAnswersCount++;
        } else {
          marksObtained -= q.negative_marks || 0;
          incorrectAnswersCount++;
        }
      }
    });

    return {
      totalMarks,
      marksObtained,
      correctAnswersCount,
      incorrectAnswersCount,
      notAttemptedCount,
      totalQuestions: allQuestions.length,
    };
  };

  const scoreReport = calculateScore();

  const isSolutionsPage = location.pathname.includes("/solutions/");

  return (
    <div className={styles.reportPageContainer}> {/* New wrapper for page-specific font */}
      <div ref={scrollContainerRef} className={styles.fullPageScrollContainer}>
        {!loaded ? (
          <div className={`${styles.reportContainer} ${styles.loading}`}>
            Loading report data...
            <p>If you landed here directly, please complete a test first.</p>
          </div>
        ) : (
          <div className={styles.reportContainer}>
            {!isSolutionsPage && (
              <>
                <h2 className={styles.mainHeading}>Test Report - {testId}</h2>
                <div className={styles.performanceReport}>
                  <h3 className={styles.subHeading}>Your Performance Summary</h3>
                  <table className={styles.performanceTable}>
                    <tbody>
                      <tr>
                        <td>Total Questions</td>
                        <td>{scoreReport.totalQuestions}</td>
                      </tr>
                      <tr>
                        <td>Attempted Questions</td>
                        <td>{scoreReport.correctAnswersCount + scoreReport.incorrectAnswersCount}</td>
                      </tr>
                      <tr>
                        <td>Correct Answers</td>
                        <td className={styles.correct}>{scoreReport.correctAnswersCount}</td>
                      </tr>
                      <tr>
                        <td>Incorrect Answers</td>
                        <td className={styles.incorrect}>{scoreReport.incorrectAnswersCount}</td>
                      </tr>
                      <tr>
                        <td>Not Attempted</td>
                        <td>{scoreReport.notAttemptedCount}</td>
                      </tr>
                      <tr>
                        <td>Total Marks</td>
                        <td>{scoreReport.totalMarks.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Marks Obtained</td>
                        <td className={styles.obtained}>{scoreReport.marksObtained.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <button
                    className={styles.viewSolutionsBtn}
                    onClick={() =>
                      navigate(`/solutions/${testId}`, {
                        state: { answers, review, allQuestions },
                      })
                    }
                  >
                    View Detailed Solutions
                  </button>
                </div>
              </>
            )}

            {isSolutionsPage && (
              <div className={styles.solutionsPage}>
                <h2 className={styles.mainHeading}>Detailed Solutions - {testId}</h2>
                {allQuestions.map((q, index) => {
                  const userAnswer = answers[q.question_id];
                  const isUserAnswered =
                    q.type === "MSQ"
                      ? Array.isArray(userAnswer) && userAnswer.length > 0
                      : userAnswer !== undefined && userAnswer !== null && userAnswer !== "";

                  let userStatus = "";
                  if (isUserAnswered) {
                    if (q.type === "MCQ") {
                      userStatus = userAnswer === q.correct_answer ? "userCorrect" : "userIncorrect";
                    } else if (q.type === "MSQ") {
                      const sortedUser = [...(userAnswer || [])].sort();
                      const sortedCorrect = [...(q.correct_answer || [])].sort();
                      const isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
                      userStatus = isCorrect ? "userCorrect" : "userIncorrect";
                    } else if (q.type === "NAT") {
                      const userNum = parseFloat(userAnswer);
                      const correctNum = parseFloat(q.correct_answer);
                      const isCorrect =
                        !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.0001;
                      userStatus = isCorrect ? "userCorrect" : "userIncorrect";
                    }
                  }

                  return (
                    <div key={q.question_id} className={styles.solutionItem}>
                      <h4 className={styles.questionHeading}>Q{index + 1}:</h4>
                      <p className={styles.questionText}>{q.question_text}</p>

                      {(q.type === "MCQ" || q.type === "MSQ") && (
                        <ul className={styles.solutionOptionsList}>
                          {q.options &&
                            q.options.map((option, optIndex) => {
                              const isCorrectOption = Array.isArray(q.correct_answer)
                                ? q.correct_answer.includes(option)
                                : q.correct_answer === option;
                              const isUserSelected =
                                (Array.isArray(userAnswer) && userAnswer.includes(option)) ||
                                userAnswer === option;

                              let optionClass = "";
                              if (isCorrectOption && isUserSelected) {
                                optionClass = styles.userCorrect;
                              } else if (!isCorrectOption && isUserSelected) {
                                optionClass = styles.userIncorrect;
                              } else if (isCorrectOption && !isUserSelected) {
                                optionClass = styles.correctMissing;
                              }

                              return (
                                <li key={optIndex} className={optionClass}>
                                  <span className={styles.optionLabel}>{String.fromCharCode(65 + optIndex)}.</span>{" "}
                                  {option}
                                  {isUserSelected && <span className={styles.userChoice}>(Your Choice)</span>}
                                  {isCorrectOption && !isUserSelected && (
                                    <span className={styles.correctAnswerLabel}>(Correct)</span>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      )}

                      {q.type === "NAT" && (
                        <div className={styles.natSolutionSummary}>
                          <p>
                            Your Answer:{" "}
                            <span className={styles.userNatAnswer}>
                              {isUserAnswered ? userAnswer : "Not Answered"}
                              {isUserAnswered && userStatus === "userCorrect" && " (Correct)"}
                              {isUserAnswered && userStatus === "userIncorrect" && " (Incorrect)"}
                            </span>
                          </p>
                          <p>
                            Correct Answer: <span className={styles.correctNatAnswer}>{q.correct_answer}</span>
                          </p>
                        </div>
                      )}

                      {(q.type === "MCQ" || q.type === "MSQ") && (
                        <p>
                          <strong>Correct Answer: </strong>
                          {Array.isArray(q.correct_answer)
                            ? q.correct_answer
                                .map((ans) => q.options.find((opt) => opt === ans))
                                .filter(Boolean)
                                .join(", ")
                            : q.options.find((opt) => opt === q.correct_answer)}
                        </p>
                      )}

                      {(q.type === "MCQ" || q.type === "MSQ") && (
                        <p>
                          <strong>Your Answer: </strong>
                          {isUserAnswered
                            ? Array.isArray(userAnswer)
                              ? userAnswer
                                  .map((ans) => q.options.find((opt) => opt === ans))
                                  .filter(Boolean)
                                  .join(", ")
                              : q.options.find((opt) => opt === userAnswer)
                            : "Not Answered"}
                        </p>
                      )}

                      {q.solution && (
                        <div className={styles.solutionExplanation}>
                          <h5 className={styles.solutionHeading}>Solution:</h5>
                          <p>{q.solution}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;