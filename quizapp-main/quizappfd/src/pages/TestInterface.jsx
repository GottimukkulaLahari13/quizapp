import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const questionsData = {
  mcq: [
    {
      id: 1,
      type: "MCQ",
      question: "What does CPU stand for?",
      options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Processor Unit"],
      answer: 1,
      solution: "CPU stands for Central Processing Unit."
    },
    {
      id: 2,
      type: "MCQ",
      question: "Which of these is not an operating system?",
      options: ["Linux", "Windows", "Oracle", "MacOS"],
      answer: 2,
      solution: "Oracle is a database software, not an operating system."
    }
  ],
  nat: [
    {
      id: 3,
      type: "NAT",
      question: "What is the result of 2 + 2 * 2?",
      answer: "6",
      solution: "2 + 2 * 2 = 2 + 4 = 6"
    },
    {
      id: 4,
      type: "NAT",
      question: "Enter the decimal equivalent of binary 1010:",
      answer: "10",
      solution: "1010 in binary is 10 in decimal."
    }
  ]
};

const TestInterface = () => {
  const [section, setSection] = useState("mcq");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(180 * 60);
  const [submitted, setSubmitted] = useState(false);
  const { testId } = useParams();

  const questions = questionsData[section];

  useEffect(() => {
    // Fullscreen mode on load
    const enterFullscreen = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    };
    enterFullscreen();

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (value) => {
    setAnswers({ ...answers, [questions[currentIndex].id]: value });
  };

  const handleInputChange = (e) => {
    setAnswers({ ...answers, [questions[currentIndex].id]: e.target.value });
  };

  const handleReview = () => {
    setReview({ ...review, [questions[currentIndex].id]: true });
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResult(true);
  };

  const getStatusColor = (id) => {
    if (!answers[id] && !review[id]) return "gray";
    if (!answers[id] && review[id]) return "orange";
    if (answers[id] && !review[id]) return "green";
    if (answers[id] && review[id]) return "blue";
    return "red";
  };

  if (showResult) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Performance Report</h2>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Solution</th>
            </tr>
          </thead>
          <tbody>
            {[...questionsData.mcq, ...questionsData.nat].map((q) => (
              <tr key={q.id}>
                <td>{q.question}</td>
                <td>{answers[q.id] || "Not Answered"}</td>
                <td>{q.options ? q.options[q.answer] : q.answer}</td>
                <td>{q.solution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Left Side - Questions */}
      <div style={{ flex: 1, padding: 20, position: "relative" }}>
        <h2>GATE 2025 - Computer Science</h2>
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setSection("mcq")}>MCQ Section ({questionsData.mcq.length})</button>
          <button onClick={() => setSection("nat")}>NAT Section ({questionsData.nat.length})</button>
        </div>

        <div style={{ marginBottom: 100 }}>
          <h4>Q{currentIndex + 1}: {questions[currentIndex].question}</h4>
          {section === "mcq" ? (
            <ul>
              {questions[currentIndex].options.map((opt, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="radio"
                      name="option"
                      value={i}
                      checked={answers[questions[currentIndex].id] == i}
                      onChange={() => handleOptionSelect(i)}
                    /> {opt}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Enter your answer"
                value={answers[questions[currentIndex].id] || ""}
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons Fixed to Bottom */}
        <div style={{
          position: "absolute",
          bottom: 10,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          background: "#fff",
          paddingTop: 10,
          borderTop: "1px solid #ccc"
        }}>
          <button onClick={handlePrevious}>Previous</button>
          <button onClick={handleNext}>Save & Next</button>
          <button onClick={handleReview}>Mark for Review & Next</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      {/* Right Side - Profile and Palette */}
      <div style={{ width: 300, padding: 20, backgroundColor: "#f0f0f0", position: "relative" }}>
        <div style={{ float: "right" }}>
          <strong>Time Left:</strong> {formatTime(timer)}
        </div>
        <div style={{ marginTop: 60 }}>
          <h3>Profile</h3>
          <img
            src="/uploads/default.jpg"
            alt="Profile"
            style={{ width: 80, height: 80, borderRadius: "50%" }}
          />
          <h4>Question Palette</h4>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: getStatusColor(q.id),
                  color: "#fff",
                  margin: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <h5>Status Indicators</h5>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span><div style={dot("gray")} /> Not Visited</span>
              <span><div style={dot("red")} /> Not Answered</span>
              <span><div style={dot("green")} /> Answered</span>
              <span><div style={dot("orange")} /> Review Not Answered</span>
              <span><div style={dot("blue")} /> Review Answered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const dot = (color) => ({
  width: 20,
  height: 20,
  backgroundColor: color,
  display: "inline-block",
  marginRight: 5
});

export default TestInterface;
