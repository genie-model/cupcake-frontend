import React, { useState, useEffect } from "react";
import axios from "axios";

const Setup = ({ selectedJob, refreshJobDetails }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [initialSetup, setInitialSetup] = useState(null);
  const [baseConfigs, setBaseConfigs] = useState([]);
  const [userConfigs, setUserConfigs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [modifications, setModifications] = useState("");
  const [runLength, setRunLength] = useState("");
  const [restartFrom, setRestartFrom] = useState("");
  const [baseConfig, setBaseConfig] = useState("");
  const [userConfig, setUserConfig] = useState("");

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/setup/${selectedJob.name}`,
        );
        const setup = response.data.setup;
        setJobDetails(setup);
        setInitialSetup(setup); // Save the initial setup
        setModifications(setup.modifications || "");
        setRunLength(setup.run_length || "");
        setRestartFrom(setup.restart_from || "");
        setBaseConfig(setup.base_config || "");
        setUserConfig(setup.user_config || "");
      } catch (err) {
        console.error("Error fetching job details:", err);
      }
    };

    const fetchDropdownValues = async () => {
      try {
        const [
          baseConfigsResponse,
          userConfigsResponse,
          completedJobsResponse,
        ] = await Promise.all([
          axios.get("http://localhost:8000/base-configs"),
          axios.get("http://localhost:8000/user-configs"),
          axios.get("http://localhost:8000/completed-jobs"), // Fetch completed jobs
        ]);
        setBaseConfigs(baseConfigsResponse.data.base_configs || []);
        setUserConfigs(userConfigsResponse.data.user_configs || []);
        setCompletedJobs(completedJobsResponse.data.completed_jobs || []); // Set completed jobs
      } catch (err) {
        console.error("Error fetching dropdown values:", err);
      }
    };

    if (selectedJob) {
      fetchJobDetails();
      fetchDropdownValues();
    }
  }, [selectedJob]);

  const handleSaveChanges = async () => {
    try {
      const response = await axios.post(
        `http://localhost:8000/setup/${selectedJob.name}`,
        {
          base_config: baseConfig,
          user_config: userConfig,
          modifications,
          run_length: runLength,
          restart_from: restartFrom,
        },
      );
      alert(response.data.message);
      // Trigger refresh of job details
      if (refreshJobDetails) {
        refreshJobDetails(selectedJob.name);
      }
    } catch (err) {
      console.error("Error saving setup configuration:", err);
      alert("Error saving setup configuration");
    }
  };

  const handleRevertChanges = () => {
    if (initialSetup) {
      setModifications(initialSetup.modifications || "");
      setRunLength(initialSetup.run_length || "");
      setRestartFrom(initialSetup.restart_from || "");
      setBaseConfig(initialSetup.base_config || "");
      setUserConfig(initialSetup.user_config || "");
    }
  };

  const divStyle = {
    display: "block",
    backgroundColor: "#f0f0f0",
    padding: "20px",
  };

  const textContainerStyle = {
    maxWidth: "800px",
    margin: "0 auto",
  };

  if (!selectedJob) {
    return (
      <div style={divStyle}>
        <div style={textContainerStyle}>
          <p>No job is selected</p>
        </div>
      </div>
    );
  }

  return (
    <div style={divStyle}>
      <div style={textContainerStyle}>
        {jobDetails && (
          <div>
            <div>
              <label>Job Name:</label>
              <span>{selectedJob.name}</span>
            </div>
            <div>
              <label>Base Config:</label>
              <select
                value={baseConfig}
                onChange={(e) => setBaseConfig(e.target.value)}
              >
                {baseConfigs.map((config, index) => (
                  <option key={index} value={config}>
                    {config}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>User Config:</label>
              <select
                value={userConfig}
                onChange={(e) => setUserConfig(e.target.value)}
              >
                {userConfigs.map((config, index) => (
                  <option key={index} value={config}>
                    {config}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Modifications:</label>
              <textarea
                style={{ width: "100%", height: "150px" }}
                value={modifications}
                onChange={(e) => setModifications(e.target.value)}
              />
            </div>
            <div>
              <label>Run Length:</label>
              <input
                type="text"
                value={runLength}
                onChange={(e) => setRunLength(e.target.value)}
              />
            </div>
            <div>
              <label>Restart From:</label>
              {completedJobs.length > 0 ? (
                <select
                  value={restartFrom}
                  onChange={(e) => setRestartFrom(e.target.value)}
                >
                  <option value="">None</option>
                  {completedJobs.map((jobName, index) => (
                    <option key={index} value={jobName}>
                      {jobName}
                    </option>
                  ))}
                </select>
              ) : (
                <span>No completed jobs available</span>
              )}
            </div>
            <div>
              <button onClick={handleSaveChanges}>Save changes</button>
              <button onClick={handleRevertChanges}>Revert changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup;
