// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TestInterface from "./pages/TestInterface.jsx";
import Instructions from "./pages/Instructions.jsx"; // ✅ Import Instructions

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/test/:testId" element={<Instructions />} /> {/* ✅ Instructions page */}
      <Route path="/test-interface/:testId" element={<TestInterface />} /> {/* ✅ Test page */}
    </Routes>
  );
};

export default App;
