import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to the QuizApp Platform</h1>
        <p>Your journey to mastering new skills starts here.</p>
      </header>
      <main className="home-main">
        <div className="cta-section">
          <h2>Ready to test your knowledge?</h2>
          <p>Join thousands of users and start your first quiz today. It's free!</p>
          <Link to="/register" className="cta-button">Register Now</Link>
        </div>
        <div className="features-section">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Comprehensive Quizzes</h3>
              <p>Covering a wide range of topics to challenge and educate.</p>
            </div>
            <div className="feature-card">
              <h3>Instant Feedback</h3>
              <p>Get detailed performance reports right after you finish.</p>
            </div>
            <div className="feature-card">
              <h3>User-Friendly Interface</h3>
              <p>A clean, modern, and intuitive design for a seamless experience.</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="home-footer">
        <p>&copy; 2025 QuizApp Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage; 