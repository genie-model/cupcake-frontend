import React, { useState, useEffect } from "react";
import api from "../api";

// Catalog of published jobs. Browse by publisher email, add a published job to
// your own panel (as a read-only reference), or — for your own entries —
// unpublish them.
const BrowsePublished = ({ myEmail, refreshJobs, onSelectJob, onClose }) => {
  const [emailFilter, setEmailFilter] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const search = async (email) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get("/published", {
        params: email ? { email } : {},
      });
      setEntries(res.data.published || []);
    } catch (err) {
      setMessage("Could not load the catalog.");
    } finally {
      setLoading(false);
    }
  };

  // Show the whole catalog on first open.
  useEffect(() => {
    search("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (entry) => {
    try {
      const res = await api.post(`/published/${entry.id}/add`);
      setMessage(res.data.message || "Added.");
      if (refreshJobs) refreshJobs();
      if (onSelectJob && res.data.job_name) onSelectJob(res.data.job_name);
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Could not add to panel.");
    }
  };

  const handleUnpublish = async (entry) => {
    if (!window.confirm(`Unpublish "${entry.title}"? Anyone who hasn't restarted/cloned it will lose access.`)) {
      return;
    }
    try {
      await api.delete(`/publish/${entry.id}`);
      setMessage("Unpublished.");
      search(emailFilter);
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Could not unpublish.");
    }
  };

  const fmtSize = (b) => {
    if (!b && b !== 0) return "—";
    if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
    if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
    if (b > 1e3) return `${(b / 1e3).toFixed(0)} KB`;
    return `${b} B`;
  };

  const cellStyle = { padding: "6px 10px", borderBottom: "1px solid #e0e0e0", fontSize: "13px", verticalAlign: "top" };
  const btn = (bg) => ({
    padding: "4px 10px", backgroundColor: bg, color: "#fff", border: "none",
    borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginRight: "6px",
  });

  return (
    <div style={{ padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <h3 style={{ margin: 0 }}>Browse Published Jobs</h3>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: "auto", ...btn("#888") }}>
            Close
          </button>
        )}
      </div>

      <div style={{ marginBottom: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
        <label style={{ fontSize: "13px" }}>Filter by publisher email:</label>
        <input
          type="text"
          value={emailFilter}
          placeholder="someone@example.com (blank = all)"
          onChange={(e) => setEmailFilter(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(emailFilter.trim()); }}
          style={{ flex: "0 1 320px", padding: "5px 8px" }}
        />
        <button onClick={() => search(emailFilter.trim())} style={btn("#4A90E2")}>Search</button>
        <button onClick={() => { setEmailFilter(""); search(""); }} style={btn("#888")}>Show all</button>
      </div>

      {message && <div style={{ color: "#555", fontSize: "13px", marginBottom: "10px" }}>{message}</div>}
      {loading && <div style={{ color: "#888", fontSize: "13px" }}>Loading…</div>}

      {!loading && entries.length === 0 && (
        <div style={{ color: "#888", fontSize: "14px" }}>No published jobs found.</div>
      )}

      {!loading && entries.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#eef4fb" }}>
              <th style={cellStyle}>Title</th>
              <th style={cellStyle}>Publisher</th>
              <th style={cellStyle}>Base config</th>
              <th style={cellStyle}>Stage</th>
              <th style={cellStyle}>Run length</th>
              <th style={cellStyle}>Size</th>
              <th style={cellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td style={cellStyle}>
                  <strong>{e.title}</strong>
                  {e.description ? <div style={{ color: "#777" }}>{e.description}</div> : null}
                </td>
                <td style={cellStyle}>{e.owner_email}</td>
                <td style={cellStyle}>{e.base_config || "—"}</td>
                <td style={cellStyle}>
                  {e.stage}{e.stage_year ? ` @ yr ${e.stage_year}` : ""}
                </td>
                <td style={cellStyle}>{e.run_length || "—"}</td>
                <td style={cellStyle}>{fmtSize(e.size_bytes)}</td>
                <td style={cellStyle}>
                  <button onClick={() => handleAdd(e)} style={btn("#4A90E2")}>Add to my panel</button>
                  {myEmail && e.owner_email &&
                    myEmail.toLowerCase() === e.owner_email.toLowerCase() && (
                      <button onClick={() => handleUnpublish(e)} style={btn("#fa2e00")}>Unpublish</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BrowsePublished;
