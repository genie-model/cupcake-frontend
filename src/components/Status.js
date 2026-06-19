import React from "react";
import api from "../api";

const Status = ({ job, refreshJobs, onSelectJob }) => {
  if (!job) {
    return <div>No job selected</div>;
  }

  const divStyle = {
    display: 'block',
    backgroundColor: '#f0f0f0',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    padding: '400px'
  };

  const textContainerStyle = {
    top: '0',
    left: '0',
    right: '0',
    bottom: '0'
  };

  const handleDownloadJob = async () => {
    if (!job?.name) return;
    try {
      const response = await api.get(
        `/jobs/${job.name}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${job.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading job archive:", err);
      alert("Failed to download job data.");
    }
  };

  // --- Publish (own COMPLETE/PAUSED jobs) -------------------------------------
  const handlePublish = async () => {
    const title = window.prompt("Title for the published job (others will see this):", job.name);
    if (!title) return;
    const description = window.prompt("Optional description:", "") || "";
    try {
      const res = await api.post(`/publish/${job.name}`, { title, description });
      alert(res.data.message || "Published.");
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not publish job.");
    }
  };

  // --- Reference actions (a published job added to my panel) ------------------
  const handleRestart = async () => {
    const rl = window.prompt("Run length (model years) for your continuation run:", "1000");
    if (!rl) return;
    const runLength = parseInt(rl, 10);
    if (isNaN(runLength) || runLength <= 0) {
      alert("Please enter a positive run length.");
      return;
    }
    const name = window.prompt("Name for your new restart job:", `${job.name}_restart`);
    if (!name) return;
    try {
      const res = await api.post(`/published/${job.publish_id}/restart`, {
        job_name: name,
        run_length: runLength,
      });
      alert(res.data.message || "Restart job created.");
      if (refreshJobs) refreshJobs();
      if (onSelectJob && res.data.job_name) onSelectJob(res.data.job_name);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not create restart job.");
    }
  };

  const handleClone = async () => {
    const name = window.prompt("Name for your full editable copy:", `${job.name}_copy`);
    if (!name) return;
    try {
      const res = await api.post(`/published/${job.publish_id}/clone`, { job_name: name });
      alert(res.data.message || "Cloned.");
      if (refreshJobs) refreshJobs();
      if (onSelectJob && res.data.job_name) onSelectJob(res.data.job_name);
    } catch (err) {
      alert(err?.response?.data?.detail || "Could not clone job.");
    }
  };

  const isReference = !!job.published_ref;
  const isDownloadDisabled = !isReference && job.status !== "COMPLETE";
  const canPublish = !isReference && (job.status === "COMPLETE" || job.status === "PAUSED");

  const actionBtn = (bg, disabled = false) => ({
    padding: "8px 16px",
    backgroundColor: disabled ? "#ccc" : bg,
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    marginRight: "8px",
  });

  return (
    <div style={divStyle}>
      <div style={textContainerStyle}>
        {isReference && (
          <div style={{
            background: "#eef4fb", border: "1px solid #b6d4f2", borderRadius: "5px",
            padding: "8px 12px", marginBottom: "12px", fontSize: "13px", color: "#2c5d8f",
          }}>
            📦 Published job — shared by <strong>{job.published_by}</strong> (read-only).
            Use “Restart from this” to continue it, or “Clone” for a full editable copy.
          </div>
        )}
        <div>
          <label>Job Path:</label>
          <input type="text" value={job.path} readOnly />
        </div>
        <div>
          <label>Job Status:</label>
          <input type="text" value={job.status} readOnly />
        </div>
        <div>
          <label>Run Length:</label>
          <input type="text" value={job.run_length} readOnly />
        </div>
        <div style={{ marginTop: "16px" }}>
          <button onClick={handleDownloadJob} disabled={isDownloadDisabled} style={actionBtn("#4A90E2", isDownloadDisabled)}>
            Download Job Data (.zip)
          </button>

          {isReference && (
            <>
              <button onClick={handleRestart} style={actionBtn("#88d500")}>
                Restart from this
              </button>
              <button onClick={handleClone} style={actionBtn("#dba405")}>
                Clone
              </button>
            </>
          )}

          {canPublish && (
            <button onClick={handlePublish} style={actionBtn("#05a4db")}>
              Publish
            </button>
          )}

          {isDownloadDisabled && (
            <div style={{ marginTop: "6px", color: "#777", fontSize: "12px" }}>
              Download available when job status is COMPLETE.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Status;
