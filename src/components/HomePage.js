import React, { useState } from 'react';
import FileStructure from './FileStructure';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Modal, Button } from 'react-bootstrap';

import Status from "./Status";
import Setup from "./Setup";
import Namelists from "./Namelists";
import Output from "./Output";
import Plots from "./Plots";

function HomePage() {
    const [activeDiv, setActiveDiv] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);

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

    const palleteIconClasses = ['fas fa-plus', 'fa-regular fa-folder', 'fas fa-play', 'fa-solid fa-pause', 'fa-solid fa-xmark'];
    const colors = ['#05a4db', '#cac000', '#88d500', '#dba405', '#fa2e00'];
    const types = ['Add Job', 'Setup', 'Run Job', 'Pause Job', 'Remove Job']; // Corresponding types for each icon

    const palatteIcon = (iconClass, color, type) => {
        return (
            <div className='palatte-icon' onClick={() => handleIconClick(type)}>
                <a className='palatte-icon d-flex justify-content-center align-items-center' href="#" style={{ textDecoration: 'none', paddingTop: '10px' }}>
                    <span style={{ fontSize: '30px', color: color }} className={iconClass}></span>
                </a>
                <hr />
            </div>
        );
    };

    const renderContent = () => {
        switch (activeDiv) {
          case "Status":
            return <Status />;
          case "Setup":
            return <Setup />;
          case "Namelists":
            return <Namelists />;
          case "Output":
            return <Output />;
          case "Plots":
            return <Plots />;
          default:
            return null;
        }
      };

    const renderModalContent = () => {
        switch (modalContent) {
            case 'Add Job':
                return (
                    <div>
                        <div>
                            <label>Name for New Job:</label>
                            <input type="text" className="form-control" />
                        </div>
                    </div>
                );
            case 'Setup':
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
            case 'Run Job':
                return (
                    <div>
                        <div>
                            <label>Are you sure, you want to run this job?</label>
                        </div>
                    </div>
                );
            case 'Pause Job':
                return (
                    <div>
                        <div>
                            <label>Are you sure, you want to pause this job?</label>
                        </div>
                    </div>
                );
            case 'Remove Job':
                return (
                    <div>
                        <label>Are you sure, you want to remove the job?</label>
                        <label>This action is irreversible!</label>
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
                <div className="parent" style={{ position: 'relative' }}>
                    <div className="palatte-area">
                        <FileStructure />
                    </div>
                    <div className='content-area'>
                        <div className='icons'>
                            {
                                palleteIconClasses.map((iconClass, index) => (
                                    <div key={index}>
                                        {palatteIcon(iconClass, colors[index], types[index])}
                                    </div>
                                ))
                            }
                        </div>
                        <div className='task' style={{ position: 'relative' }}>
                            <button onClick={() => handleButtonClick('Status')}>Status</button>
                            <button onClick={() => handleButtonClick('Setup')}>Setup</button>
                            <button onClick={() => handleButtonClick('Namelists')}>Namelists</button>
                            <button onClick={() => handleButtonClick('Output')}>Output</button>
                            <button onClick={() => handleButtonClick('Plots')}>Plots</button>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{modalContent} Confirmation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {renderModalContent()}
                </Modal.Body>
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
