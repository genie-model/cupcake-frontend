import React, { useState, useEffect } from "react";
import axios from "axios";

const Setup = ({ selectedJob, refreshJobDetails }) => {
  const [jobDetails, setJobDetails] = useState(null);
  const [initialSetup, setInitialSetup] = useState(null);
  const [runSegments, setRunSegments] = useState([]);
  const [baseConfigs, setBaseConfigs] = useState([]);
  const [userConfigs, setUserConfigs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]); // New state variable
  const [modifications, setModifications] = useState("");
  const [runLength, setRunLength] = useState("");
  const [t100, setT100] = useState(false);
  const [restartFrom, setRestartFrom] = useState("");
  const [baseConfig, setBaseConfig] = useState("");
  const [userConfig, setUserConfig] = useState("");
  const [runSegment, setRunSegment] = useState("");

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8001/setup/${selectedJob.name}`,
        );
        const setup = response.data.setup;
        setJobDetails(setup);
        setInitialSetup(setup); // Save the initial setup
        setModifications(setup.modifications || "");
        setRunLength(setup.run_length || "");
        setT100(setup.t100 || false);
        setRestartFrom(setup.restart_from || "");
        setBaseConfig(setup.base_config || "");
        setUserConfig(setup.user_config || "");
        setRunSegment(setup.run_segment || "");
      } catch (err) {
        console.error("Error fetching job details:", err);
      }
    };

    const fetchDropdownValues = async () => {
      try {
        const [
          runSegmentsResponse,
          baseConfigsResponse,
          userConfigsResponse,
          completedJobsResponse,
        ] = await Promise.all([
          axios.get(`http://localhost:8001/run-segments/${selectedJob.name}`),
          axios.get("http://localhost:8001/base-configs"),
          axios.get("http://localhost:8001/user-configs"),
          axios.get("http://localhost:8001/completed-jobs"), // Fetch completed jobs
        ]);
        setRunSegments(runSegmentsResponse.data.run_segments || []);
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
        `http://localhost:8001/setup/${selectedJob.name}`,
        {
          base_config: baseConfig,
          user_config: userConfig,
          modifications,
          run_length: runLength,
          t100,
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
      setT100(initialSetup.t100 || false);
      setRestartFrom(initialSetup.restart_from || "");
      setBaseConfig(initialSetup.base_config || "");
      setUserConfig(initialSetup.user_config || "");
      setRunSegment(initialSetup.run_segment || "");
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
              <label>Run Segment:</label>
              <select
                value={runSegment}
                onChange={(e) => setRunSegment(e.target.value)}
              >
                {runSegments.map((segment, index) => (
                  <option key={index} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
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
              <label>T100:</label>
              <input
                type="checkbox"
                checked={t100}
                onChange={(e) => setT100(e.target.checked)}
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
