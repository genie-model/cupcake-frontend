import React from "react";

const Setup = () => {
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
          <input type="text" style={{ width: "200px", height: "300px" }} />
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
    </div>
  );
};

export default Setup;
