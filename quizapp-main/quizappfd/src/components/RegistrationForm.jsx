import { useState } from 'react';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    collegeName: '',
    collegeID: '',
    profilePic: null,
    idCard: null,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.fullName) tempErrors.fullName = 'Required';
    if (!formData.email) tempErrors.email = 'Required';
    if (!formData.phone) tempErrors.phone = 'Required';
    if (!formData.collegeName) tempErrors.collegeName = 'Required';
    if (!formData.collegeID) tempErrors.collegeID = 'Required';

    if (!formData.profilePic) tempErrors.profilePic = 'Required';
    else if (formData.profilePic.size < 51200 || formData.profilePic.size > 256000)
      tempErrors.profilePic = 'File size must be 50KB to 250KB';

    if (!formData.idCard) tempErrors.idCard = 'Required';
    else if (formData.idCard.size < 102400 || formData.idCard.size > 512000)
      tempErrors.idCard = 'File size must be 100KB to 500KB';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formdata = new FormData();
    for (let key in formData) {
      formdata.append(key, formData[key]);
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: formdata,
      });
      const data = await res.json();
      if (res.ok) {
        alert('Registration successful! Check your email.');
        // Optionally redirect or clear form
      } else {
        alert(data.message || 'Error during registration');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong.');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-2xl shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-4">Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="fullName" placeholder="Full Name" className="w-full p-2 border rounded" onChange={handleChange} />
        {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}

        <input name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={handleChange} />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input name="phone" type="tel" placeholder="Phone Number" className="w-full p-2 border rounded" onChange={handleChange} />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

        <input name="collegeName" placeholder="College Name" className="w-full p-2 border rounded" onChange={handleChange} />
        {errors.collegeName && <p className="text-red-500 text-sm">{errors.collegeName}</p>}

        <input name="collegeID" placeholder="College ID Number" className="w-full p-2 border rounded" onChange={handleChange} />
        {errors.collegeID && <p className="text-red-500 text-sm">{errors.collegeID}</p>}

        <label className="block">
          Upload Profile Picture (50KB - 250KB):
          <input type="file" name="profilePic" accept="image/*" onChange={handleChange} className="mt-1" />
        </label>
        {errors.profilePic && <p className="text-red-500 text-sm">{errors.profilePic}</p>}

        <label className="block">
          Upload College ID Card (100KB - 500KB):
          <input type="file" name="idCard" accept="image/*" onChange={handleChange} className="mt-1" />
        </label>
        {errors.idCard && <p className="text-red-500 text-sm">{errors.idCard}</p>}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
    </div>
  );
}
