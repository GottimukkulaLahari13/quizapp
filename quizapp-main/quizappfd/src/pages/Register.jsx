import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formdata = new FormData();
    formdata.append("fullName", formData.fullName);
    formdata.append("email", formData.emailAddress); // match backend field
    formdata.append("phone", formData.phone);
    formdata.append("collegeName", formData.collegeName);
    formdata.append("collegeID", formData.collegeId); // match backend field
    formdata.append("profilePic", formData.profilePic);
    formdata.append("idCard", formData.collegeIdCard); // match backend field

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formdata, config,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message || "Registered successfully!");

      // Redirect after short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <h2>Registration Form</h2>
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

        {message && <p style={{ color: "lightgreen", marginTop: "10px" }}>{message}</p>}

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;  