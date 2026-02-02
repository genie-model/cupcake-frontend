import React from "react";
import axios from "axios";

const Status = ({ job }) => {
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
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.get(
        `${apiUrl}/jobs/${job.name}/download`,
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

  const isDownloadDisabled = job.status !== "COMPLETE";

  return (
    <div style={divStyle}>
      <div style={textContainerStyle}>
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
        <div>
          <label>T100:</label>
          <input type="text" value={job.t100} readOnly />
        </div>
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={handleDownloadJob}
            disabled={isDownloadDisabled}
            style={{
              padding: "8px 16px",
              backgroundColor: isDownloadDisabled ? "#ccc" : "#4A90E2",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: isDownloadDisabled ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Download Job Data (.zip)
          </button>
          {isDownloadDisabled && (
            <div style={{ marginTop: "6px", color: "#777", fontSize: "12px" }}>
              Available when job status is COMPLETE.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Status;
