// src/components/BackgroundVideo.jsx
import React from "react";
import "../pages/Dashboard.css"; // assuming your video styles are already there

export default function BackgroundVideo() {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="bg-video"
      src="/video.mp4"
      type="video/mp4"
    />
  );
}
