import React, { useEffect, useState } from "react";
import axios from "axios";
import greenIcon from "../assets/green2.png";
import redIcon from "../assets/red2.png";
import "./MeetingList.css";

export default function MeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5050/api/meetings")
      .then((res) => setMeetings(res.data))
      .catch((err) => console.error("Fetch meetings failed", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="meeting-list-wrapper">
      <h3 className="fade-in">📋 Scheduled Meetings</h3>

      {loading ? (
        <p>Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <p>No meetings scheduled yet.</p>
      ) : (
        <div className="meeting-card-container">
          {meetings.map((meet) => (
            <div key={meet.id} className="meeting-card-item">
              <img
                src={meet.status === "upcoming" ? greenIcon : redIcon}
                alt="Meeting status"
                className="meeting-top-img"
              />

              <h5 className="meeting-title">{meet.title}</h5>

              <p className="platform-label">
                Platform: <strong>{meet.platform}</strong>
              </p>
              <div className="meeting-details">
                <p><strong>Date:</strong> {meet.scheduled_date}</p>
                <p><strong>Time:</strong> {meet.scheduled_time}</p>
                <p><strong>Duration:</strong> {meet.duration}</p>
              </div>

              <div className="meeting-access">
                <strong>Access:</strong>
                <p>
                  {meet.platform === "zoom"
                    ? `Zoom ID: ${meet.meet_id}${meet.password ? ` | Password: ${meet.password}` : ""}`
                    : `Google Meet Link: ${meet.meet_id}`}
                </p>
              </div>

              {meet.description && (
                <p className="meeting-desc"><strong>Description:</strong> {meet.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
