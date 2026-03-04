import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Attendance.css";

export default function Attendance() {
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // ✅ Month as 1–12
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [syncing, setSyncing] = useState(false);


  useEffect(() => {
    const stored = localStorage.getItem("lastSyncedTime");
    if (stored) {
      setLastSyncedTime(stored);
    }
    Promise.all([
      axios.get("http://localhost:5050/api/attendance"),
      axios.get("http://localhost:5050/api/employees")
    ])
      .then(([logRes, empRes]) => {
        setLogs(logRes.data);
        setEmployees(empRes.data);
      })
      .catch((err) => console.error("Fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const bioIdToName = {};
  employees.forEach(emp => {
    bioIdToName[emp.bio_id] = emp.employee_name || null;
  });

  const availableYears = Array.from(
    new Set(logs.map(log => new Date(log.punch_time).getFullYear()))
  ).sort((a, b) => b - a);

  const enrichedLogs = logs
    .filter(log => new Date(log.punch_time).getFullYear() === selectedYear)
    .sort((a, b) => new Date(b.punch_time) - new Date(a.punch_time));


  const filteredLogs = enrichedLogs.filter(log => {
    const logTime = new Date(log.punch_time);
    const name = (bioIdToName[log.bio_id] || "").toLowerCase();

    const logMonth = logTime.getMonth() + 1;
    const logYear = logTime.getFullYear();

    const searchMatch =
      log.bio_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase());

    const monthMatch =
      (!fromDate && !toDate && logYear === selectedYear && logMonth === selectedMonth);

    const customDateMatch =
      (fromDate && toDate && logTime >= new Date(fromDate) && logTime <= new Date(toDate));

    const dateMatch = monthMatch || customDateMatch;

    const dropdownMatch =
      !selectedEmployee || bioIdToName[log.bio_id] === selectedEmployee;

    return searchMatch && dateMatch && dropdownMatch;
  });


  const formatTime = (time) =>
    new Date(time).toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  return (
    <div className="attendance-container">
      <div>
        <div className="d-flex justify-content-between align-center">
          <h3>📆 Attendance Logs</h3>
          <button
            className="sync-button"
            onClick={() => {
              setSyncing(true);
              axios.get("http://localhost:5050/api/zkconnector/sync")
                .then((res) => {
                  const timestamp = res.data.timestamp;

                  // ✅ Persist to localStorage
                  localStorage.setItem("lastSyncedTime", timestamp);

                  setLastSyncedTime(timestamp);
                  // Refresh attendance
                  return axios.get("http://localhost:5050/api/attendance");
                })
                .then(res => setLogs(res.data))
                .catch((err) => console.error("Sync error:", err))
                .finally(() => setSyncing(false));
            }}
          >
            {syncing ? "⏳ Syncing with Machine..." : "📥 Download from Machine"}
          </button>

        </div>

        <p className="sync-status">
          {lastSyncedTime && `Last Downloaded: ${new Date(lastSyncedTime).toLocaleString("en-GB", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })}`}
        </p>
      </div>

      <div className="attendance-filters">
        <input
          type="text"
          placeholder="Search by Name or Bio ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.bio_id} value={emp.employee_name}>
              {emp.employee_name}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>⏳ Loading attendance records...</p>
      ) : (
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Bio ID</th>
                <th>Name</th>
                <th>Punch Time</th>
                <th>Type</th>
                <th>Synced At</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.bio_id}</td>
                    <td>{bioIdToName[log.bio_id] || "—"}</td>
                    <td>{formatTime(log.punch_time)}</td>
                    <td className={log.punch_type === "in" ? "punch-in" : "punch-out"}>
                      {log.punch_type.toUpperCase()}
                      {log.status_note && (
                        <span className="status-note"> ({log.status_note})</span>
                      )}
                    </td>
                    <td>{formatTime(log.synced_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No matching records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

  );
}
