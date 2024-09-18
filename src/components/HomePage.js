import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import FileStructure from "./FileStructure";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Modal, Button } from "react-bootstrap";

import Status from "./Status";
import Setup from "./Setup";
import Namelists from "./Namelists";
import Output from "./Output";
import Plots from "./Plots";

function HomePage() {
  const [activeDiv, setActiveDiv] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [newJobName, setNewJobName] = useState("");
  const [refreshJobs, setRefreshJobs] = useState(() => () => {});
  const [jobOutputs, setJobOutputs] = useState({});
  const outputRef = useRef(null); // Reference to Output component

  // Define icon classes, colors, and types for the job control palette
  const palleteIconClasses = [
    "fas fa-plus",
    "fa-regular fa-folder",
    "fas fa-play",
    "fa-solid fa-pause",
    "fa-solid fa-xmark",
  ];
  const colors = ["#05a4db", "#cac000", "#88d500", "#dba405", "#fa2e00"];
  const types = ["Add Job", "Setup", "Run Job", "Pause Job", "Remove Job"];

  const handleIconClick = (type) => {
    setModalContent(type);
    setShowModal(true);
  };

  const handleButtonClick = (type) => {
    setActiveDiv(type);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSelectJob = async (jobName) => {
    try {
      const response = await axios.get(`http://localhost:8001/job/${jobName}`);
      setSelectedJob(response.data.job);
    } catch (err) {
      console.error("Error fetching job data:", err);
    }
  };

  const handleAddJob = async () => {
    try {
      const response = await axios.post("http://localhost:8001/add-job", {
        job_name: newJobName,
      });
      alert(response.data.message);
      setShowModal(false);
      refreshJobs(); // Refresh the job list after adding a new job
    } catch (err) {
      console.error("Error adding job:", err);

      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Error adding job: ${err.response.data.detail}`);
      } else {
        alert("Error adding job");
      }
    }
  };

  const handleDeleteJob = async () => {
    try {
      const response = await axios.delete("http://localhost:8001/delete-job");
      alert(response.data.message);
      setShowModal(false);
      refreshJobs(); // Refresh the job list after deleting the job
      setSelectedJob(null); // Clear the selected job
      if (outputRef.current) {
        outputRef.current.clearOutput(); // Clear output state
      }
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Error deleting job");
    }
  };

  // Define the function to handle running the job
  const handleRunJob = async () => {
    try {
      const response = await axios.post("http://localhost:8001/run-job");
      alert(response.data.message); // Display success message
      setShowModal(false); // Close modal after running the job
      refreshJobs(); // Refresh job status after running
    } catch (err) {
      console.error("Error running job:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Error running job: ${err.response.data.detail}`);
      } else {
        alert("Error running job");
      }
    }
  };

  const handlePauseJob = async () => {
    try {
      const response = await axios.post("http://localhost:8001/pause-job");
      alert(response.data.message); // Display success message
      setShowModal(false); // Close modal after pausing the job
      refreshJobs(); // Refresh job status after pausing
    } catch (err) {
      console.error("Error pausing job:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(`Error pausing job: ${err.response.data.detail}`);
      } else {
        alert("Error pausing job");
      }
    }
  };

  const palatteIcon = (iconClass, color, type) => {
    return (
      <div className="palatte-icon" onClick={() => handleIconClick(type)}>
        <a
          className="palatte-icon d-flex justify-content-center align-items-center"
          href="#"
          style={{ textDecoration: "none", paddingTop: "10px" }}
        >
          <span
            style={{ fontSize: "30px", color: color }}
            className={iconClass}
          ></span>
        </a>
        <hr />
      </div>
    );
  };

  const refreshJobDetails = async (jobName) => {
    try {
      const response = await axios.get(`http://localhost:8001/job/${jobName}`);
      setSelectedJob(response.data.job);
    } catch (err) {
      console.error("Error refreshing job data:", err);
    }
  };

  const renderContent = () => {
    return (
      <>
        <div style={{ display: activeDiv === "Status" ? "block" : "none" }}>
          <Status job={selectedJob} />
        </div>
        <div style={{ display: activeDiv === "Setup" ? "block" : "none" }}>
          <Setup
            selectedJob={selectedJob}
            refreshJobDetails={refreshJobDetails}
          />
        </div>
        <div style={{ display: activeDiv === "Namelists" ? "block" : "none" }}>
          <Namelists job={selectedJob} />
        </div>
        <div style={{ display: activeDiv === "Output" ? "block" : "none" }}>
          {selectedJob && (
            <Output
              ref={outputRef}
              job={selectedJob}
              jobOutputs={jobOutputs}
              setJobOutputs={setJobOutputs}
            />
          )}{" "}
        </div>
        <div style={{ display: activeDiv === "Plots" ? "block" : "none" }}>
          <Plots job={selectedJob} />
        </div>
      </>
    );
  };

  const renderModalContent = () => {
    switch (modalContent) {
      case "Add Job":
        return (
          <div>
            <div>
              <label>Name for New Job:</label>
              <input
                type="text"
                className="form-control"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
              />
            </div>
          </div>
        );
      case "Remove Job":
        return (
          <div>
            <label>Are you sure you want to remove the job?</label>
            <label>This action is irreversible!</label>
          </div>
        );
      case "Run Job":
        return (
          <div>
            <label>Are you sure you want to run the job?</label>
          </div>
        );
      case "Pause Job":
        return (
          <div>
            <label>Are you sure you want to pause the job?</label>
          </div>
        );
      default:
        return null;
    }
  };
  useEffect(() => {
    let intervalId;

    // Function to fetch and update job details
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8001/job/${selectedJob.name}`,
        );
        const updatedJob = response.data.job;

        // Check if the job status has changed
        if (updatedJob.status !== selectedJob.status) {
          setSelectedJob(updatedJob);
        }
      } catch (err) {
        console.error("Error updating job data:", err);
      }
    };

    if (selectedJob) {
      // Start polling every 5 seconds
      intervalId = setInterval(fetchJobDetails, 5000);
    }

    return () => {
      // Clear the interval when component unmounts or selectedJob changes
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedJob]);

  return (
    <>
      <div>
        <p className="top-text">Job</p>
        <div className="parent" style={{ position: "relative" }}>
          <div className="palatte-area">
            <FileStructure
              onSelectJob={handleSelectJob}
              setRefreshJobs={setRefreshJobs}
            />
          </div>
          <div className="content-area">
            <div className="icons">
              {palleteIconClasses.map((iconClass, index) => (
                <div key={index}>
                  {palatteIcon(iconClass, colors[index], types[index])}
                </div>
              ))}
            </div>
            <div className="task" style={{ position: "relative" }}>
              <button onClick={() => handleButtonClick("Status")}>
                Status
              </button>
              <button onClick={() => handleButtonClick("Setup")}>Setup</button>
              <button onClick={() => handleButtonClick("Namelists")}>
                Namelists
              </button>
              <button onClick={() => handleButtonClick("Output")}>
                Output
              </button>
              <button onClick={() => handleButtonClick("Plots")}>Plots</button>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{modalContent} Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalContent()}</Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              if (modalContent === "Add Job") {
                handleAddJob();
              } else if (modalContent === "Remove Job") {
                handleDeleteJob();
              } else if (modalContent === "Run Job") {
                handleRunJob(); // Trigger handleRunJob on clicking OK
              } else if (modalContent === "Pause Job") {
                handlePauseJob(); // Trigger handlePauseJob on clicking OK
              }
              handleCloseModal();
            }}
          >
            OK
          </Button>{" "}
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default HomePage;
