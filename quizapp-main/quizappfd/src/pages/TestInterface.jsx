import React, { useState } from "react";
import { useParams } from "react-router-dom";

const mockTest = {
  title: "GATE 2025 Mock Test",
  sections: [
    {
      name: "Section 1 - MCQ",
      type: "MCQ",
      questions: [
        { id: 1, question: "Capital of India?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], answer: 1 },
        { id: 2, question: "Largest planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], answer: 2 },
        { id: 3, question: "HTML stands for?", options: ["Hyper Transfer", "HyperText Markup Language", "HighText", "None"], answer: 1 },
        { id: 4, question: "CSS used for?", options: ["Styling", "Structure", "Logic", "Database"], answer: 0 },
        { id: 5, question: "React is?", options: ["Framework", "Library", "Language", "IDE"], answer: 1 }
      ]
    },
    {
      name: "Section 2 - NAT",
      type: "NAT",
      questions: [
        { id: 6, question: "Square root of 81?", answer: "9" },
        { id: 7, question: "5 * 6?", answer: "30" },
        { id: 8, question: "Value of π (2 decimals)?", answer: "3.14" },
        { id: 9, question: "Speed of light (in 10^8 m/s)?", answer: "3" },
        { id: 10, question: "100 / 4?", answer: "25" }
      ]
    }
  ]
};

const TestInterface = () => {
  const { testId } = useParams();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState({});

  const section = mockTest.sections[sectionIndex];
  const question = section.questions[questionIndex];

  const handleAnswerChange = (val) => {
    setAnswers({ ...answers, [question.id]: val });
  };

  const handleSubmit = () => {
    alert("Test submitted successfully!");
  };

  const toggleReviewMark = () => {
    setReviewMarked(prev => ({
      ...prev,
      [question.id]: !prev[question.id]
    }));
  };

  const getQuestionStatusColor = (qId) => {
    if (reviewMarked[qId]) return "#9c27b0"; // Purple for review
    if (answers[qId] !== undefined && answers[qId] !== "") return "#4caf50"; // Green for answered
    return "#f44336"; // Red for unanswered
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Main Left Side */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto", backgroundColor: "#f5f5f5" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Section Buttons */}
          <div style={{ marginBottom: 20 }}>
            {mockTest.sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSectionIndex(idx);
                  setQuestionIndex(0);
                }}
                style={{
                  marginRight: 10,
                  padding: "8px 16px",
                  backgroundColor: idx === sectionIndex ? "#1976d2" : "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                {sec.name}
              </button>
            ))}
          </div>

          {/* Question Box */}
          <div style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
            <h3>{mockTest.title}</h3>
            <h4>{section.name}</h4>
            <p style={{ fontSize: "18px", fontWeight: "500" }}>
              <strong>Q{questionIndex + 1}:</strong> {question.question}
            </p>

            {/* Options */}
            {section.type === "MCQ" ? (
              question.options.map((opt, idx) => (
                <div key={idx} style={{ marginBottom: 10 }}>
                  <label>
                    <input
                      type="radio"
                      name={`q${question.id}`}
                      checked={answers[question.id] === idx}
                      onChange={() => handleAnswerChange(idx)}
                      style={{ marginRight: 8 }}
                    />
                    {opt}
                  </label>
                </div>
              ))
            ) : (
              <div>
                <input
                  type="text"
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  style={{ padding: "8px", width: "200px", marginBottom: "10px" }}
                />
                <div>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ".", "C"].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === "C") handleAnswerChange("");
                        else handleAnswerChange((answers[question.id] || "") + key);
                      }}
                      style={{ width: 40, height: 40, margin: 5 }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mark for Review */}
            <div style={{ marginTop: 15 }}>
              <label>
                <input
                  type="checkbox"
                  checked={reviewMarked[question.id] || false}
                  onChange={toggleReviewMark}
                  style={{ marginRight: 8 }}
                />
                Mark for Review
              </label>
            </div>

            {/* Navigation Buttons */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setQuestionIndex(Math.max(questionIndex - 1, 0))}
                disabled={questionIndex === 0}
                style={{
                  padding: "8px 16px",
                  marginRight: 10,
                  backgroundColor: "#ccc",
                  border: "none",
                  cursor: questionIndex === 0 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setQuestionIndex(Math.min(questionIndex + 1, section.questions.length - 1))
                }
                disabled={questionIndex === section.questions.length - 1}
                style={{
                  padding: "8px 16px",
                  marginRight: 10,
                  backgroundColor: "#ccc",
                  border: "none",
                  cursor:
                    questionIndex === section.questions.length - 1 ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "green",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Save & Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Question Palette */}
      <div
        style={{
          width: 200,
          backgroundColor: "#e0e0e0",
          padding: 10,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <h4 style={{ marginBottom: 10 }}>Questions</h4>
        {section.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setQuestionIndex(i)}
            style={{
              margin: "5px 0",
              backgroundColor: getQuestionStatusColor(q.id),
              color: "#fff",
              borderRadius: "50%",
              width: 40,
              height: 40,
              border: "none",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {i + 1}
          </button>
        ))}

        <div style={{ marginTop: 20, fontSize: 12, textAlign: "left", width: "100%" }}>
          <div><span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "#4caf50", marginRight: 5 }}></span> Answered</div>
          <div><span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "#f44336", marginRight: 5 }}></span> Unanswered</div>
          <div><span style={{ display: "inline-block", width: 12, height: 12, backgroundColor: "#9c27b0", marginRight: 5 }}></span> Review</div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
