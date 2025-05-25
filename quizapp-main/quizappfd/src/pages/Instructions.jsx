import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Instructions = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const { testId } = useParams();

  const handleStart = () => {
    if (accepted) {
      navigate(`/test-interface/${testId}`);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>Read the Following Instructions Carefully</h2>

      <h3>General Instructions:</h3>
      <ul>
        <li>Total duration of the examination is <strong>180 minutes</strong>.</li>
        <li>A scientific calculator is available on the top-right corner of the screen.</li>
        <li>
          The clock will be set at the server. A countdown timer on the top-right will show the remaining time.
        </li>
        <li>
          When the timer reaches zero, the exam will auto-submit. You don’t need to submit manually.
        </li>
      </ul>

      <h3>Question Palette Symbols:</h3>
      <ul>
        <li><span style={{ background: '#ccc', padding: '4px 8px', borderRadius: '4px' }}>Gray</span> – You have <strong>NOT visited</strong> the question yet.</li>
        <li><span style={{ background: '#f44336', padding: '4px 8px', color: 'white', borderRadius: '4px' }}>Red</span> – You have <strong>NOT answered</strong> the question.</li>
        <li><span style={{ background: '#4caf50', padding: '4px 8px', color: 'white', borderRadius: '4px' }}>Green</span> – You have <strong>answered</strong> the question.</li>
        <li><span style={{ background: '#ff9800', padding: '4px 8px', color: 'white', borderRadius: '4px' }}>Orange</span> – <strong>Marked for review</strong>, but <strong>NOT answered</strong>.</li>
        <li><span style={{ background: '#2196f3', padding: '4px 8px', color: 'white', borderRadius: '4px' }}>Blue</span> – <strong>Answered</strong> and <strong>Marked for review</strong>. Will be evaluated.</li>
      </ul>

      <h3>Navigating to a Question:</h3>
      <ul>
        <li>Click a number in the Question Palette to jump directly to that question.</li>
        <li><strong>Save & Next</strong> saves the answer and moves to the next question.</li>
        <li><strong>Mark for Review & Next</strong> saves the answer, marks for review, and goes to the next question.</li>
      </ul>

      <h3>Answering a Question:</h3>
      <strong>MCQ:</strong>
      <ul>
        <li>Select your answer by clicking one of the options.</li>
        <li>Deselect by clicking again or using <strong>Clear Response</strong>.</li>
        <li>Click <strong>Save & Next</strong> to save and move forward.</li>
      </ul>
      <strong>MSQ:</strong>
      <ul>
        <li>Select multiple options using checkboxes.</li>
        <li>Deselect by clicking again or using <strong>Clear Response</strong>.</li>
      </ul>
      <strong>NAT:</strong>
      <ul>
        <li>Enter your numerical answer using the virtual keyboard.</li>
        <li>Clear or change using <strong>Clear Response</strong>.</li>
      </ul>

      <h3>Navigating Sections:</h3>
      <ul>
        <li>Sections appear on the top bar. Click a section name to switch.</li>
        <li><strong>Save & Next</strong> on last question of a section takes you to the next section.</li>
        <li>You can move freely between questions and sections anytime during the exam.</li>
      </ul>

      <div style={{ marginTop: "30px" }}>
        <label>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />{" "}
          I accept the Terms & Conditions
        </label>
      </div>

      <button
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: accepted ? "#2C2F48" : "#aaa",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: accepted ? "pointer" : "not-allowed"
        }}
        onClick={handleStart}
        disabled={!accepted}
      >
        Ready to Begin
      </button>
    </div>
  );
};

export default Instructions;
