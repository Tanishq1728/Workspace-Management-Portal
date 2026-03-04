import React, { useState, useEffect } from "react";
import "./Leaves.css";
import axios from "axios";

export default function Leaves() {
  const [employees, setEmployees] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [formValues, setFormValues] = useState({
    emp_id: "",
    startDate: "",
    endDate: "",
    leaveType: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const leaveTypes = ["Sick Leave", "Casual Leave", "Paid Leave", "Maternity Leave", "Work From Home"];

  const fetchData = () => {
    axios.get("http://localhost:5050/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees:", err));

    axios.get("http://localhost:5050/api/leaves")
      .then((res) => setLeaveData(res.data))
      .catch((err) => console.error("Error fetching leaves:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = `http://localhost:5050/api/leaves${editingId ? "/" + editingId : ""}`;
    const method = editingId ? axios.put : axios.post;

    method(url, formValues)
      .then(() => {
        fetchData();
        setFormValues({
          emp_id: "",
          startDate: "",
          endDate: "",
          leaveType: "",
        });
        if (editingId) {
          setUpdateSuccess(true); // ✅ success message stays until manual reset
        }
        else {
          setEditingId(null);
        }
      })
      .catch(err => console.error("Error saving leave:", err));
  };

  return (
    <div className="leaves-container">
      <h2 className="leaves-heading">📆 Leave Request Portal</h2>
      <form className="leaves-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Employee</label>
          <select name="emp_id" value={formValues.emp_id} onChange={handleChange} required>
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employee_name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" name="startDate" value={formValues.startDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" name="endDate" value={formValues.endDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Leave Type</label>
          <select name="leaveType" value={formValues.leaveType} onChange={handleChange} required>
            <option value="">Select Type</option>
            {leaveTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {editingId ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="submit"
              className="submit-button update-btn"
              disabled={updateSuccess}
            >
              {updateSuccess ? "✅ Update Success!" : "Update Leave"}
            </button>
            <span
              style={{ fontSize: "1.5rem", cursor: "pointer" }}
              title="Cancel Update"
              onClick={() => {
                setFormValues({
                  emp_id: "",
                  startDate: "",
                  endDate: "",
                  leaveType: "",
                });
                setEditingId(null);
                setUpdateSuccess(false);
              }}
            >
              ↩️
            </span>
          </div>
        ) : (
          <button type="submit" className="submit-button">Add Leave</button>
        )}
      </form>

      <div className="leave-table-wrapper">
        <h3 className="table-heading">📋 Leave History</h3>
        <div className="leave-table-scroll">
          <table className="leave-table-history">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveData.map((entry) => (
                <tr key={entry.leave_id}>
                  <td>{entry.employeeName}</td>
                  <td>{new Date(entry.start_date).toISOString().split("T")[0]}</td>
                  <td>{new Date(entry.end_date).toISOString().split("T")[0]}</td>
                  <td>
                    <span className={`leave-type-badge ${entry.leave_type.replace(/\s/g, "-").toLowerCase()}`}>
                      {entry.leave_type}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn update-btn"
                      onClick={() => {
                        setFormValues({
                          emp_id: employees.find(e => e.employee_name === entry.employeeName)?.id || "",
                          startDate: entry.start_date,
                          endDate: entry.end_date,
                          leaveType: entry.leave_type,
                        });
                        setEditingId(entry.leave_id);
                        document.querySelector("select[name='emp_id']")?.focus();
                      }}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        axios.delete(`http://localhost:5050/api/leaves/${entry.leave_id}`)
                          .then(() => {
                            setLeaveData(prev => prev.filter(l => l.leave_id !== entry.leave_id));
                          })
                          .catch(err => console.error("Error deleting leave:", err));
                      }}
                      className="action-btn delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
