import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Meetings.css";

export default function Meetings() {
  const initialForm = {
    title: "",
    description: "",
    scheduled_date: "",
    scheduled_time: "",
    duration: "",
    platform: "zoom",
    meet_id: "",
    password: "",
    attendees: [],
    created_by: 1
  };

  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successLabel, setSuccessLabel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5050/api/employees")
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Failed to fetch employees", err));
  }, []);

  const handleCheckbox = (e, id) => {
    const updated = e.target.checked
      ? [...form.attendees, id]
      : form.attendees.filter(empId => empId !== id);
    setForm({ ...form, attendees: updated });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post("http://localhost:5050/api/meetings/schedule", form);
      setSuccessLabel("✅ Meeting Scheduled & Invites Sent");
      setForm(initialForm);
    } catch (err) {
      console.error("Meeting schedule failed", err);
    } finally {
      setLoading(false);
    }
  };

  const selectAll = () => {
    const all = employees.map(emp => emp.id);
    setForm({ ...form, attendees: all });
  };

  const deselectAll = () => {
    setForm({ ...form, attendees: [] });
  };

  return (
    <div className="meetings-wrapper">
      <h3 className="fade-slide">📅 Schedule a New Meeting</h3>

      <form className="meet-form fade-in" onSubmit={handleSubmit}>
        <div className="grid-row">
          <input type="text" name="title" placeholder="Meeting Title" value={form.title} onChange={handleChange} required />
          <input type="date" name="scheduled_date" value={form.scheduled_date} onChange={handleChange} required />
          <input type="time" name="scheduled_time" value={form.scheduled_time} onChange={handleChange} required />
        </div>

        <div className="grid-row">
          <input type="text" name="duration" placeholder="Duration (e.g. 30 mins)" value={form.duration} onChange={handleChange} />
          <select name="platform" value={form.platform} onChange={handleChange}>
            <option value="zoom">Zoom</option>
            <option value="googlemeet">Google Meet</option>
          </select>
        </div>

        <div className="grid-row">
          <input type="text" name="meet_id" placeholder="Meeting ID or Google Link" value={form.meet_id} onChange={handleChange} required />
          <input type="text" name="password" placeholder="Meeting Password (optional)" value={form.password} onChange={handleChange} />
        </div>

        <textarea name="description" placeholder="Meeting Description" value={form.description} onChange={handleChange} />

        <div className="attendee-box fade-in-slow">
          <p>Select Attendees:</p>

          <div className="attendee-toolbar">
            <input
              type="text"
              className="attendee-search"
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="attendee-actions">
              <button type="button" onClick={selectAll}>Select All</button>
              <button type="button" onClick={deselectAll}>Deselect All</button>
            </div>
          </div>

          <div className="attendee-list">
            {employees
              .filter(emp => emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(emp => (
                <label key={emp.id} className="attendee-item">
                  <input
                    type="checkbox"
                    checked={form.attendees.includes(emp.id)}
                    onChange={(e) => handleCheckbox(e, emp.id)}
                  />
                  <span>{emp.employee_name} — <em>{emp.email}</em></span>
                </label>
              ))}
          </div>
        </div>

        {!successLabel ? (
          <button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "📨 Schedule Meeting"}
          </button>
        ) : (
          <button type="button" className="success-banner fade-slide">
            {successLabel}
            <span className="reset-btn" onClick={() => setSuccessLabel(null)}>🔄</span>
          </button>
        )}
      </form>
    </div>
  );
}
