import React from "react";

const Status = ({ job }) => {
  if (!job) {
    return <div>No job selected</div>;
  }

  const divStyle = {
    display: 'block',
    backgroundColor: '#f0f0f0',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    padding: '400px'
  };

  const textContainerStyle = {
    top: '0',
    left: '0',
    right: '0',
    bottom: '0'
  };

  return (
    <div style={divStyle}>
      <div style={textContainerStyle}>
        <div>
          <label>Job Path:</label>
          <input type="text" value={job.path} readOnly />
        </div>
        <div>
          <label>Job Status:</label>
          <input type="text" value={job.status} readOnly />
        </div>
        <div>
          <label>Run Length:</label>
          <input type="text" value={job.run_length} readOnly />
        </div>
        <div>
          <label>T100:</label>
          <input type="text" value={job.t100} readOnly />
        </div>
      </div>
    </div>
  );
};

export default Status;
