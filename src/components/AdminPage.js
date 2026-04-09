import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import "./AdminPage.css";

const AdminPage = ({ onLogout, onExitAdmin }) => {
  const [users, setUsers] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userJobs, setUserJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load users");
    }
  }, []);

  const fetchActiveRuns = useCallback(async () => {
    try {
      const res = await api.get("/admin/runs");
      setActiveRuns(res.data.runs);
    } catch (err) {
      console.error("Failed to load active runs", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchUsers(), fetchActiveRuns()]);
    setLoading(false);
  }, [fetchUsers, fetchActiveRuns]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleExpandUser = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserJobs([]);
      return;
    }
    setExpandedUser(userId);
    try {
      const res = await api.get(`/admin/users/${userId}/jobs`);
      setUserJobs(res.data.jobs);
    } catch (err) {
      setUserJobs([]);
      console.error("Failed to load jobs for user", err);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user "${email}" and ALL their jobs/data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setExpandedUser(null);
      setUserJobs([]);
      await refresh();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleDeleteJob = async (userId, jobName) => {
    if (!window.confirm(`Force-delete job "${jobName}"? Active runs will be killed.`)) return;
    try {
      await api.delete(`/admin/jobs/${userId}/${jobName}`);
      const res = await api.get(`/admin/users/${userId}/jobs`);
      setUserJobs(res.data.jobs);
      await Promise.all([fetchUsers(), fetchActiveRuns()]);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete job");
    }
  };

  const stateColor = (state) => {
    if (!state) return "";
    const s = state.toUpperCase();
    if (s === "RUNNING" || s === "QUEUED") return "state-running";
    if (s === "COMPLETE") return "state-complete";
    if (s === "PAUSED" || s === "PAUSE_REQUESTED") return "state-paused";
    return "state-error";
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">System Admin</h1>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={onExitAdmin}>
            My Jobs
          </button>
          <button className="admin-btn admin-btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {/* Active Runs Panel */}
      <section className="admin-section">
        <h2 className="admin-section-title">
          Active Runs
          <span className="admin-badge">{activeRuns.length}</span>
        </h2>
        {activeRuns.length === 0 ? (
          <p className="admin-muted">No active runs</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Job</th>
                  <th>State</th>
                  <th>K8s Job</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {activeRuns.map((r) => (
                  <tr key={r.run_id}>
                    <td>{r.user_email}</td>
                    <td>{r.job_name}</td>
                    <td><span className={`admin-state ${stateColor(r.actual_state)}`}>{r.actual_state}</span></td>
                    <td className="admin-mono">{r.k8s_job_name || "—"}</td>
                    <td>{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users Panel */}
      <section className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            Users
            <span className="admin-badge">{users.length}</span>
          </h2>
          <button className="admin-btn admin-btn-small" onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Created</th>
                <th>Jobs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr
                    className={`admin-user-row ${expandedUser === u.id ? "expanded" : ""}`}
                    onClick={() => handleExpandUser(u.id)}
                  >
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{u.job_count}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-small"
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                      >
                        Delete User
                      </button>
                    </td>
                  </tr>
                  {expandedUser === u.id && (
                    <tr className="admin-jobs-row">
                      <td colSpan={5}>
                        {userJobs.length === 0 ? (
                          <p className="admin-muted" style={{ padding: "8px 0" }}>No jobs</p>
                        ) : (
                          <table className="admin-table admin-subtable">
                            <thead>
                              <tr>
                                <th>Job Name</th>
                                <th>Path</th>
                                <th>Run State</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userJobs.map((j) => (
                                <tr key={j.id}>
                                  <td>{j.job_name}</td>
                                  <td className="admin-mono admin-truncate">{j.shared_path}</td>
                                  <td>
                                    {j.active_run ? (
                                      <span className={`admin-state ${stateColor(j.active_run.actual_state)}`}>
                                        {j.active_run.actual_state}
                                      </span>
                                    ) : (
                                      <span className="admin-muted">idle</span>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      className="admin-btn admin-btn-danger admin-btn-small"
                                      onClick={() => handleDeleteJob(u.id, j.job_name)}
                                    >
                                      Delete Job
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
