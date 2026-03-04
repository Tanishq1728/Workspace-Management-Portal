import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Leaves.css";

export default function LeaveReports() {
  const [leaveData, setLeaveData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [filters, setFilters] = useState({
    empName: "",
    leaveType: "",
    month: new Date().getMonth() + 1,
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    axios.get("http://localhost:5050/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Error fetching employees:", err));

    axios.get("http://localhost:5050/api/leaves")
      .then((res) => {
        setLeaveData(res.data);
        setFilteredData(res.data);
      })
      .catch(err => console.error("Error fetching leave data:", err));
  }, []);

  useEffect(() => {
    let filtered = [...leaveData];

    if (filters.empName) {
      filtered = filtered.filter(entry =>
        entry.employeeName === filters.empName
      );
    }

    if (filters.leaveType) {
      filtered = filtered.filter(entry => entry.leave_type === filters.leaveType);
    }

    if (filters.month) {
      filtered = filtered.filter(entry =>
        new Date(entry.start_date).getMonth() + 1 === Number(filters.month)
      );
    }

    if (filters.fromDate && filters.toDate) {
      const from = new Date(filters.fromDate);
      const to = new Date(filters.toDate);
      filtered = filtered.filter(entry => {
        const start = new Date(entry.start_date);
        const end = new Date(entry.end_date);
        return (
          (start >= from && start <= to) ||
          (end >= from && end <= to) ||
          (start <= from && end >= to)
        );
      });
    }

    setFilteredData(filtered);
  }, [filters, leaveData]);

  const leaveTypes = ["Sick Leave", "Casual Leave", "Paid Leave", "Maternity Leave", "Work From Home"];

  return (
    <div>
      <h2 className="leaves-heading">📊 Leave Reports</h2>

      <div className="filter-toolbar">
        <select
          value={filters.empName}
          onChange={(e) => setFilters({ ...filters, empName: e.target.value })}
        >
          <option value="">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.employee_name}>{emp.employee_name}</option>
          ))}
        </select>

        <select
          value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value })}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={filters.leaveType}
          onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
        >
          <option value="">All Types</option>
          {leaveTypes.map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
        />
      </div>

      <h3 className="table-heading">📋 Filtered Leaves</h3>
      <div className="leave-reports-scroll">
        <table className="leave-reports-table">
          <thead>
            <tr>
              <th>Employee</th>
                        <th>Start Date</th>
          <th>End Date</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((entry) => (
          <tr key={entry.leave_id}>
            <td>{entry.employeeName}</td>
            <td>{new Date(entry.start_date).toISOString().split("T")[0]}</td>
            <td>{new Date(entry.end_date).toISOString().split("T")[0]}</td>
            <td>
              <span className={`leave-type-badge ${entry.leave_type.replace(/\s/g, "-").toLowerCase()}`}>
                {entry.leave_type}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div> {/* closes leave-reports-scroll */}
    </div>
  );
}
