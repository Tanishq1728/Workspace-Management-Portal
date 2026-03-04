// ✅ PART 1 — Projects.jsx (Preserving All Code, Document Fixes Only)

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ProjectsManager.css";
import * as bootstrap from "bootstrap";

window.bootstrap = bootstrap;

export default function ProjectsManager() {
  const initialForm = {
    project_name: "",
    client_name: "",
    team_lead: "",
    start_date: "",
    end_date: "",
    status: "active",
    status_icon: "green.png",
    description: "",
  };

  const [modalProjectId, setModalProjectId] = useState(null);
  const [modalProjectName, setModalProjectName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [docRemark, setDocRemark] = useState("");
  const [editDocId, setEditDocId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRemark, setEditRemark] = useState("");
  const [editFile, setEditFile] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successLabel, setSuccessLabel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const projectNameRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  useEffect(() => {
    fetchProjects();
    return () => {
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5050/api/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };

    if (name === "status") {
      updatedForm.status_icon =
        value === "active"
          ? "green.png"
          : value === "paused"
            ? "yellow.png"
            : "red.png";
    }

    setForm(updatedForm);
  };

  const openModal = async (projectId) => {
    setModalProjectId(projectId);
    const targetProj = projects.find((p) => p.id === projectId);
    setModalProjectName(targetProj?.project_name || "Untitled Project");

    try {
      const res = await axios.get(
        `http://localhost:5050/api/projects/${projectId}/documents`
      );
      setDocuments(res.data);
      const modalEl = document.getElementById("docModal");
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();

      modalEl.addEventListener("hidden.bs.modal", () => {
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
        document.body.style.overflow = "auto";
      });
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const handleFileUpload = async () => {
    if (!modalProjectId || !docTitle.trim() || !selectedFile) {
      console.warn("Missing field(s)", { modalProjectId, docTitle, selectedFile });
      return;
    }

    const formData = new FormData();
    formData.append("title", docTitle);
    formData.append("remark", docRemark);
    formData.append("file", selectedFile);

    try {
      await axios.post(`http://localhost:5050/api/projects/${modalProjectId}/upload`, formData);
      setDocTitle("");
      setDocRemark("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      openModal(modalProjectId);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleDelete = async (docId) => {
    await axios.delete(`http://localhost:5050/api/documents/${docId}`);
    openModal(modalProjectId);
  };

  const handleRename = async (docId, newName) => {
    await axios.put(`http://localhost:5050/api/documents/${docId}/rename`, {
      newName,
    });
    openModal(modalProjectId);
  };

  const handleEditRemark = async (docId, newRemark) => {
    await axios.put(
      `http://localhost:5050/api/documents/${docId}/edit-remark`,
      { newRemark }
    );
    openModal(modalProjectId);
  };

  const triggerEditDoc = (doc) => {
    setEditDocId(doc.id);
    setEditTitle(doc.original_name);
    setEditRemark(doc.remark || "");
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleUpdateDoc = async () => {
    if (!editDocId) return;

    if (editTitle) {
      await axios.put(`http://localhost:5050/api/documents/${editDocId}/rename`, {
        newName: editTitle,
      });
    }

    await axios.put(`http://localhost:5050/api/documents/${editDocId}/edit-remark`, {
      newRemark: editRemark,
    });

    if (editFile) {
      const formData = new FormData();
      formData.append("file", editFile);
      formData.append("title", editTitle);
      formData.append("remark", editRemark);
      await axios.post(`http://localhost:5050/api/projects/${modalProjectId}/upload`, formData);
      await axios.delete(`http://localhost:5050/api/documents/${editDocId}`);
    }

    setEditDocId(null);
    setEditFile(null);
    setEditTitle("");
    setEditRemark("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    openModal(modalProjectId);
  };
  // ✅ PART 2 — Projects.jsx Continued — All Code Preserved with Document Upload Fixes

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId
      ? `http://localhost:5050/api/projects/update/${editingId}`
      : "http://localhost:5050/api/projects/add";

    const stripTimeFromDate = (iso) => iso?.slice(0, 10);

    const completeForm = {
      ...form,
      start_date: stripTimeFromDate(form.start_date),
      end_date: stripTimeFromDate(form.end_date),
      status_icon:
        form.status === "active"
          ? "green.png"
          : form.status === "paused"
            ? "yellow.png"
            : "red.png",
    };

    try {
      await axios.post(url, completeForm);
      setSuccessLabel(editingId ? "✅ Project Updated" : "✅ Project Added");
      setForm(initialForm);
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-CA");
  };

  const formatCreationStamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${day}/${month}/${year} - ${time}`;
  };

  const handleEdit = (proj) => {
    setForm({ ...proj });
    setEditingId(proj.id);
    setSuccessLabel(null);
    setTimeout(() => {
      projectNameRef.current?.scrollIntoView({ behavior: "smooth" });
      projectNameRef.current?.focus();
    }, 100);
  };

  const cancelDocumentEdit = () => {
    setEditDocId(null);
    setEditTitle("");
    setEditRemark("");
    setEditFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    else if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = projects.filter((proj) => {
    const matchesStatus = activeFilter === "all" || proj.status === activeFilter;
    const matchesSearch = proj.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <div className="projects-manager-container">
        <h3>{editingId ? "Update Project" : "Create New Project"}</h3>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-line">
            <input
              type="text"
              name="project_name"
              placeholder="Project Name"
              value={form.project_name}
              onChange={handleChange}
              required
              ref={projectNameRef}
            />
            <input
              type="text"
              name="client_name"
              placeholder="Client Name"
              value={form.client_name}
              onChange={handleChange}
            />
            <input
              type="text"
              name="team_lead"
              placeholder="Team Lead"
              value={form.team_lead}
              onChange={handleChange}
            />
            <input
              type="date"
              name="start_date"
              value={formatDateOnly(form.start_date)}
              onChange={handleChange}
            />
            <input
              type="date"
              name="end_date"
              value={formatDateOnly(form.end_date)}
              onChange={handleChange}
            />
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="past">Past</option>
            </select>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Project Description"
            />

            {!successLabel ? (
              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : editingId ? "Update" : "Create"}
              </button>
            ) : (
              <button type="button" className="success-indicator">
                {successLabel}
                <span className="reset-icon" onClick={() => setSuccessLabel(null)}>🔄</span>
              </button>
            )}

            {editingId && (
              <button type="button" className="exit-update" onClick={() => {
                setForm(initialForm);
                setEditingId(null);
              }}>Exit Update</button>
            )}
          </div>
        </form>

        {/* ✅ Restored Filter Buttons and Search Bar */}
        <div className="status-filter-buttons">
          <button className="btn-filter all" onClick={() => setActiveFilter("all")}>All</button>
          <button className="btn-filter active" onClick={() => setActiveFilter("active")}>Active</button>
          <button className="btn-filter paused" onClick={() => setActiveFilter("paused")}>Paused</button>
          <button className="btn-filter past" onClick={() => setActiveFilter("past")}>Past</button>
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>✖</button>
          )}
        </div>

        {/* Project Cards Grid */}
        <div className="project-cards-grid">
          {filtered.map((proj) => (
            <div key={proj.id} className="project-card" onClick={() => openModal(proj.id)}>
              <div className="card-header">
                <img src={`http://localhost:5050/images/${proj.status_icon}`} alt={proj.status} className="status-icon" />
              </div>
              <h4 className="header-h4">{proj.project_name}</h4>
              <div className="card-info">
                <p><strong>Client:</strong> {proj.client_name}</p>
                <p><strong>Lead:</strong> {proj.team_lead}</p>
                <p><strong>Start:</strong> {formatDateOnly(proj.start_date)}</p>
                <p><strong>End:</strong> {formatDateOnly(proj.end_date)}</p>
              </div>
              <div className="description-box">
                <p className="description">{proj.description}</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-sm btn-warning" onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(proj);
                }}>
                  Update
                </button>
                <div className="timestamps">
                  <span className="created-stamp">Created: {formatCreationStamp(proj.created_at)}</span>
                  {proj.last_updated && (
                    <span className="updated-stamp">Last Updated: {formatCreationStamp(proj.last_updated)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📤 Modal for Document Uploads */}
      <div className="modal fade" id="docModal" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Select Documents <span style={{ fontWeight: 400 }}>({modalProjectName})</span>
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">

              {/* 🧱 Upload Form */}
              <div className="upload-section">
                <input
                  type="text"
                  placeholder="Document Name"
                  value={editDocId ? editTitle : docTitle}
                  onChange={(e) =>
                    editDocId ? setEditTitle(e.target.value) : setDocTitle(e.target.value)
                  }
                />
                <input
                  ref={editDocId ? editFileInputRef : fileInputRef}
                  type="file"
                  onChange={(e) =>
                    editDocId ? setEditFile(e.target.files[0]) : setSelectedFile(e.target.files[0])
                  }
                />
              </div>

              <div className="upload-section second-line">
                <textarea
                  placeholder="Remark (optional)"
                  value={editDocId ? editRemark : docRemark}
                  onChange={(e) =>
                    editDocId ? setEditRemark(e.target.value) : setDocRemark(e.target.value)
                  }
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <button
                    onClick={editDocId ? handleUpdateDoc : handleFileUpload}
                    disabled={!editDocId && !docTitle.trim()}
                  >
                    {editDocId ? "Update" : "Upload"}
                  </button>

                  {editDocId && (
                    <button
                      className="exit-button"
                      onClick={cancelDocumentEdit}
                    >
                      Exit Update
                    </button>
                  )}
                </div>
              </div>


              {/* 📊 Documents Table */}
              <table className="table table-sm table-striped table-hover">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Remark</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <a
                          href={`http://localhost:5050/documents/${doc.file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {doc.original_name}
                        </a>
                      </td>
                      <td>
                        <div className="remark-box">
                          {doc.remark || "—"}
                        </div>
                      </td>
                      <td >
                        <span className="doc-action" title="Edit" onClick={() => triggerEditDoc(doc)}>✏️</span>
                        <span className="doc-action" title="Delete" onClick={() => handleDelete(doc.id)}>🗑️</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
