import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

// Define the styles as a JavaScript object
const styles = {
  // Styles for the main scrollable container (full width)
  mainScrollContainer: {
    height: "100vh", // Take full viewport height
    overflowY: "auto", // Enable vertical scrolling
    boxSizing: "border-box", // Include padding in height
    width: "100vw", // Ensure it spans the entire viewport width
    // No horizontal margin here, as we want the scrollbar on the edge
  },
  // Styles for the inner content container (centered)
  contentWrapper: {
    padding: "40px",
    maxWidth: "900px", // Limit the width of the content
    margin: "0 auto", // Center the content horizontally
    boxSizing: "border-box", // Important for padding within max-width
  },
  heading: {
    marginBottom: "20px",
  },
  generalInstructionsHeading: {
    marginTop: "30px", // Add some space above general instructions
  },
  list: {
    marginBottom: "20px", // Space after each list
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    marginRight: "10px",
  },
  checkboxContainer: {
    marginTop: "30px",
  },
  startButton: {
    marginTop: "20px",
    padding: "10px 20px",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
  // Specific badge colors
  badgeGray: {
    background: "#ccc",
    color: "#000",
  },
  badgeRed: {
    background: "#f44336",
    color: "white",
  },
  badgeGreen: {
    background: "#4caf50",
    color: "white",
  },
  badgeOrange: {
    background: "#ff9800",
    color: "white",
  },
  badgeBlue: {
    background: "#2196f3",
    color: "white",
  },
};

const Instructions = () => {
  const [accepted, setAccepted] = useState(false);
  const { testId } = useParams();
  const mainScrollRef = useRef(null); // Ref for the outer scrollable container

  useEffect(() => {
    // Scroll the specific container to the top when the component mounts
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo(0, 0);
    }
  }, []);

  const handleStart = () => {
    if (accepted) {
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}/test-interface/${testId}`;

      const windowFeatures = [
        "toolbar=no",
        "location=no",
        "status=no",
        "menubar=no",
        "scrollbars=yes", // Ensure scrollbars are always available
        "resizable=yes",
        "width=1920",
        "height=1080",
        "top=0",
        "left=0",
      ].join(",");

      const testWindow = window.open(
        fullUrl,
        `TestWindow_${testId}`,
        windowFeatures
      );

      if (testWindow) {
        testWindow.focus();
      } else {
        alert(
          "Popup blocked! Please allow pop-ups for this website to proceed with the test."
        );
      }
    }
  };

  // Helper for palette badge styling, now uses predefined styles
  const getBadgeStyle = (colorKey) => ({
    ...styles.badge,
    ...styles[colorKey],
  });

  return (
    // Outer div for scrolling - takes full width
    <div ref={mainScrollRef} style={styles.mainScrollContainer}>
      {/* Inner div for content - centered and max-width */}
      <div style={styles.contentWrapper}>
        <h2 style={styles.heading}>Read the Following Instructions Carefully</h2>

        <h3 style={styles.generalInstructionsHeading}>General Instructions:</h3>
        <ul style={styles.list}>
          <li>
            Total duration of the examination is <strong>180 minutes</strong>.
          </li>
          <li>
            A scientific calculator is available on the top-right corner of the
            screen.
          </li>
          <li>
            The clock will be set at the server. A countdown timer will show
            remaining time.
          </li>
          <li>When the timer reaches zero, the test will auto-submit.</li>
        </ul>

        <h3>Question Palette Symbols:</h3>
        <ul style={styles.list}>
          <li>
            <span style={getBadgeStyle("badgeGray")}>Gray</span> – NOT visited
          </li>
          <li>
            <span style={getBadgeStyle("badgeRed")}>Red</span> – NOT answered
          </li>
          <li>
            <span style={getBadgeStyle("badgeGreen")}>Green</span> – Answered
          </li>
          <li>
            <span style={getBadgeStyle("badgeOrange")}>Orange</span> – Marked for
            review, NOT answered
          </li>
          <li>
            <span style={getBadgeStyle("badgeBlue")}>Blue</span> – Answered and
            marked for review
          </li>
        </ul>

        <h3>Navigating to a Question:</h3>
        <ul style={styles.list}>
          <li>Click a number in the palette to go to that question.</li>
          <li>
            <strong>Save & Next</strong> saves the answer and goes forward.
          </li>
          <li>
            <strong>Mark for Review & Next</strong> marks the question and moves
            forward.
          </li>
        </ul>

        <h3>Answering a Question:</h3>
        <strong>MCQ:</strong>
        <ul style={styles.list}>
          <li>
            Select an option. Deselect by clicking again or using{" "}
            <strong>Clear Response</strong>.
          </li>
        </ul>
        <strong>MSQ:</strong>
        <ul style={styles.list}>
          <li>Select multiple options using checkboxes.</li>
        </ul>
        <strong>NAT:</strong>
        <ul style={styles.list}>
          <li>
            Enter a number using the keyboard. Use <strong>Clear Response</strong>{" "}
            to reset.
          </li>
        </ul>

        <h3>Navigating Sections:</h3>
        <ul style={styles.list}>
          <li>Click section names at the top.</li>
          <li>
            <strong>Save & Next</strong> on the last question goes to next
            section.
          </li>
          <li>You can move between sections anytime.</li>
        </ul>

        <div style={styles.checkboxContainer}>
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
            ...styles.startButton,
            backgroundColor: accepted ? "#2C2F48" : "#aaa",
            cursor: accepted ? "pointer" : "not-allowed",
          }}
          onClick={handleStart}
          disabled={!accepted}
        >
          Ready to Begin
        </button>
      </div>
    </div>
  );
};

export default Instructions;