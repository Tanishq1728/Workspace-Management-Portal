import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EmployeeManager.css";

export default function EmployeeManager() {
  const initialForm = {
    employee_name: "",
    gender: "",
    age: "",
    designation: "",
    department: "",
    contact_no: "",
    email: "",
    dob: null,
    image: null,
    image_filename: "",
    bio_id: "",
  };

  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successLabel, setSuccessLabel] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5050/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Fetch failed", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setForm((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "image" && !val) return;
      formData.append(key, val ?? "");
    });

    try {
      const url = editingId
        ? `http://localhost:5050/api/employees/update/${editingId}`
        : "http://localhost:5050/api/employees/add";

      await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessLabel(editingId ? "✅ Employee Updated" : "✅ Employee Added");
      setForm(initialForm);
      setEditingId(null);

      const updated = await axios.get("http://localhost:5050/api/employees");
      setEmployees(updated.data);
    } catch (error) {
      console.error("Submit failed:", error);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return console.error("Invalid ID for deletion:", id);

    try {
      await axios.delete(`http://localhost:5050/api/employees/delete/${id}`);
      const updated = await axios.get("http://localhost:5050/api/employees");
      setEmployees(updated.data);
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  const handleEdit = (emp) => {
    setForm({
      employee_name: emp.employee_name?.trim() || "",
      gender: emp.gender?.trim() || "",
      age: emp.age || "",
      designation: emp.designation?.trim() || "",
      department: emp.department?.trim() || "",
      contact_no: emp.contact_no?.trim() || "",
      email: emp.email?.trim() || "",
      dob: emp.dob ? emp.dob.split("T")[0] : "",
      image_filename: emp.image_filename ?? "",
      bio_id: emp.bio_id?.toString() || "",
      image: null,
    });
    setEditingId(emp.id);
    setSuccessLabel(null);
    document.querySelector('input[type="file"]').value = null;
  };

  const copyEmail = (email) => {
    navigator.clipboard.writeText(email);
  };

  const filteredEmployees = employees.filter((emp) =>
    (emp.employee_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employee-manager-container">
      <h3>{editingId ? "Update Employee" : "Add New Employee"}</h3>

      <form className="employee-form" onSubmit={handleSubmit}>
        <div className="form-line">
          <input type="text" name="employee_name" placeholder="Name" value={form.employee_name} onChange={handleChange} required />
          <input type="text" name="gender" placeholder="Gender" value={form.gender} onChange={handleChange} required />
          <input type="number" name="age" placeholder="Age" value={form.age} onChange={handleChange} required />
          <input type="text" name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} required />
          <input type="text" name="department" placeholder="Department" value={form.department} onChange={handleChange} required />
          <input type="text" name="contact_no" placeholder="Contact" value={form.contact_no} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input type="date" name="dob" placeholder="Date of Birth" value={form.dob} onChange={handleChange} required />
          <input type="text" name="bio_id" placeholder="Bio ID" value={form.bio_id} onChange={handleChange} required />

          {editingId && form.image_filename && (
            <img
              src={`http://localhost:5050/images/${form.image_filename}`}
              alt="Current"
              className="form-image-preview"
            />
          )}

          <input type="file" onChange={handleImageChange} className="file-input" />

          {/* {message && <p className="form-error">{message}</p>} */}

          {!successLabel ? (
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : editingId ? "Update" : "Add"}
            </button>
          ) : (
            <button type="button" className="success-indicator">
              {successLabel}
              <span className="reset-icon" onClick={() => setSuccessLabel(null)}>🔄</span>
            </button>
          )}

          {editingId && (
            <button
              type="button"
              className="exit-update"
              onClick={() => {
                setForm(initialForm);
                setEditingId(null);
              }}
            >
              Exit Update
            </button>
          )}
        </div>
      </form>

      <div className="table-section">
        <h4>All Employees</h4>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✖
            </button>
          )}
        </div>

        <div className="table-scroll">
          <table className="table table-striped table-hover">
            <thead className="table-dark sticky-top">
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>DOB</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Bio ID</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_name}</td>
                    <td>{emp.gender || "—"}</td>
                    <td>{emp.age || "—"}</td>
                    <td>
                      {emp.dob
                        ? new Date(emp.dob).toISOString().split("T")[0]
                        : "—"}
                    </td>
                    <td>{emp.designation || "—"}</td>
                    <td>{emp.department || "—"}</td>
                    <td>{emp.contact_no || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <a href={`mailto:${emp.email}`}>{emp.email}</a>
                        <span title="Copy email" style={{ cursor: "pointer" }} onClick={() => copyEmail(emp.email)}>📋</span>
                      </div>
                    </td>
                    <td>{emp.bio_id || "—"}</td>
                    <td>
                      <img
                        src={`http://localhost:5050/images/${emp.image_filename || "default.png"}`}
                        alt="emp"
                        style={{ width: "50px" }}
                      />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(emp)}>Update</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center">No matching employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
