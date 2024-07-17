import React, { useState } from 'react';
import FileStructure from './FileStructure';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Modal, Button } from 'react-bootstrap';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';  // Recharts imports

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

    const divStyle = {
        display: 'block',
        backgroundColor: '#f0f0f0',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        padding: '400px',
    };

    const textContainerStyle = {
        top: '0',
        left: '0',
        right: '0',
        bottom: '0'
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px'
    };

    const chartData = [
      { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
      { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
      { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
      { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
      { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
      { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
      { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
    ];

    const renderLineChart = () => (
      <LineChart
        width={300}
        height={300}
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pv" stroke="#8884d8" />
        <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
      </LineChart>
    );

    const renderBarChart = () => (
      <BarChart
        width={300}
        height={300}
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="pv" fill="#8884d8" />
        <Bar dataKey="uv" fill="#82ca9d" />
      </BarChart>
    );

    const renderPieChart = () => (
      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          dataKey="pv"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={60}
          fill="#8884d8"
        />
        <Pie
          data={chartData}
          dataKey="uv"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          fill="#82ca9d"
          label
        />
        <Tooltip />
        <Legend />
      </PieChart>
    );

    const renderAreaChart = () => (
      <AreaChart
        width={300}
        height={300}
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="pv" stroke="#82ca9d" fill="#82ca9d" />
      </AreaChart>
    );

    const renderScatterChart = () => (
      <ScatterChart
        width={300}
        height={300}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="uv" name="uv" unit="unit" />
        <YAxis type="number" dataKey="pv" name="pv" unit="unit" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="A school" data={chartData} fill="#8884d8" />
      </ScatterChart>
    );

    const renderRadarChart = () => (
      <RadarChart cx={150} cy={150} outerRadius={100} width={300} height={300} data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis />
        <Tooltip />
        <Legend />
        <Radar name="Mike" dataKey="uv" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        <Radar name="Lily" dataKey="pv" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
      </RadarChart>
    );

    const renderComposedChart = () => (
      <ComposedChart
        width={300}
        height={300}
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
      </ComposedChart>
    );

    const renderContent = () => {
        switch (activeDiv) {
            case 'Status':
                return <div style={divStyle}>
                            <div style={textContainerStyle}>
                                <div>
                                    <label>Job Path:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label>Job Status:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label>Run Length:</label>
                                    <input type="text" />
                                </div>
                            </div>
                        </div>;
            case 'Setup':
                return <div style={divStyle}>
                            <div style={textContainerStyle}>
                                <div>
                                    <label>Job Path:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label>Run Segment:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label>Base Config:</label>
                                    <select>
                                        <option value="config1">Config 1</option>
                                        <option value="config2">Config 2</option>
                                        <option value="config3">Config 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label>User Config:</label>
                                    <select>
                                        <option value="config1">Config 1</option>
                                        <option value="config2">Config 2</option>
                                        <option value="config3">Config 3</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Modifications:</label>
                                    <input type="text" style={{ width: '200px', height: '300px' }} />
                                </div>
                                <div>
                                    <label>Run Length:</label>
                                    <input type="text" />
                                </div>
                                <div>
                                    <label>Restart From:</label>
                                    <select>
                                        <option value="config1">Config 1</option>
                                        <option value="config2">Config 2</option>
                                        <option value="config3">Config 3</option>
                                    </select>
                                </div>
                            </div>
                        </div>;
            case 'Namelists':
                return <div style={divStyle}>Namelists Content</div>;
            case 'Output':
                return <div style={divStyle}>Output Content</div>;
            case 'Plots':
                return <div style={gridContainerStyle}>
                            {renderLineChart()}
                            {renderBarChart()}
                            {renderPieChart()}
                            {renderAreaChart()}
                            {renderScatterChart()}
                            {renderRadarChart()}
                            {renderComposedChart()}
                        </div>;
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
