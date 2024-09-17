import React, { useState, useEffect } from "react";
import axios from "axios";

const Setup = ({ selectedJob, refreshJobDetails }) => {
  // Receive as prop
  const [jobDetails, setJobDetails] = useState(null);
  const [initialSetup, setInitialSetup] = useState(null);
  const [runSegments, setRunSegments] = useState([]);
  const [baseConfigs, setBaseConfigs] = useState([]);
  const [userConfigs, setUserConfigs] = useState([]);
  const [modifications, setModifications] = useState("");
  const [runLength, setRunLength] = useState("");
  const [t100, setT100] = useState(false);
  const [restartFrom, setRestartFrom] = useState("");
  const [baseConfig, setBaseConfig] = useState("");
  const [userConfig, setUserConfig] = useState("");

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8001/setup/${selectedJob.name}`,
        );
        const setup = response.data.setup;
        setJobDetails(setup);
        setInitialSetup(setup); // Save the initial setup
        setModifications(setup.modifications);
        setRunLength(setup.run_length);
        setT100(setup.t100);
        setRestartFrom(setup.restart_from);
        setBaseConfig(setup.base_config);
        setUserConfig(setup.user_config);
      } catch (err) {
        console.error("Error fetching job details:", err);
      }
    };

    const fetchDropdownValues = async () => {
      try {
        const [runSegmentsResponse, baseConfigsResponse, userConfigsResponse] =
          await Promise.all([
            axios.get(`http://localhost:8001/run-segments/${selectedJob.name}`),
            axios.get("http://localhost:8001/base-configs"),
            axios.get("http://localhost:8001/user-configs"),
          ]);
        setRunSegments(runSegmentsResponse.data.run_segments || []);
        setBaseConfigs(baseConfigsResponse.data.base_configs || []);
        setUserConfigs(userConfigsResponse.data.user_configs || []);
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
      setModifications(initialSetup.modifications);
      setRunLength(initialSetup.run_length);
      setT100(initialSetup.t100);
      setRestartFrom(initialSetup.restart_from);
      setBaseConfig(initialSetup.base_config);
      setUserConfig(initialSetup.user_config);
    }
  };

  const divStyle = {
    display: "block",
    backgroundColor: "#f0f0f0",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    padding: "400px",
  };

  const textContainerStyle = {
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
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
              <select value={jobDetails.run_segment}>
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
              <input
                type="text"
                style={{ width: "200px", height: "300px" }}
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
              <input
                type="text"
                value={restartFrom}
                onChange={(e) => setRestartFrom(e.target.value)}
              />
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
