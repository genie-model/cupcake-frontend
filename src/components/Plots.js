import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Plots = ({ job }) => {
    const [dataFiles, setDataFiles] = useState([]);
    const [variables, setVariables] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [selectedDataFile, setSelectedDataFile] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');

    useEffect(() => {
        if (job) {
            fetchDataFiles();
        }
    }, [job]);

    const fetchDataFiles = async () => {
        try {
            const response = await axios.get(`http://localhost:8001/get_data_files_list/${job.name}`);
            console.log("response is :: ", response);
            setDataFiles(response.data);
        } catch (error) {
            console.error('Error fetching data files:', error);
        }
    };

    const fetchVariables = async (selectedFile) => {
        try {
            const response = await axios.get(`http://localhost:8001/get-variables/${job.name}/${selectedFile}`);
            setVariables(response.data);
        } catch (error) {
            console.error('Error fetching variables:', error);
        }
    };

    const handleDataFileChange = (event) => {
        const selectedFile = event.target.value;
        setSelectedDataFile(selectedFile);
        fetchVariables(selectedFile);
    };

    const handleVariableChange = (event) => {
        const selectedVar = event.target.value;
        setSelectedVariable(selectedVar);
        fetchPlotData(selectedDataFile, selectedVar);
    };

    const fetchPlotData = async (dataFile, variable) => {
        try {
            const response = await axios.post('http://localhost:8001/get-plot-data', {
                job_name: job.name,
                data_file_name: dataFile,
                variable: variable
            });
            const plotData = response.data.data.map(([x, y]) => ({ name: x, value: y }));
            setChartData(plotData);
        } catch (error) {
            console.error('Error fetching plot data:', error);
        }
    };

    const renderLineChart = () => (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                    dataKey="name" 
                    label={{ value: 'Time', position: 'insideBottomRight', offset: 0, style: { fontSize: '14px', fill: '#333' } }} 
                    tick={{ fontSize: '12px', fill: '#666' }}
                />
                <YAxis 
                    label={{ value: selectedVariable, angle: -90, position: 'insideLeft', style: { fontSize: '14px', fill: '#333' } }} 
                    tick={{ fontSize: '12px', fill: '#666' }} 
                    tickFormatter={(value) => value.toExponential(2)}
                />
                <Tooltip
                    formatter={(value) => value.toLocaleString('en-US', { maximumFractionDigits: 2 })} 
                    labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend 
                    verticalAlign="top" 
                    align="center" 
                    wrapperStyle={{ fontSize: '14px', marginBottom: '10px' }} 
                />
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={`Variable: ${selectedVariable}`} // Add legend name dynamically
                    stroke="#4A90E2" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6, stroke: '#4A90E2', strokeWidth: 2 }} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
        
    
    

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <label>
                    Data File:
                    <select value={selectedDataFile} onChange={handleDataFileChange}>
                        <option value="">Select a data file</option>
                        {dataFiles.map((file, index) => (
                            <option key={index} value={file}>
                                {file}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ marginLeft: '20px' }}>
                    Variable:
                    <select value={selectedVariable} onChange={handleVariableChange} disabled={!selectedDataFile}>
                        <option value="">Select a variable</option>
                        {variables.map((variable, index) => (
                            <option key={index} value={variable}>
                                {variable}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            {renderLineChart()}
            {/* <div style={gridContainerStyle}>
                {renderLineChart()}
            </div> */}
        </div>
    );
};

export default Plots;
