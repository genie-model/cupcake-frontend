import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Plots = ({ job }) => {
    const [dataFiles, setDataFiles] = useState([]);
    const [variables, setVariables] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [dataBuffer, setDataBuffer] = useState([]);
    const [selectedDataFile, setSelectedDataFile] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');
    const [eventSource, setEventSource] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (job) {
            fetchDataFiles();
        }
    }, [job]);

    const fetchDataFiles = async () => {
        try {
            const response = await axios.get(`http://localhost:8001/get_data_files_list/${job.name}`);
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
        if (eventSource) {
            eventSource.close();
        }
        fetchInitialPlotData(selectedDataFile, selectedVar);
        startSSEStream(selectedDataFile, selectedVar);
    };

    const fetchInitialPlotData = async (dataFile, variable) => {
        try {
            const response = await axios.post('http://localhost:8001/get-plot-data', {
                job_name: job.name,
                data_file_name: dataFile,
                variable: variable
            });
            const initialPlotData = response.data.data.map(([x, y]) => ({ name: x, value: y }));
            setChartData(initialPlotData);
        } catch (error) {
            console.error('Error fetching initial plot data:', error);
        }
    };

    const startSSEStream = (dataFile, variable) => {
        const sseUrl = `http://localhost:8001/get-plot-data-stream?job_name=${job.name}&data_file_name=${dataFile}&variable=${encodeURIComponent(variable)}`;
        const newEventSource = new EventSource(sseUrl);
        newEventSource.onmessage = (event) => {
            const [x, y] = event.data.split(",").map(Number);
            setDataBuffer((prevBuffer) => [...prevBuffer, { name: x, value: y }]);
        };
        newEventSource.onerror = (error) => {
            console.error("EventSource error:", error);
            newEventSource.close();
        };
        setEventSource(newEventSource);
    };

    useEffect(() => {
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [eventSource]);

    const exportChartAsPDF = async () => {
        const chartElement = chartRef.current;
        if (!chartElement) return;

        const canvas = await html2canvas(chartElement);
        const imageData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(imageData, "PNG", 10, 10, 180, 100);
        pdf.save("chart.pdf");
    };

    const renderLineChart = () => (
        <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={chartData}
                    margin={{ top: 60, right: 30, left: 80, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                        dataKey="name" 
                        tickFormatter={(tick) => `${tick}`} 
                        label={{ 
                            value: 'Time (Years)', 
                            position: 'insideBottom', 
                            dy: 20,
                            style: { fontSize: '14px', fill: '#333' } 
                        }} 
                        tick={{ fontSize: '12px', fill: '#666' }}
                    />
                    <YAxis 
                        label={{ 
                            value: `${selectedVariable} (Unit)`, 
                            angle: -90, 
                            position: 'insideLeft', 
                            dx: -60,
                            dy: 150,
                            style: { fontSize: '14px', fill: '#333' },
                            textAnchor: 'start'
                        }} 
                        tick={{ fontSize: '12px', fill: '#666' }} 
                        tickFormatter={(value) => value.toExponential(2)}
                    />
                    <Tooltip
                        formatter={(value) => value.toLocaleString('en-US', { maximumFractionDigits: 2 })} 
                        labelFormatter={(label) => `Year: ${label}`} 
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="center" 
                        wrapperStyle={{ fontSize: '14px', marginBottom: '10px' }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={`Variable: ${selectedVariable}`} 
                        stroke="#4A90E2" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6, stroke: '#4A90E2', strokeWidth: 2 }} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                <label>
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
                <button 
                    onClick={exportChartAsPDF} 
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#4A90E2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#357ABD'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4A90E2'}
                >
                    Export Plot
                </button>
            </div>
            {renderLineChart()}
        </div>
    );
};

export default Plots;