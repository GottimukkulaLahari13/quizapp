// src/pages/ReportPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ReportPage.module.css"; // Import as a module

const ReportPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const testSessionId = localStorage.getItem("lastTestSessionId");

      if (!user || !testSessionId) {
        setError("User or test session not found. Please log in and complete a test.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/results/${user.id}/${testSessionId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch report.");
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [testId]);

  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading your report...</div>;
  }

  if (error) {
    return <div className={`${styles.loadingContainer} ${styles.errorContainer}`}>Error: {error}</div>;
  }

  if (!reportData) {
    return <div className={styles.loadingContainer}>No report data available.</div>;
  }

  const {
    totalQuestions,
    correctAnswersCount,
    incorrectAnswersCount,
    unansweredQuestionsCount,
    totalMarksObtained,
    maxMarks,
    timeTaken,
    results,
    rightMarks,
    negativeMarks,
  } = reportData;

  const scorePercentage = maxMarks > 0 ? (totalMarksObtained / maxMarks) * 100 : 0;

  return (
    <div className={styles.reportPageContainer}>
      <div className={styles.reportContainer}>
        <h2 className={styles.mainHeading}>Test Results</h2>
        
        <div className={styles.summaryGrid}>
          <div className={styles.summaryBox}>
            <span className={styles.summaryValue}>{scorePercentage.toFixed(2)}%</span>
            <span className={styles.summaryLabel}>Score</span>
          </div>
          <div className={styles.summaryBox}>
            <span className={styles.summaryValue}>{totalQuestions}</span>
            <span className={styles.summaryLabel}>Total Questions</span>
          </div>
          <div className={styles.summaryBox}>
            <span className={styles.summaryValue}>{correctAnswersCount}</span>
            <span className={styles.summaryLabel}>Correct Answers</span>
          </div>
          <div className={styles.summaryBox}>
            <span className={styles.summaryValue}>{incorrectAnswersCount}</span>
            <span className={styles.summaryLabel}>Incorrect Answers</span>
          </div>
          <div className={styles.summaryBox}>
            <span className={styles.summaryValue}>{unansweredQuestionsCount}</span>
            <span className={styles.summaryLabel}>Unattempted</span>
          </div>
        </div>

        <div className={styles.performanceReport}>
          <h3 className={styles.subHeading}>Your Performance Summary</h3>
          <table className={styles.performanceTable}>
            <tbody>
              <tr>
                <td>Total Questions</td>
                <td>{totalQuestions}</td>
              </tr>
              <tr>
                <td>Attempted Questions</td>
                <td>{correctAnswersCount + incorrectAnswersCount}</td>
              </tr>
              <tr>
                <td>Correct Answers</td>
                <td className={styles.correct}>{correctAnswersCount}</td>
              </tr>
              <tr>
                <td>Incorrect Answers</td>
                <td className={styles.incorrect}>{incorrectAnswersCount}</td>
              </tr>
               <tr>
                <td>Marks for Correct Answers</td>
                <td className={styles.correct}>+{(typeof rightMarks === 'number' ? rightMarks : 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Negative Marks for Incorrect</td>
                <td className={styles.incorrect}>-{(typeof negativeMarks === 'number' ? negativeMarks : 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Net Score</td>
                <td className={styles.obtained}>{(typeof totalMarksObtained === 'number' ? totalMarksObtained : 0).toFixed(2)}</td>
              </tr>
               <tr>
                <td>Time Taken</td>
                <td className={styles.timeTaken}>{timeTaken}</td>
              </tr>
            </tbody>
          </table>
          <button
            className={styles.viewSolutionsBtn}
            onClick={() => navigate(`/solutions/${testId}`)}
          >
            View Detailed Solutions
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;