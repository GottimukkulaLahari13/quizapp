// src/pages/PerformanceReport.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ReportPage.module.css";

const PerformanceReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id;
        const sessionId = localStorage.getItem("lastTestSessionId");

        if (!userId || !sessionId) {
          setError("User not logged in or no session found.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/results/${userId}/${sessionId}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Failed to fetch report.");
        }

        const data = await response.json();
        setReport({
          testSessionId: data.testSessionId,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswersCount,
          incorrectAnswers: data.incorrectAnswersCount,
          unansweredQuestions: data.unansweredQuestionsCount,
          score: data.overallScore,
          timeTaken: data.timeTaken || "00:00:00",
          totalMarksObtained: data.totalMarksObtained,
          negativeMarks: data.negativeMarks,
          rightMarks: data.rightMarks,
          maxMarks: data.maxMarks || 300,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.loading}>Error: {error}</div>;
  if (!report) return <div className={styles.loading}>No report found.</div>;

  const totalAttempted = report.correctAnswers + report.incorrectAnswers;
  const leftQuestions = report.totalQuestions - totalAttempted;

  return (
    <div className={styles.reportContainer}>
      <h2 className={styles.mainHeading}>Mock Test Report</h2>

      <table className={styles.performanceTable}>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Total Questions</td><td>{report.totalQuestions}</td></tr>
          <tr><td>Maximum Marks</td><td>{report.maxMarks}</td></tr>
          <tr><td>Total Attempted</td><td>{totalAttempted}</td></tr>
          <tr><td>Left Questions</td><td>{leftQuestions}</td></tr>
          <tr><td>Correct Questions</td><td>{report.correctAnswers}</td></tr>
          <tr><td>Incorrect Questions</td><td>{report.incorrectAnswers}</td></tr>
          <tr><td>Total Time (in min.)</td><td>180</td></tr>
          <tr><td>Time Taken</td><td>{report.timeTaken}</td></tr>
          <tr><td>Right Marks</td><td>{report.rightMarks || 0}</td></tr>
          <tr><td>Negative Marks</td><td>{report.negativeMarks || 0}</td></tr>
          <tr>
            <td><strong>Total Marks</strong></td>
            <td><strong>{report.totalMarksObtained || 0}</strong></td>
          </tr>
        </tbody>
      </table>

      <button
        className={styles.viewSolutionsBtn}
        onClick={() => navigate("/solutions/101")}
      >
        View Solutions
      </button>
    </div>
  );
};

export default PerformanceReport;
