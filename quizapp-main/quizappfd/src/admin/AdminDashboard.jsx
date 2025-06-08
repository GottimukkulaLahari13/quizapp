import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = ({ token }) => {
  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({ name: "", description: "" });

  const fetchTests = async () => {
    const res = await axios.get("http://localhost:5000/api/admin/tests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTests(res.data);
  };

  useEffect(() => { fetchTests(); }, []);

  const handleCreate = async () => {
    await axios.post("http://localhost:5000/api/admin/tests", newTest, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTests();
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/admin/tests/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTests();
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div>
        <input placeholder="Test Name" onChange={e => setNewTest({...newTest, name: e.target.value})} />
        <input placeholder="Description" onChange={e => setNewTest({...newTest, description: e.target.value})} />
        <button onClick={handleCreate}>Create Test</button>
      </div>
      <ul>
        {tests.map(test => (
          <li key={test.id}>
            {test.name} - {test.description}
            <button onClick={() => handleDelete(test.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
