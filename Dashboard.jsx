import axios from "axios";
import React, { useState, useEffect } from "react";
import AllEmployees from "../components/AllEmployees";
import EmployeeManager from "../components/EmployeeManager";
import ProjectsManager from "../components/Projects";
import Meetings from "../components/Meetings";
import MeetingList from "../components/MeetingList";
import Attendance from "../components/Attendance";
import Leaves from "../components/Leaves";
import LeaveReports from "../components/LeaveReports";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import cakeLogo from "../assets/cake.png";
import "./Dashboard.css";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [openDropdown, setOpenDropdown] = useState("");
  const [stats, setStats] = useState(null);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [tools, setTools] = useState([]);

  const getOrdinal = (d) => {
    const s = ["th", "st", "nd", "rd"];
    const v = d % 100;
    return d + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatDayMonth = (dateStr) => {
    const dt = new Date(dateStr);
    const day = getOrdinal(dt.getDate());
    const month = dt.toLocaleString("default", { month: "long" });
    return `${day} ${month}`;
  };

  useEffect(() => {
    axios.get("http://localhost:5050/api/dashboard/overview")
      .then(res => setStats(res.data))
      .catch(err => console.error("Stats fetch failed:", err));

    axios.get("http://localhost:5050/api/dashboard/tools")
      .then(res => setTools(res.data))
      .catch(err => console.error("Tools fetch failed:", err));
  }, []);

  const renderView = () => {
    switch (activeView) {
      case "employees":
        return <AllEmployees />;
      case "addnew":
        return <EmployeeManager />;
      case "Projects":
        return <ProjectsManager />;
      case "Meetings":
        return <Meetings />;
      case "MeetingList":
        return <MeetingList />;
      case "attendance":
        return <Attendance />;
      case "Leaves":
        return <Leaves />;
      case "LeaveReports":
        return <LeaveReports />;
      default:
        return (
          <div className="dashboard-welcome">
            <div className="welcome-banner">
              <h2>👋 Welcome to the Acrostic Dashboard</h2>
              <p>Your centralized command center — people, projects & progress all in one place.</p>
            </div>

            <div className="dashboard-analytics">
              <div className="analytics-card" onClick={() => setActiveView("employees")}>
                <h3>Employees</h3>
                <p>{stats ? stats.employees : "—"}</p>
              </div>

              <div className="analytics-card" onClick={() => setActiveView("Projects")}>
                <h3>Projects</h3>
                {stats ? (
                  <div className="project-status-bar">
                    <span className="status active">Active: {stats.projects}</span>
                    <span className="status paused">Paused: {stats.projects_paused}</span>
                    <span className="status past">Past: {stats.projects_past}</span>
                  </div>
                ) : (
                  <p>—</p>
                )}
              </div>

              <div className="analytics-card" onClick={() => setActiveView("MeetingList")}>
                <h3>Meetings Today</h3>
                <p>{stats ? `${stats.meetings} Scheduled` : "—"}</p>
              </div>

              <div className="analytics-card leaves-card" onClick={() => setActiveView("LeaveReports")}>
                <h3>Leaves</h3>
                <div className="table-scroll-container">
                <table className="leaves-table">
                  <thead>
                    <tr>
                      <th>Today</th>
                      <th>Tomorrow</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {stats?.leaves_today?.length > 0 ? (
                          stats.leaves_today.map((name, idx) => (
                            <p key={`today-${idx}`} className="leave-entry">{name}</p>
                          ))
                        ) : (
                          <p className="leave-entry">—</p>
                        )}
                      </td>
                      <td>
                        {stats?.leaves_tomorrow?.length > 0 ? (
                          stats.leaves_tomorrow.map((name, idx) => (
                            <p key={`tomorrow-${idx}`} className="leave-entry">{name}</p>
                          ))
                        ) : (
                          <p className="leave-entry">—</p>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
            <div className="dashboard-birthdays">
              <div className="birthdays-card">
                <div className="birthday-header-row">
                  <img src={cakeLogo} alt="Birthday" className="birthday-logo" />
                  <h3 className="birthday-title">Birthdays</h3>
                  <div className="birthday-switch">
                    <span>{showUpcoming ? "Upcoming" : "This Month"}</span>
                    <button
                      className="switch-arrow"
                      onClick={() => setShowUpcoming(!showUpcoming)}
                    >
                      ➡️
                    </button>
                  </div>
                </div>

                <div className="birthday-list">
                  {stats ? (
                    (showUpcoming ? stats.upcoming_birthdays : stats.birthdays_this_month).length > 0 ? (
                      (showUpcoming ? stats.upcoming_birthdays : stats.birthdays_this_month).map((b, i) => (
                        <p key={i}>{formatDayMonth(b.dob)} – {b.name}</p>
                      ))
                    ) : (
                      <p>—</p>
                    )
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>
            </div>
            <div className="dashboard-tools">
              <h3>🧩 Acrostic Software Suite</h3>
              <div className="tool-card-grid">
                <div className="tool-card" onClick={() => window.open("https://www.aarogyaneeti.com/", "_blank")}>
                  <img src="http://localhost:5050/images/tools/aarogyaneeti.png" alt="Aarogyaneeti" style={{ height: "80px", objectFit: "contain", marginBottom: "0.5rem" }} />
                  <h4>Aarogyaneeti</h4>
                  <p>Traversing your next in Healthcare.</p>
                </div>

                <div className="tool-card" onClick={() => window.open("https://acropathlab.com/", "_blank")}>
                  <img src="http://localhost:5050/images/tools/acropath.png" alt="AcroPath" style={{ height: "80px", objectFit: "contain", marginBottom: "0.5rem" }} />
                  <h4>AcroPath</h4>
                  <p>Fast & accurate pathology integration.</p>
                </div>

                <div className="tool-card" onClick={() => window.open("https://acrohealth.in/", "_blank")}>
                  <img src="http://localhost:5050/images/tools/acrohealth.png" alt="AcroHealth" style={{ height: "80px", objectFit: "contain", marginBottom: "0.5rem" }} />
                  <h4>AcroHealth</h4>
                  <p>Manage your diagnostic center with ease.</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const handleHover = (key) => () => setOpenDropdown(key);
  const handleLeave = () => setOpenDropdown("");

  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.8,
        }}
        src="/video.mp4"
      />
      <Navbar expand="lg" className="custom-navbar py-3">
        <div className="logo-wrapper">
          <Navbar.Brand href="/dashboard">
            <motion.img
              src={logo}
              alt="Acrostic Logo"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity }}
              style={{ height: "42px", pointerEvents: "none", borderRadius: "4px" }}
            />
          </Navbar.Brand>
        </div>
        <Navbar.Toggle aria-controls="dashboard-navbar" />
        <Navbar.Collapse id="dashboard-navbar">
          <Nav className="ms-auto">
            {["employees", "projects", "meetings", "reports"].map((key) => (
              <motion.div
                key={key}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                onMouseEnter={handleHover(key)}
                onMouseLeave={handleLeave}
              >
                <NavDropdown
                  className="nav-button dropdown"
                  title={
                    key === "employees"
                      ? "👤 Employees"
                      : key === "projects"
                        ? "🗂️ Projects"
                        : key === "meetings"
                          ? "🗓️ Meetings"
                          : "📊 Reports"
                  }
                  id={`${key}-nav-dropdown`}
                  show={openDropdown === key}
                >
                  <AnimatePresence>
                    {openDropdown === key && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {key === "employees" && (
                          <>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("employees")}>
                              All Employees
                            </NavDropdown.Item>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("addnew")}>
                              Add New
                            </NavDropdown.Item>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("Leaves")}>
                              Leaves
                            </NavDropdown.Item>
                          </>
                        )}
                        {key === "projects" && (
                          <NavDropdown.Item as="button" onClick={() => setActiveView("Projects")}>
                            Create Project
                          </NavDropdown.Item>
                        )}
                        {key === "meetings" && (
                          <>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("Meetings")}>
                              Schedule Meeting
                            </NavDropdown.Item>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("MeetingList")}>
                              View Meetings
                            </NavDropdown.Item>
                          </>
                        )}
                        {key === "reports" && (
                          <>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("attendance")}>
                              Attendance
                            </NavDropdown.Item>
                            <NavDropdown.Item as="button" onClick={() => setActiveView("LeaveReports")}>
                              Leave Reports
                            </NavDropdown.Item>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavDropdown>
              </motion.div>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <div className="dashboard-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
