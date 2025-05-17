import React, { useState } from "react";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    collegeName: "",
    collegeID: "",
    profilePic: null,
    idCard: null,
  });

  const [message, setMessage] = useState("");

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

    if (!formData.profilePic || !formData.idCard) {
      setMessage("Please upload both profile picture and college ID card.");
      return;
    }

    if (formData.profilePic.size < 51200 || formData.profilePic.size > 256000) {
      setMessage("Profile Picture must be between 50KB and 250KB.");
      return;
    }

    if (formData.idCard.size < 102400 || formData.idCard.size > 512000) {
      setMessage("College ID Card must be between 100KB and 500KB.");
      return;
    }

    const payload = new FormData();
    payload.append("fullName", formData.fullName);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    payload.append("collegeName", formData.collegeName);
    payload.append("collegeID", formData.collegeID);
    payload.append("profilePic", formData.profilePic);
    payload.append("idCard", formData.idCard);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(response.data.message || "Registration successful! Check your email.");
    } catch (err) {
      console.error("Axios Error:", err);
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
          name="email"
          placeholder="Email Address"
          value={formData.email}
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
          name="collegeID"
          placeholder="College ID Number"
          value={formData.collegeID}
          onChange={handleChange}
          required
        />

        <label>Upload Profile Picture (50KB - 250KB)</label>
        <input
          type="file"
          name="profilePic"
          accept="image/jpeg, image/png"
          onChange={handleChange}
          required
        />

        <label>Upload College ID Card (100KB - 500KB)</label>
        <input
          type="file"
          name="idCard"
          accept="image/jpeg, image/png"
          onChange={handleChange}
          required
        />

        <button type="submit" className="auth-button">Register</button>

        {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account?{" "}
          <span
            onClick={() => window.location.href = "/login"}
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
