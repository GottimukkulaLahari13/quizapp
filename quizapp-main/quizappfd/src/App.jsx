import React from "react";
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TestInterface from "./pages/TestInterface.jsx"; // ✅ Import this

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/test/:testId" element={<TestInterface />} /> {/* ✅ Route added */}
    </Routes>
  );
};

export default App;
