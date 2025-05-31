import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./TestInterface.css"; // You can define styles here

// NOTE: In a real application, you would fetch questions from your backend
// instead of having them hardcoded here. This hardcoded data is for development.
const questionsData = {
  mcq: [
    {
      id: 1,
      type: "MCQ",
      question:
        "If the cost of 5 pens is equal to that of 7 pencils, what is the ratio of the cost of a pen to that of a pencil?",
      options: ["5:7", "7:5", "2:3", "3:2"],
      answer: 1, // This 'answer' field is for local result display if not fetching from DB
      solution: "5 pens = 7 pencils → pen/pencil = 7/5 → 7:5",
      marks: 1,
    },
    {
      id: 2,
      type: "MCQ",
      question: "What is the next number in the sequence: 2, 6, 12, 20, 30, ?",
      options: ["36", "42", "56", "60"],
      answer: 1,
      solution: "Pattern: n(n+1): 1×2, 2×3, ..., 6×7 = 42",
      marks: 2,
    },
    {
      id: 3,
      type: "MCQ",
      question:
        'Choose the word that best fits the blank: "Despite being new to the subject, she showed a ___ understanding."',
      options: ["superficial", "profound", "limited", "vague"],
      answer: 1,
      solution: '"Profound" fits contextually as deep understanding',
      marks: 1,
    },
    {
      id: 4,
      type: "MCQ",
      question: "What is the angle between the hour and minute hands of a clock at 3:15?",
      options: ["0°", "7.5°", "30°", "45°"],
      answer: 1,
      solution: "30×3 − 11/2×15 = 90 − 82.5 = 7.5°",
      marks: 2,
    },
    {
      id: 5,
      type: "MCQ",
      question: "A train travels 60 km in 90 minutes. What is its average speed in km/h?",
      options: ["60", "30", "40", "80"],
      answer: 2,
      solution: "90 min = 1.5 hrs, so speed = 60 / 1.5 = 40 km/h",
      marks: 1,
    },
    {
      id: 6,
      type: "MCQ",
      question:
        "If a rectangle has a perimeter of 100 cm and length is twice its breadth, what is the area of the rectangle?",
      options: ["300 cm²", "400 cm²", "625 cm²", "800 cm²"],
      answer: 1,
      solution: "2(x + 2x) = 100 → x = 16.67, l = 33.33 → A ≈ 400",
      marks: 2,
    },
    {
      id: 7,
      type: "MCQ",
      question:
        "In a class of 80 students, 60% are boys. If 75% of the boys passed, how many boys failed?",
      options: ["12", "18", "24", "15"],
      answer: 0,
      solution: "60% of 80 = 48 boys. 75% passed = 36 → failed = 12",
      marks: 1,
    },
    {
      id: 8,
      type: "MCQ",
      question:
        "What is the compound interest on ₹10,000 at 10% per annum for 2 years, compounded annually?",
      options: ["₹1,000", "₹2,000", "₹2,100", "₹2,200"],
      answer: 2,
      solution: "CI = 10000×(1.1)^2 − 10000 = ₹2,100",
      marks: 2,
    },
    {
      id: 9,
      type: "MCQ",
      question: "Choose the correct alternative: All cats are animals. Some animals are dogs. Therefore:",
      options: [
        "All cats are dogs",
        "All dogs are cats",
        "Some cats are dogs",
        "None of the above",
      ],
      answer: 3,
      solution: "Conclusion cannot be determined → None of the above",
      marks: 1,
    },
    {
      id: 10,
      type: "MCQ",
      question:
        "A person can complete a job in 10 days, and another in 15 days. If both work together, how long will it take to finish the job?",
      options: ["5 days", "6 days", "8 days", "9 days"],
      answer: 1,
      solution: "1/10 + 1/15 = 1/6 → Time = 6 days",
      marks: 2,
    },
  ],
  // Questions below this section are from the original NAT section, but are MCQ/MSQ for testing.
  // In a real scenario, you'd likely fetch from database for both questions and their types.
  nat: [
    {
      id: 11,
      type: "MCQ", // Changed from NAT to MCQ based on options
      question: "What is the worst-case time complexity of Quick Sort?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      answer: 2,
      solution: "Worst-case time complexity of Quick Sort is O(n²).",
      marks: 1,
    },
    {
      id: 12,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which scheduling algorithm can lead to starvation?",
      options: ["Round Robin", "First Come First Serve", "Priority Scheduling", "Shortest Job First"],
      answer: 2,
      solution: "Priority Scheduling can lead to starvation.",
      marks: 1,
    },
    {
      id: 13,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which protocol is used to convert a domain name into an IP address?",
      options: ["FTP", "DNS", "HTTP", "SMTP"],
      answer: 1,
      solution: "DNS is used to convert a domain name into an IP address.",
      marks: 1,
    },
    {
      id: 14,
      type: "MCQ", // Changed from NAT to MCQ
      question: "What type of database model uses tables to represent data?",
      options: ["Network", "Hierarchical", "Relational", "Object-oriented"],
      answer: 2,
      solution: "Relational database model uses tables to represent data.",
      marks: 1,
    },
    {
      id: 15,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which of the following is not a regular language?",
      options: ["Empty string", "Language of all strings with even length", "Language of all strings with equal number of a's and b's", "Language consisting of only one string"],
      answer: 2,
      solution: "Language of all strings with equal number of a's and b's is not a regular language.",
      marks: 1,
    },
    {
      id: 16,
      type: "MCQ", // Changed from NAT to MCQ
      question: "What is the output of a 2-input XOR gate if both inputs are 1?",
      options: ["0", "1", "Undefined", "Both 0 and 1"],
      answer: 0,
      solution: "Output is 0 when both inputs are 1.",
      marks: 2,
    },
    {
      id: 17,
      type: "MCQ", // Changed from NAT to MCQ
      question: "If a memory address is 16 bits long, what is the maximum addressable memory size?",
      options: ["64 KB", "128 KB", "256 KB", "512 KB"],
      answer: 0,
      solution: "Maximum addressable memory size is 64 KB.",
      marks: 2,
    },
    {
      id: 18,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which software development model is also known as the 'Waterfall' model?",
      options: ["Agile", "Spiral", "V-Model", "SDLC"],
      answer: 3,
      solution: "The Waterfall model is also known as SDLC.",
      marks: 2,
    },
    {
      id: 19,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which layer of the OSI model is responsible for end-to-end communication?",
      options: ["Transport", "Network", "Data Link", "Physical"],
      answer: 0,
      solution: "Transport layer is responsible for end-to-end communication.",
      marks: 1,
    },
    {
      id: 20,
      type: "MCQ", // Changed from NAT to MCQ
      question: "In SQL, which command is used to remove rows from a table?",
      options: ["DELETE", "DROP", "REMOVE", "ERASE"],
      answer: 0,
      solution: "DELETE command is used to remove rows from a table.",
      marks: 1,
    },
    {
      id: 21,
      type: "MCQ", // Changed from NAT to MCQ
      question: "What is the minimum number of comparisons needed to find both minimum and maximum elements in an array of n elements?",
      options: ["1.5n - 2", "2n - 2", "n log n", "n²"],
      answer: 0,
      solution: "Minimum number of comparisons is 1.5n - 2.",
      marks: 2,
    },
    {
      id: 22,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which of the following is a non-preemptive scheduling algorithm?",
      options: ["Round Robin", "Priority Scheduling (with preemption)", "First Come First Serve", "Shortest Remaining Time First"],
      answer: 2,
      solution: "First Come First Serve is a non-preemptive scheduling algorithm.",
      marks: 2,
    },
    {
      id: 23,
      type: "MCQ", // Changed from NAT to MCQ
      question: "What kind of grammar is a context-free grammar?",
      options: ["Type 0", "Type 1", "Type 2", "Type 3"],
      answer: 2,
      solution: "Context-free grammar is Type 2.",
      marks: 1,
    },
    {
      id: 24,
      type: "MCQ", // Changed from NAT to MCQ
      question: "What is the size of a register in a 32-bit microprocessor?",
      options: ["8 bits", "16 bits", "32 bits", "64 bits"],
      answer: 2,
      solution: "Size of a register in a 32-bit microprocessor is 32 bits.",
      marks: 1,
    },
    {
      id: 25,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which Boolean algebra law states that A + 0 = A?",
      options: ["Identity Law", "Null Law", "Complement Law", "Distributive Law"],
      answer: 0,
      solution: "Identity Law states that A + 0 = A.",
      marks: 1,
    },
    {
      id: 26,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which testing technique is based on the internal structure of the software?",
      options: ["Black Box Testing", "White Box Testing", "Regression Testing", "Integration Testing"],
      answer: 1,
      solution: "White Box Testing is based on the internal structure of the software.",
      marks: 2,
    },
    {
      id: 27,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which protocol is used to send emails?",
      options: ["FTP", "SMTP", "HTTP", "SNMP"],
      answer: 1,
      solution: "SMTP is used to send emails.",
      marks: 1,
    },
    {
      id: 28,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which normal form requires that there are no transitive dependencies?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      answer: 2,
      solution: "3NF requires that there are no transitive dependencies.",
      marks: 2,
    },
    {
      id: 29,
      type: "MCQ", // Changed from NAT to MCQ
      question: "Which machine recognizes context-free languages?",
      options: ["Turing Machine", "Finite Automaton", "Pushdown Automaton", "Linear Bounded Automaton"],
      answer: 2,
      solution: "Pushdown Automaton recognizes context-free languages.",
      marks: 1,
    },
    {
      id: 30,
      type: "MCQ", // Changed from NAT to MCQ
      question: "If a cache has a block size of 16 bytes and the address size is 32 bits, what is the size of the offset field?",
      options: ["2 bits", "3 bits", "4 bits", "5 bits"],
      answer: 2,
      solution: "Size of the offset field is 4 bits.",
      marks: 2,
    },
    {
      id: 31,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following algorithms use divide and conquer approach? (Select all)",
      options: ["Merge Sort", "Quick Sort", "Bubble Sort", "Binary Search"],
      answer: [0, 1, 3],
      solution: "Merge Sort, Quick Sort, and Binary Search use divide and conquer approach.",
      marks: 2,
    },
    {
      id: 32,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are types of CPU scheduling algorithms? (Select all)",
      options: ["Round Robin", "Priority Scheduling", "Shortest Job First", "Deadlock Detection"],
      answer: [0, 1, 2],
      solution: "Round Robin, Priority Scheduling, and Shortest Job First are types of CPU scheduling algorithms.",
      marks: 2,
    },
    {
      id: 33,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following protocols operate at the transport layer? (Select all)",
      options: ["TCP", "UDP", "IP", "HTTP"],
      answer: [0, 1],
      solution: "TCP and UDP operate at the transport layer.",
      marks: 2,
    },
    {
      id: 34,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are types of SQL commands? (Select all)",
      options: ["DDL", "DML", "DCL", "HTML"],
      answer: [0, 1, 2],
      solution: "DDL, DML, and DCL are types of SQL commands.",
      marks: 2,
    },
    {
      id: 35,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are closure properties of regular languages? (Select all)",
      options: ["Union", "Intersection", "Complement", "Reversal"],
      answer: [0, 2, 3],
      solution: "Union, Complement, and Reversal are closure properties of regular languages.",
      marks: 2,
    },
    {
      id: 36,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are software development process models? (Select all)",
      options: ["Waterfall", "Agile", "Spiral", "Compiler Design"],
      answer: [0, 1, 2],
      solution: "Waterfall, Agile, and Spiral are software development process models.",
      marks: 2,
    },
    {
      id: 37,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are types of CPU registers? (Select all)",
      options: ["Program Counter", "Instruction Register", "Data Register", "File Register"],
      answer: [0, 1, 2],
      solution: "Program Counter, Instruction Register, and Data Register are types of CPU registers.",
      marks: 2,
    },
    {
      id: 38,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are basic logic gates? (Select all)",
      options: ["AND", "OR", "NOR", "NAND"],
      answer: [0, 1, 2, 3],
      solution: "AND, OR, NOR, and NAND are basic logic gates.",
      marks: 2,
    },
    {
      id: 39,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are types of network topologies? (Select all)",
      options: ["Star", "Mesh", "Ring", "Linear"],
      answer: [0, 1, 2],
      solution: "Star, Mesh, and Ring are types of network topologies.",
      marks: 2,
    },
    {
      id: 40,
      type: "MSQ", // Changed from NAT to MSQ
      question: "Which of the following are types of joins in SQL? (Select all)",
      options: ["Inner Join", "Outer Join", "Cross Join", "Full Join"],
      answer: [0, 1, 2, 3],
      solution: "Inner Join, Outer Join, Cross Join, and Full Join are types of joins in SQL.",
      marks: 2,
    },
    {
      id: 41,
      type: "NAT", // This is truly NAT
      question: "What is the time complexity of binary search on a sorted array of size n?",
      answer: "log₂n",
      solution: "Time complexity of binary search is log₂n.",
      marks: 1,
    },
    {
      id: 42,
      type: "NAT",
      question: "How many bytes are there in a 64-bit register?",
      answer: "8",
      solution: "A 64-bit register has 8 bytes.",
      marks: 1,
    },
    {
      id: 43,
      type: "NAT",
      question: "If a CPU scheduler uses Round Robin with a time quantum of 5 ms, and a process burst time is 20 ms, how many time slices will it take to complete?",
      answer: "4",
      solution: "It will take 4 time slices to complete.",
      marks: 2,
    },
    {
      id: 44,
      type: "NAT",
      question: "How many bits are needed to represent decimal number 255 in binary?",
      answer: "8",
      solution: "8 bits are needed to represent decimal number 255 in binary.",
      marks: 1,
    },
    {
      id: 45,
      type: "NAT",
      question: "IPv4 address is how many bits long?",
      answer: "32",
      solution: "IPv4 address is 32 bits long.",
      marks: 2,
    },
    {
      id: 46,
      type: "NAT",
      question: "If a table has 5 columns, each with 4 bytes and 100 rows, what is the size of the table in bytes?",
      answer: "2000",
      solution: "Size of the table is 2000 bytes.",
      marks: 2,
    },
    {
      id: 47,
      type: "NAT",
      question: "Number of states in a DFA that accepts strings ending with '01' over {0,1}?",
      answer: "3",
      solution: "Number of states in such a DFA is 3.",
      marks: 1,
    },
    {
      id: 48,
      type: "NAT",
      question: "Number of phases in the Waterfall model?",
      answer: "5",
      solution: "There are 5 phases in the Waterfall model.",
      marks: 1,
    },
    {
      id: 49,
      type: "NAT",
      question: "What is the height of a complete binary tree with 31 nodes?",
      answer: "5",
      solution: "Height is 5.",
      marks: 2,
    },
    {
      id: 50,
      type: "NAT",
      question: "In a system with 4 frames, how many page faults occur for the reference string 1,2,3,4,1,2,5,1,2,3,4,5 using FIFO?",
      answer: "9",
      solution: "Number of page faults is 9.",
      marks: 2,
    },
    {
      id: 51,
      type: "NAT",
      question: "Number of minterms for a 3-variable Boolean function?",
      answer: "8",
      solution: "There are 8 minterms.",
      marks: 1,
    },
    {
      id: 52,
      type: "NAT",
      question: "Number of bits in MAC address?",
      answer: "48",
      solution: "MAC address length is 48 bits.",
      marks: 2,
    },
    {
      id: 53,
      type: "NAT",
      question: "Number of candidate keys in a table with primary key and one unique key?",
      answer: "2",
      solution: "There are 2 candidate keys.",
      marks: 1,
    },
    {
      id: 54,
      type: "NAT",
      question: "Number of non-terminal symbols in a grammar with 5 productions?",
      answer: "5",
      solution: "Number of non-terminals is 5.",
      marks: 2,
    },
    {
      id: 55,
      type: "NAT",
      question: "Number of bits required for a memory address to access 64KB memory?",
      answer: "16",
      solution: "16 bits are required.",
      marks: 2,
    },
    {
      id: 56,
      type: "NAT",
      question: "Number of comparisons in the best case for linear search on n elements?",
      answer: "1",
      solution: "Best case comparisons is 1.",
      marks: 2,
    },
    {
      id: 57,
      type: "NAT",
      question: "Number of software testing types in V-model?",
      answer: "4",
      solution: "There are 4 testing types in V-model.",
      marks: 1,
    },
    {
      id: 58,
      type: "NAT",
      question: "Page size in a system with logical address space 2^16 and page number field of 10 bits?",
      answer: "64",
      solution: "Page size is 64.",
      marks: 2,
    },
    {
      id: 59,
      type: "NAT",
      question: "Number of layers in TCP/IP model?",
      answer: "4",
      solution: "TCP/IP model has 4 layers.",
      marks: 1,
    },
    {
      id: 60,
      type: "NAT",
      question: "Number of flip-flop types commonly used in sequential circuits?",
      answer: "4",
      solution: "Four flip-flop types are commonly used.",
      marks: 2,
    },
    {
      id: 61,
      type: "NAT",
      question: "Number of normal forms (up to BCNF)?",
      answer: "4",
      solution: "There are 4 normal forms up to BCNF.",
      marks: 2,
    },
    {
      id: 62,
      type: "NAT",
      question: "Number of leaf nodes in a perfect binary tree with height h=3?",
      answer: "8",
      solution: "There are 8 leaf nodes.",
      marks: 2,
    },
    {
      id: 63,
      type: "NAT",
      question: "Number of general purpose registers in Intel 8086?",
      answer: "8",
      solution: "Intel 8086 has 8 general purpose registers.",
      marks: 1,
    },
    {
      id: 64,
      type: "NAT",
      question: "Number of states in process lifecycle?",
      answer: "5",
      solution: "There are 5 states in process lifecycle.",
      marks: 2,
    },
    {
      id: 65,
      type: "NAT",
      question: "Number of symbols in the input alphabet of a Turing Machine?",
      answer: "Variable (depends on TM, default 2 for binary)",
      solution: "Depends on the Turing Machine; default 2 for binary.",
      marks: 1,
    },
  ],
};

