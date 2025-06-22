import express from 'express';
import db from '../db.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// ---- Route to Save Individual Answer (optional per-question) ---- //
router.post('/submit-answer', async (req, res) => {
  const { userId, testSessionId, questionId, userAnswer, questionType } = req.body;

  if (!userId || !testSessionId || !questionId || userAnswer === undefined || !questionType) {
    return res.status(400).json({ error: 'Missing required fields for answer submission.' });
  }

  try {
    const [questionRow] = await new Promise((resolve, reject) => {
      const query = 'SELECT type, correct_answer, marks FROM questions WHERE question_id = ?';
      db.query(query, [questionId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!questionRow) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const { type: dbQuestionType, correct_answer: dbCorrectAnswer, marks: questionMarks } = questionRow;

    let isCorrect = false;
    let marksObtained = 0;

    if (dbQuestionType === 'MCQ') {
      const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer);
      isCorrect = (userAnswer === parsedCorrectAnswer);
    } else if (dbQuestionType === 'MSQ') {
      const userSelectionsSorted = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
      const correctSelectionsSorted = Array.isArray(JSON.parse(dbCorrectAnswer)) ? [...JSON.parse(dbCorrectAnswer)].sort() : [];
      isCorrect = JSON.stringify(userSelectionsSorted) === JSON.stringify(correctSelectionsSorted);
    } else if (dbQuestionType === 'NAT') {
      const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer);
      isCorrect = (String(userAnswer).trim() === String(parsedCorrectAnswer).trim());
    }

    if (isCorrect) {
      marksObtained = questionMarks;
    } else {
      // Negative marking only for MCQ questions
      if (dbQuestionType === 'MCQ') {
        marksObtained = -(questionMarks / 3); // Negative 1/3rd of marks for incorrect MCQ
      } else {
        marksObtained = 0; // No negative marking for MSQ/NAT
      }
    }

    const insertUpdateQuery = `
      INSERT INTO user_answers (user_id, test_session_id, question_id, user_selected_option, is_correct, marks_obtained)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_selected_option = VALUES(user_selected_option),
        is_correct = VALUES(is_correct),
        marks_obtained = VALUES(marks_obtained),
        answered_at = NOW();
    `;
    const values = [
      userId,
      testSessionId,
      questionId,
      JSON.stringify(userAnswer),
      isCorrect,
      marksObtained
    ];

    await new Promise((resolve, reject) => {
      db.query(insertUpdateQuery, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log(`Answer saved/updated for User ${userId}, Question ${questionId}, Type ${dbQuestionType}`);
    return res.json({ message: 'Answer saved successfully', isCorrect, marksObtained });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ✅✅ ✅ Modified /submit-test to insert all answers
router.post('/submit-test', async (req, res) => {
  const { userId, testSessionId, testId, answers } = req.body;

  if (!userId || !testSessionId || !testId || !answers) {
    return res.status(400).json({ error: 'Missing userId, testSessionId, testId, or answers.' });
  }

  try {
    // 1. Save each answer
    for (const answer of answers) {
      const { questionId, userAnswer, questionType } = answer;

      const [questionRow] = await new Promise((resolve, reject) => {
        const query = 'SELECT type, correct_answer, marks FROM questions WHERE question_id = ?';
        db.query(query, [questionId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (!questionRow) continue;

      const { type: dbQuestionType, correct_answer: dbCorrectAnswer, marks: questionMarks } = questionRow;

      let isCorrect = false;
      let marksObtained = 0;

      if (dbQuestionType === 'MCQ') {
        const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer);
        isCorrect = (userAnswer === parsedCorrectAnswer);
      } else if (dbQuestionType === 'MSQ') {
        const userSelectionsSorted = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        const correctSelectionsSorted = Array.isArray(JSON.parse(dbCorrectAnswer)) ? [...JSON.parse(dbCorrectAnswer)].sort() : [];
        isCorrect = JSON.stringify(userSelectionsSorted) === JSON.stringify(correctSelectionsSorted);
      } else if (dbQuestionType === 'NAT') {
        const parsedCorrectAnswer = JSON.parse(dbCorrectAnswer);
        isCorrect = (String(userAnswer).trim() === String(parsedCorrectAnswer).trim());
      }

      if (isCorrect) marksObtained = questionMarks;
      else {
        // Negative marking only for MCQ questions
        if (dbQuestionType === 'MCQ') {
          marksObtained = -(questionMarks / 3); // Negative 1/3rd of marks for incorrect MCQ
        } else {
          marksObtained = 0; // No negative marking for MSQ/NAT
        }
      }

      const insertUpdateQuery = `
        INSERT INTO user_answers (user_id, test_session_id, question_id, user_selected_option, is_correct, marks_obtained)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          user_selected_option = VALUES(user_selected_option),
          is_correct = VALUES(is_correct),
          marks_obtained = VALUES(marks_obtained),
          answered_at = NOW();
      `;

      const values = [
        userId,
        testSessionId,
        questionId,
        JSON.stringify(userAnswer),
        isCorrect,
        marksObtained
      ];

      await new Promise((resolve, reject) => {
        db.query(insertUpdateQuery, values, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    // 2. Send email confirmation
    const [userRow] = await new Promise((resolve, reject) => {
      db.query('SELECT name, email FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!userRow) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { name, email } = userRow;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your.email@gmail.com',
        pass: 'your_app_password'
      }
    });

    const mailOptions = {
      from: 'your.email@gmail.com',
      to: email,
      subject: 'Test Submission Confirmation - nDMatrix',
      html: `
        <p>Dear ${name},</p>
        <p>Your test has been successfully submitted.</p>
        <p><strong>Course Name:</strong> GATE - 2025</p>
        <p><strong>Test Name:</strong> Test - 1</p>
        <br/>
        <p>Best Regards,</p>
        <p>nDMatrix</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Test submission email sent to ${email}`);

    return res.json({ message: 'Test submitted and answers saved successfully.' });
  } catch (error) {
    console.error('Error during test submission:', error);
    return res.status(500).json({ error: 'Failed to submit test and store answers.' });
  }
});

export default router;
