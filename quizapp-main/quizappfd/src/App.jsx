// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TestInterface from "./pages/TestInterface.jsx";
import Instructions from "./pages/Instructions.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import SolutionsPage from "./pages/SolutionsPage.jsx";
import PerformanceReport from "./pages/PerformanceReport.jsx";
import AdminLogin from "./pages/AdminLogin.jsx"; // <--- Import your AdminLogin component

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/instructions/:testId" element={<Instructions />} />
      <Route path="/test-interface/:testId" element={<TestInterface />} />
      <Route path="/report/:testId" element={<ReportPage />} />
      <Route path="/performance-report/:testId" element={<PerformanceReport />} />
      <Route path="/solutions/:testId" element={<SolutionsPage />} />

      {/* NEW: Admin Login Route */}
      <Route path="/admin/login" element={<AdminLogin />} /> {/* <--- Add this line */}
    </Routes>
  );
};

export default App;