const calculatorButtons = [
  "9", "8", "7", "/",
  "6", "5", "4", "*",
  "3", "2", "1", "-",
  "00", "0", ".", "+",
  // Add an explicit equals and clear button if not already covered by numpad
];


const TestInterface = () => {
  const [section, setSection] = useState("mcq");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(180 * 60);
  const [submitted, setSubmitted] = useState(false);

  // --- NEW STATE FOR USER AND TEST SESSION IDs ---
  const [userId, setUserId] = useState(null);
  const [testSessionId, setTestSessionId] = useState(null); // This needs to be dynamic

  const { testId } = useParams();

  const questions = questionsData[section];

  // --- EFFECT TO SET USER_ID AND TEST_SESSION_ID ---
  useEffect(() => {
    const enterFullscreen = () => {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    };
    enterFullscreen();

    // --- Retrieve User ID from Local Storage/Context ---
    const storedUser = localStorage.getItem('user'); // Assuming your login stores user info here
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id); // Assuming the user object has an 'id' field
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    } else {
      console.warn("No user found in localStorage. userId will be null.");
      // Redirect to login or show error if user isn't authenticated
    }

    // --- Generate/Fetch Test Session ID ---
    // In a real application, you would make an API call to your backend
    // (e.g., /api/test/start-session) to get a unique testSessionId
    // and potentially store it in sessionStorage or a context.
    // For now, let's use a dummy or simple generated ID.
    const uniqueSessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setTestSessionId(uniqueSessionId);
    console.log("Test Session ID:", uniqueSessionId); // For debugging


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
  }, []); // Empty dependency array means this runs once on mount

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --- NEW FUNCTION TO SEND ANSWER TO BACKEND ---
  const sendAnswerToBackend = async (qId, answerValue, qType) => {
    if (!userId || !testSessionId) {
      console.warn("User ID or Test Session ID not available. Cannot send answer to backend.");
      return;
    }

    try {
      // Clean up answerValue for NAT if it's "Error" to send a null/empty string
      const finalAnswerValue = (qType === 'NAT' && answerValue === "Error") ? "" : answerValue;

      const response = await fetch('http://localhost:5000/api/test/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          testSessionId: testSessionId,
          questionId: qId,
          userAnswer: finalAnswerValue, // Use the cleaned value
          questionType: qType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save answer on backend:', errorData.error);
        // Optionally, show a user-friendly error message to the user
      } else {
        const successData = await response.json();
        console.log('Answer saved successfully:', successData.message, 'Is Correct:', successData.isCorrect, 'Marks Obtained:', successData.marksObtained);
        // You might want to update UI or question status based on successData (e.g., green if correct)
      }
    } catch (error) {
      console.error('Error sending answer to backend:', error);
      // Handle network errors or other exceptions
    }
  };


  const handleOptionSelect = (value) => {
    const currentQuestion = questions[currentIndex];
    setAnswers({ ...answers, [currentQuestion.id]: value });
    // --- Send answer to backend ---
    sendAnswerToBackend(currentQuestion.id, value, currentQuestion.type);
  };

  const handleMSQOptionToggle = (index) => {
    const currentQuestion = questions[currentIndex];
    const qid = currentQuestion.id;
    const currentSelections = answers[qid] || [];
    let updatedSelections;
    if (currentSelections.includes(index)) {
      updatedSelections = currentSelections.filter((i) => i !== index);
    } else {
      updatedSelections = [...currentSelections, index];
    }
    setAnswers({ ...answers, [qid]: updatedSelections });
    // --- Send answer to backend ---
    sendAnswerToBackend(qid, updatedSelections, currentQuestion.type);
  };

  const handleInputChange = (e) => {
    const currentQuestion = questions[currentIndex];
    const newValue = e.target.value;
    setAnswers({ ...answers, [currentQuestion.id]: newValue });
    // --- Send answer to backend for NAT. Consider debouncing for frequent changes. ---
    // For simplicity, sending on every change. For performance, you might send on blur
    // or when the user navigates to the next question.
    sendAnswerToBackend(currentQuestion.id, newValue, currentQuestion.type);
  };

  const handleReview = () => {
    const currentQuestion = questions[currentIndex];
    // Ensure the current answer is saved before moving to review and next
    if (answers[currentQuestion.id] !== undefined) {
      sendAnswerToBackend(currentQuestion.id, answers[currentQuestion.id], currentQuestion.type);
    }
    setReview({ ...review, [currentQuestion.id]: true });
    handleNext();
  };

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    // Ensure the current answer is saved when navigating to next
    if (answers[currentQuestion.id] !== undefined) {
        sendAnswerToBackend(currentQuestion.id, answers[currentQuestion.id], currentQuestion.type);
    }
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    const currentQuestion = questions[currentIndex];
    // Ensure the current answer is saved when navigating to previous
    if (answers[currentQuestion.id] !== undefined) {
        sendAnswerToBackend(currentQuestion.id, answers[currentQuestion.id], currentQuestion.type);
    }
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleQuestionPaletteClick = (index) => {
    // Save current answer before jumping to another question
    const currentQuestion = questions[currentIndex];
    if (answers[currentQuestion.id] !== undefined) {
        sendAnswerToBackend(currentQuestion.id, answers[currentQuestion.id], currentQuestion.type);
    }
    setCurrentIndex(index);
  };

  const handleSubmit = async () => {
    // --- Final synchronization: Ensure all answered questions are saved ---
    // This is important because the user might have answered a question and then directly hit submit
    // without triggering "Save & Next" or other navigation that triggers saving.
    const allQuestions = [...questionsData.mcq, ...questionsData.nat]; // Combine all questions
    for (const q of allQuestions) {
        // Only send if the user has an answer for this question
        if (answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "") {
            await sendAnswerToBackend(q.id, answers[q.id], q.type);
        }
    }

    setSubmitted(true);
    setShowResult(true);
  };

  const getStatusColor = (id) => {
    if (!answers[id] && !review[id]) return "gray"; // Not visited or not answered
    if (!answers[id] && review[id]) return "orange"; // Marked for review, not answered
    if (answers[id] && !review[id]) return "green"; // Answered
    if (answers[id] && review[id]) return "blue"; // Answered and marked for review
    return "red"; // This case should ideally not be hit if logic is correct
  };

  // Calculator handlers
  const appendCalc = (val) => {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentQuestion.id] || "";

    if (val === "=") {
      try {
        const expression = currentAnswer.replace(/[^-()\d/*+.]/g, "");
        let result = eval(expression); // Be cautious with eval in production due to security risks
        if (result === undefined || result === null) result = "";
        setAnswers({ ...answers, [currentQuestion.id]: result.toString() });
        // --- Send answer to backend after evaluation ---
        sendAnswerToBackend(currentQuestion.id, result.toString(), currentQuestion.type);
      } catch {
        setAnswers({ ...answers, [currentQuestion.id]: "Error" });
        // --- Send "Error" or empty string to backend for NAT if calculation fails ---
        sendAnswerToBackend(currentQuestion.id, "Error", currentQuestion.type); // Or send an empty string ""
      }
    } else if (val === "AC") {
      setAnswers({ ...answers, [currentQuestion.id]: "" });
      // --- Send empty string to backend after clearing ---
      sendAnswerToBackend(currentQuestion.id, "", currentQuestion.type);
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: currentAnswer + val });
      // For NAT, you might only want to send the answer to the backend when it's finalized (e.g., on '=' or 'Save & Next').
      // Sending on every key press can be chatty. For this example, I'll keep it as is, but be mindful.
      // sendAnswerToBackend(currentQuestion.id, currentAnswer + val, currentQuestion.type); // Uncomment if you want to send on every digit
    }
  };

  if (showResult) {
    return (
      <div className="result-container">
        <h2>Performance Report</h2>
        {[...questionsData.mcq, ...questionsData.nat].map((q) => {
          let userAnswer = answers[q.id];
          let correctAnswer;
          // IMPORTANT: For actual grading, you should fetch the correct answer from the backend
          // or have the backend handle the grading entirely based on submitted answers.
          // This local 'q.answer' is just for display when `questionsData` is hardcoded.
          if (q.type === "MCQ") {
            correctAnswer = q.options[q.answer];
            if (typeof userAnswer === "number" && q.options[userAnswer] !== undefined) {
              userAnswer = q.options[userAnswer];
            } else {
              userAnswer = userAnswer === undefined ? "Not Answered" : userAnswer;
            }
          } else if (q.type === "MSQ") {
            correctAnswer = Array.isArray(q.answer) ? q.answer.map((i) => q.options[i]).sort().join(", ") : "N/A"; // Sort for consistent display
            if (Array.isArray(userAnswer)) {
              userAnswer = userAnswer.map((i) => q.options[i]).sort().join(", "); // Sort for consistent display
            } else {
              userAnswer = userAnswer === undefined ? "Not Answered" : userAnswer;
            }
          } else {
            // NAT
            correctAnswer = q.answer;
            userAnswer = userAnswer === undefined ? "Not Answered" : userAnswer;
          }

          return (
            <div key={q.id} className="result-question-block">
              <h4>Q{q.id}: {q.question} ({q.marks} Mark{q.marks > 1 ? 's' : ''})</h4>
              {q.options && q.options.length > 0 && ( // Only render options if they exist
                <ul className="result-options">
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={`${
                          (q.type === "MCQ" && i === q.answer) || (q.type === "MSQ" && Array.isArray(q.answer) && q.answer.includes(i))
                            ? "correct-option"
                            : ""
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </li>
                  ))}
                </ul>
              )}
              <p><strong>Your Answer:</strong> {userAnswer}</p>
              <p><strong>Correct Answer:</strong> {correctAnswer}</p>
              <p><strong>Solution & Explanation:</strong> {q.solution}</p>
              <hr />
            </div>
          );
        })}
      </div>
    );
  }

  // Ensure 'questions[currentIndex]' is valid before rendering
  if (!questions || questions.length === 0 || !questions[currentIndex]) {
    return <div>Loading questions or no questions available...</div>;
  }

  return (
    <div className="test-interface">
      <div className="question-section">
        <h2>GATE 2025 - Computer Science</h2>
        <div className="section-buttons">
          <button onClick={() => { setSection("mcq"); setCurrentIndex(0); }}>MCQ Section ({questionsData.mcq.length})</button>
          <button onClick={() => { setSection("nat"); setCurrentIndex(0); }}>NAT Section ({questionsData.nat.length})</button>
        </div>

        <div className="question-box">
          <h4>
            Q{currentIndex + 1}: {questions[currentIndex].question} ({questions[currentIndex].marks} Mark{questions[currentIndex].marks > 1 ? 's' : ''})
          </h4>
          {/* Render options based on actual question type in the data */}
          {questions[currentIndex].type === "MCQ" && (
            <ul>
              {questions[currentIndex].options.map((opt, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="radio"
                      name="option"
                      value={i}
                      checked={answers[questions[currentIndex].id] === i}
                      onChange={() => handleOptionSelect(i)}
                      disabled={submitted}
                    />{" "}
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          )}

          {questions[currentIndex].type === "MSQ" && (
            <ul>
              {questions[currentIndex].options.map((opt, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="checkbox"
                      value={i}
                      checked={answers[questions[currentIndex].id]?.includes(i) || false}
                      onChange={() => handleMSQOptionToggle(i)}
                      disabled={submitted}
                    />{" "}
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          )}

          {questions[currentIndex].type === "NAT" && (
            <>
              <input
                type="text"
                placeholder="Enter your answer"
                value={answers[questions[currentIndex].id] || ""}
                onChange={handleInputChange}
                disabled={submitted}
                style={{ marginBottom: "10px" }}
              />
              {!submitted && ( // Only show calculator if not submitted
                <div className="calculator" style={{ maxWidth: "210px", margin: "0 0 15px 0" }}>
                  <div
                    className="calc-buttons"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)", // Adjusted to 4 columns for operators
                      gap: "5px",
                    }}
                  >
                    {calculatorButtons.map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => appendCalc(btn)}
                        style={{
                          height: "40px",
                          fontSize: "18px",
                          cursor: "pointer",
                          backgroundColor: (["+", "-", "*", "/"].includes(btn) || btn === "=" || btn === "AC") ? "#4CAF50" : "#e0e0e0", // Unified color for ops and special buttons
                          color: (["+", "-", "*", "/"].includes(btn) || btn === "=" || btn === "AC") ? "white" : "black",
                        }}
                        disabled={submitted}
                      >
                        {btn}
                      </button>
                    ))}
                    {/* Add AC and = buttons explicitly if they are not in calculatorButtons */}
                    <button
                        type="button"
                        onClick={() => appendCalc("AC")}
                        style={{
                            gridColumn: "span 2",
                            height: "40px",
                            fontSize: "18px",
                            backgroundColor: "#f44336",
                            color: "white",
                            cursor: "pointer",
                        }}
                        disabled={submitted}
                    >
                        AC
                    </button>
                    <button
                        type="button"
                        onClick={() => appendCalc("=")}
                        style={{
                            gridColumn: "span 2",
                            height: "40px",
                            fontSize: "18px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            cursor: "pointer",
                        }}
                        disabled={submitted}
                    >
                        =
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="navigation-buttons">
          <button onClick={handlePrevious} disabled={currentIndex === 0}>Previous</button>
          <button onClick={handleNext} disabled={currentIndex === questions.length - 1}>Save & Next</button>
          <button onClick={handleReview}>Mark for Review & Next</button>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>

      <div className="sidebar">
        <div className="timer">
          <strong>Time Left:</strong> {formatTime(timer)}
        </div>
        <div className="profile-section">
          <h3>Profile</h3>
          <img src="/uploads/default.jpg" alt="Profile" className="profile-pic" />
          {/* You should display actual user profile picture here after authentication */}
        </div>
        <h4>Question Palette</h4>
        <div className="palette">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`palette-box ${getStatusColor(q.id)}`}
              onClick={() => handleQuestionPaletteClick(i)}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="legend">
          <h5>Status Indicators</h5>
          <span>
            <span className="dot gray" /> Not Visited
          </span>
          <span>
            <span className="dot red" /> Not Answered
          </span>
          <span>
            <span className="dot green" /> Answered
          </span>
          <span>
            <span className="dot orange" /> Review Not Answered
          </span>
          <span>
            <span className="dot blue" /> Review Answered
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;