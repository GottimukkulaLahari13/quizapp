import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom"; 

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

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const randomPassword = generatePassword();

    try {
      // Now actually send email using PHP backend
      const response = await fetch('http://localhost/examportal/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailAddress: formData.emailAddress,
          password: randomPassword,
        }),
      });

      const result = await response.json();
      console.log(result.message);

      setMessage("User registered successfully! Check your email for password.");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>

        <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
        <input type="email" name="emailAddress" placeholder="Email Address" value={formData.emailAddress} onChange={handleChange} required />
        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
        <input type="text" name="collegeName" placeholder="College Name" value={formData.collegeName} onChange={handleChange} required />
        <input type="text" name="collegeId" placeholder="College ID Number" value={formData.collegeId} onChange={handleChange} required />
        
        <label>Upload Profile Picture (50KB - 250KB)</label>
        <input type="file" name="profilePic" accept="image/*" onChange={handleChange} required />
        
        <label>Upload College ID Card (100KB - 500KB)</label>
        <input type="file" name="collegeIdCard" accept="image/*" onChange={handleChange} required />

        <button type="submit" className="auth-button">Register</button>

        {message && <p style={{ color: 'lightgreen', marginTop: '10px' }}>{message}</p>}
        
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Already have an account? 
          <span onClick={() => navigate('/login')} style={{ color: 'blue', cursor: 'pointer' }}>
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
