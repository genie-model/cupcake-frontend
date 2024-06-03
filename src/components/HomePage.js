import React, { useState } from 'react';
import FileStructure from './FileStructure';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function HomePage() {
    const [activeDiv, setActiveDiv] = useState(null);

    const handleButtonClick = (type) => {
        setActiveDiv(type);
    };

    const palleteIconClasses = ['fas fa-plus', 'fa-regular fa-folder', 'fas fa-play', 'fa-solid fa-pause'];
    const colors = ['#b02929ed', '#cac000', '#88d500', '#dba405'];

    const palatteIcon = (iconClass, color) => {
        return (
            <div className='palatte-icon'>
                <a className='palatte-icon d-flex justify-content-center align-items-center' href="#" style={{ textDecoration: 'none', paddingTop: '10px' }}>
                    <span style={{ fontSize: '30px', color: color }} className={iconClass}></span>
                </a>
                <hr />
            </div>
        );
    }

    const divStyle = {
        display: 'block',
        backgroundColor: '#f0f0f0',
        // position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        padding: '420px',
    };

    const textContainerStyle = {
        // padding: '10px',
        top: '-100',
        left: '0',
        right: '0',
        bottom: '0'
    };

    const renderContent = () => {
        switch (activeDiv) {
            case 'Status':
                return <div style={divStyle}>
                            <div style={textContainerStyle}>
                            <div>
                                <label>Job Path:</label>
                                {/* <span> {jobPath}</span> */}
                            </div>
                            <div>
                                <label>Job Status:</label>
                                {/* <span> {jobStatus}</span> */}
                            </div>
                            <div>
                                <label>Run Length:</label>
                                {/* <span> {runLength}</span> */}
                            </div>
                        </div>
                        </div>;
            case 'Setup':
                return <div style={divStyle}>Setup Content</div>;
            case 'Namelists':
                return <div style={divStyle}>Namelists Content</div>;
            case 'Output':
                return <div style={divStyle}>Output Content</div>;
            case 'Plots':
                return <div style={divStyle}>Plots Content</div>;
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
                                        {palatteIcon(iconClass, colors[index])}
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
        </>
    );
}

export default HomePage;
