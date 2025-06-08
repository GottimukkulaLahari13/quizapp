import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import db from './db.js'; // Import the database pool from db.js
import { v4 as uuidv4 } from 'uuid'; // Import uuid for testSessionId generation

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection Check
db.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database (via imported pool)!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database (via imported pool):', err.message);
        process.exit(1); // Exit if database connection fails
    });

// --- API Endpoints ---

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [rows] = await db.execute('SELECT id, full_name, email, password AS hashed_password, profile_pic FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

        if (isPasswordValid) {
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email: user.email,
                    profile: user.profile_pic
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login. Please try again later.' });
    }
});

// Fetch all questions with their options
app.get('/api/questions', async (req, res) => {
    try {
        const [questions] = await db.execute('SELECT question_id, type, question_text, solution, marks, correct_nat_answer FROM questions');
        const [options] = await db.execute('SELECT option_id, question_id, option_text, is_correct FROM options');

        const questionsWithOptions = questions.map(q => {
            const questionOptions = options.filter(opt => opt.question_id === q.question_id)
                                          .map(opt => ({
                                              option_id: opt.option_id,
                                              option_text: opt.option_text,
                                              is_correct: opt.is_correct === 1
                                          }));
            return {
                ...q,
                options: questionOptions
            };
        });

        res.json({ questions: questionsWithOptions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions from database' });
    }
});

// Endpoint for submitting user answers to the database
app.post('/api/submit-answers', async (req, res) => {
    const { userId, testId, testSessionId, userAnswers } = req.body;

    if (!userId || !testId || !testSessionId || !userAnswers || !Array.isArray(userAnswers)) {
        return res.status(400).json({ message: 'Missing required submission data' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const insertQuery = `
            INSERT INTO user_answers
            (user_id, test_session_id, question_id, user_selected_option, is_correct, marks_obtained, answered_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        for (const answer of userAnswers) {
            const { question_id, user_selected_option } = answer;

            const [questionRows] = await connection.execute(
                'SELECT type, solution, marks, correct_nat_answer FROM questions WHERE question_id = ?',
                [question_id]
            );

            if (questionRows.length === 0) {
                console.warn(`Question ID ${question_id} not found.`);
                continue;
            }

            const question = questionRows[0];
            let isCorrect = false;
            let marksObtained = 0;
            let finalUserSelectedOption = null;

            if (question.type === 'MCQ') {
                const [correctOptionRows] = await connection.execute(
                    'SELECT option_id FROM options WHERE question_id = ? AND is_correct = 1',
                    [question_id]
                );
                const correctOptionId = correctOptionRows.length > 0 ? correctOptionRows[0].option_id : null;
                isCorrect = (user_selected_option == correctOptionId);
                finalUserSelectedOption = user_selected_option;

            } else if (question.type === 'MSQ') {
                const [correctOptionRows] = await connection.execute(
                    'SELECT option_id FROM options WHERE question_id = ? AND is_correct = 1',
                    [question_id]
                );
                const correctOptionIds = correctOptionRows.map(opt => opt.option_id).sort();
                const selectedOptionsArray = Array.isArray(user_selected_option) ? user_selected_option.map(Number).sort() : [];

                isCorrect = (
                    selectedOptionsArray.length === correctOptionIds.length &&
                    selectedOptionsArray.every((val, index) => val === correctOptionIds[index])
                );
                finalUserSelectedOption = JSON.stringify(selectedOptionsArray);
            } else if (question.type === 'NAT') {
                isCorrect = (String(user_selected_option).trim() === String(question.correct_nat_answer).trim());
                finalUserSelectedOption = String(user_selected_option);
            }

            if (isCorrect) {
                marksObtained = question.marks;
            }

            await connection.execute(
                insertQuery,
                [userId, testSessionId, question_id, finalUserSelectedOption, isCorrect, marksObtained]
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Answers submitted successfully' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error submitting answers:', error);
        res.status(500).json({ message: 'Failed to submit answers due to a server error. Please try again.' });
    } finally {
        if (connection) connection.release();
    }
});

// Performance Report Endpoint
app.get('/api/results/:userId/:testSessionId', async (req, res) => {
    const { userId, testSessionId } = req.params;

    console.log("Backend: Received request for performance report with:");
    console.log("  userId (from params):", userId);
    console.log("  testSessionId (from params):", testSessionId);

    try {
        // IMPORTANT: Fetches ALL questions as there is no test_id column in your 'questions' table.
        // If you later add a test_id column and want to filter by test, you'll need
        // to re-add 'test_id' to the SELECT and a WHERE clause, and update the frontend route.
        const [allQuestions] = await db.execute(
            `SELECT
                q.question_id,
                q.type AS question_type,
                q.question_text,
                q.solution AS question_solution,
                q.marks AS total_marks_possible,
                q.correct_nat_answer
            FROM
                questions q
            ORDER BY q.question_id ASC`
        );

        if (allQuestions.length === 0) {
            console.warn(`No questions found in the database.`);
            return res.status(404).json({ message: 'No questions found in the database to generate a report.' });
        }

        // Fetch user answers for the specific session
        const [userAnswersRaw] = await db.execute(
            `SELECT
                question_id,
                user_selected_option,
                is_correct,
                marks_obtained
            FROM
                user_answers
            WHERE
                user_id = ? AND test_session_id = ?`,
            [userId, testSessionId]
        );

        const userAnswersMap = new Map();
        userAnswersRaw.forEach(ans => userAnswersMap.set(ans.question_id, ans));

        const questionIds = allQuestions.map(q => q.question_id);
        let optionsMap = {};

        // Fetch all options for all questions fetched
        if (questionIds.length > 0) {
            const [allOptions] = await db.execute(
                `SELECT option_id, question_id, option_text, is_correct FROM options WHERE question_id IN (${questionIds.map(() => '?').join(',')})`,
                questionIds
            );
            allOptions.forEach(opt => {
                if (!optionsMap[opt.question_id]) {
                    optionsMap[opt.question_id] = [];
                }
                optionsMap[opt.question_id].push(opt);
            });
        }

        const formattedResults = allQuestions.map(question => {
            const userAnswer = userAnswersMap.get(question.question_id);

            let correctOptionsText = [];
            let userSelectedOptionsText = [];
            let correctNATAnswer = null;
            let userNATAnswer = null;
            let isCorrect = false;
            let marksObtained = 0;
            let hasUserAnswered = false; // New flag

            // Get correct options for MCQ/MSQ
            if (question.question_type === 'MCQ' || question.question_type === 'MSQ') {
                const questionOptions = optionsMap[question.question_id] || [];
                const correctOptions = questionOptions.filter(opt => opt.is_correct === 1);
                correctOptionsText = correctOptions.map(opt => opt.option_text);
            } else if (question.question_type === 'NAT') {
                correctNATAnswer = question.correct_nat_answer;
            }
            
            // Process user's answer if available
            if (userAnswer) {
                hasUserAnswered = true;
                isCorrect = userAnswer.is_correct === 1;
                marksObtained = userAnswer.marks_obtained;

                if (question.question_type === 'MCQ' || question.question_type === 'MSQ') {
                    const questionOptions = optionsMap[question.question_id] || [];
                    let selectedOptionIds = [];
                    try {
                        if (typeof userAnswer.user_selected_option === 'string') {
                            selectedOptionIds = JSON.parse(userAnswer.user_selected_option);
                            if (!Array.isArray(selectedOptionIds)) {
                                selectedOptionIds = [selectedOptionIds];
                            }
                        } else if (typeof userAnswer.user_selected_option === 'number') {
                            selectedOptionIds = [userAnswer.user_selected_option];
                        } else if (Array.isArray(userAnswer.user_selected_option)) {
                            selectedOptionIds = userAnswer.user_selected_option;
                        }
                    } catch (e) {
                        selectedOptionIds = [Number(userAnswer.user_selected_option)];
                    }

                    userSelectedOptionsText = questionOptions
                        .filter(opt => selectedOptionIds.includes(opt.option_id))
                        .map(opt => opt.option_text);
                } else if (question.question_type === 'NAT') {
                    userNATAnswer = userAnswer.user_selected_option;
                }
            }

            return {
                question_id: question.question_id,
                question_text: question.question_text,
                question_type: question.question_type,
                options: optionsMap[question.question_id] || [], // Include all options for this question
                user_selected_option: userAnswer ? userAnswer.user_selected_option : null, // Raw value from DB
                user_selected_options_text: userSelectedOptionsText, // Formatted text for MCQ/MSQ
                user_nat_answer: userNATAnswer, // Formatted text for NAT
                is_correct: isCorrect, // Whether user answered correctly
                marks_obtained: marksObtained,
                total_marks_possible: question.total_marks_possible,
                correct_options_text: correctOptionsText, // Formatted text for MCQ/MSQ
                correct_nat_answer: correctNATAnswer, // Formatted text for NAT
                solution: question.question_solution,
                has_user_answered: hasUserAnswered // Indicate if the user answered this question
            };
        });

        // Calculate overall score from all questions, not just answered ones for the report
        const totalQuestionsCount = formattedResults.length;
        const totalMarksPossibleOverall = formattedResults.reduce((sum, q) => sum + q.total_marks_possible, 0);
        const totalMarksObtainedOverall = formattedResults.reduce((sum, q) => sum + q.marks_obtained, 0);
        const scorePercentageOverall = totalMarksPossibleOverall > 0
            ? (totalMarksObtainedOverall / totalMarksPossibleOverall) * 100
            : 0;

        res.json({
            testSessionId: testSessionId,
            totalQuestions: totalQuestionsCount,
            correctAnswersCount: formattedResults.filter(q => q.is_correct).length,
            // Incorrect answers are only counted if the user actually attempted the question and got it wrong
            incorrectAnswersCount: formattedResults.filter(q => !q.is_correct && q.has_user_answered).length,
            unansweredQuestionsCount: formattedResults.filter(q => !q.has_user_answered).length,
            overallScore: scorePercentageOverall,
            results: formattedResults // This now contains ALL questions with their answer status
        });

    } catch (error) {
        console.error('Error fetching comprehensive test results:', error);
        res.status(500).json({ message: 'Error fetching results due to a server error.' });
    }
});

// Endpoint for general user results (e.g., history of all tests)
app.get('/api/user/:userId/test-sessions', async (req, res) => {
    const { userId } = req.params;
    try {
        const [testSessions] = await db.execute(
            `SELECT DISTINCT test_session_id, user_id, answered_at
             FROM user_answers
             WHERE user_id = ?
             ORDER BY answered_at DESC`,
            [userId]
        );
        res.json({ testSessions });
    } catch (error) {
        console.error('Error fetching user test sessions:', error);
        res.status(500).json({ message: 'Error fetching test sessions.' });
    }
});


// Catch-all for undefined routes
app.use((req, res, next) => {
    res.status(404).send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 Not Found</title><style>body{font-family:sans-serif;text-align:center;padding-top:50px;}h1{color:#f00;}p{color:#333;}</style></head><body><h1>404 Not Found</h1><p>The requested URL was not found on this server.</p></body></html>');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});