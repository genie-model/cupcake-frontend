import React, { useState } from "react";
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
      alert("Error adding job");
    }
  };

  const handleDeleteJob = async () => {
    try {
      const response = await axios.delete("http://localhost:8001/delete-job");
      alert(response.data.message);
      setShowModal(false);
      refreshJobs(); // Refresh the job list after deleting the job
      setSelectedJob(null); // Clear the selected job
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Error deleting job");
    }
  };

  const palleteIconClasses = [
    "fas fa-plus",
    "fa-regular fa-folder",
    "fas fa-play",
    "fa-solid fa-pause",
    "fa-solid fa-xmark",
  ];
  const colors = ["#05a4db", "#cac000", "#88d500", "#dba405", "#fa2e00"];
  const types = ["Add Job", "Setup", "Run Job", "Pause Job", "Remove Job"]; // Corresponding types for each icon

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
    switch (activeDiv) {
      case "Status":
        return <Status job={selectedJob} />;
      case "Setup":
        return (
          <Setup
            selectedJob={selectedJob}
            refreshJobDetails={refreshJobDetails} // Pass the new prop
          />
        );
      case "Namelists":
        return <Namelists job={selectedJob} />;
      case "Output":
        return <Output job={selectedJob} />;
      case "Plots":
        return <Plots job={selectedJob} />;
      default:
        return null;
    }
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
            <Button variant="primary" onClick={handleAddJob}>
              OK
            </Button>
          </div>
        );
      case "Setup":
        return (
          <div>
            <div>
              <label>Setup Name:</label>
              <input type="text" className="form-control" />
            </div>
            <div>
              <label>Setup Details:</label>
              <input type="text" className="form-control" />
            </div>
          </div>
        );
      case "Run Job":
        return (
          <div>
            <div>
              <label>Are you sure, you want to run this job?</label>
            </div>
          </div>
        );
      case "Pause Job":
        return (
          <div>
            <div>
              <label>Are you sure, you want to pause this job?</label>
            </div>
          </div>
        );
      case "Remove Job":
        return (
          <div>
            <label>Are you sure, you want to remove the job?</label>
            <label>This action is irreversible!</label>
            <Button variant="danger" onClick={handleDeleteJob}>
              OK
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

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
          <Button variant="primary" onClick={handleCloseModal}>
            OK
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default HomePage;
