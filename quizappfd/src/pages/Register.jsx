import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate from react-router-dom

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    emailAddress: "",
    phone: "",
    collegeName: "",
    collegeId: "",
    profilePic: null,
    collegeIdCard: null,
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();  // Initialize useNavigate hook

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Normally here you'd send data to backend
    setMessage("User registered successfully!");
    
    // Redirect to login page after successful registration
    setTimeout(() => {
      navigate("/login");  // Redirect to login page
    }, 2000);  // Redirect after 2 seconds to show success message
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="emailAddress"
          placeholder="Email Address"
          value={formData.emailAddress}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="collegeName"
          placeholder="College Name"
          value={formData.collegeName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="collegeId"
          placeholder="College ID Number"
          value={formData.collegeId}
          onChange={handleChange}
          required
        />
        <label>Upload Profile Picture (50KB - 250KB)</label>
        <input
          type="file"
          name="profilePic"
          accept="image/*"
          onChange={handleChange}
          required
        />
        <label>Upload College ID Card (100KB - 500KB)</label>
        <input
          type="file"
          name="collegeIdCard"
          accept="image/*"
          onChange={handleChange}
          required
        />
        <button type="submit" className="auth-button">Register</button>
        
        {message && <p style={{ color: 'lightgreen', marginTop: '10px' }}>{message}</p>}
        
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Already have an account? 
          <span 
            onClick={() => navigate('/login')} 
            style={{ color: 'blue', cursor: 'pointer' }}
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
