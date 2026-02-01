import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import jspdf-autotable for table formatting in PDF

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
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
            const response = await axios.get(`${apiUrl}/get_data_files_list/${job.name}`);
            setDataFiles(response.data);
        } catch (error) {
            console.error('Error fetching data files:', error);
        }
    };

    const fetchVariables = async (selectedFile) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
            const response = await axios.get(`${apiUrl}/get-variables/${job.name}/${selectedFile}`);
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

    const getAdaptiveTicks = (data) => {
        if (!data.length) return [];

        const minX = Math.min(...data.map((d) => d.name));
        const maxX = Math.max(...data.map((d) => d.name));
        if (minX === maxX) return [minX]; // single point case

        const range = maxX - minX;
        const rawStep = range / 8; // target ~8-10 ticks
        const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow10);
        const step = candidates.find((c) => range / c <= 12) || candidates[candidates.length - 1];

        const start = Math.ceil(minX / step) * step;
        const end = Math.floor(maxX / step) * step;

        const ticks = [];
        for (let x = start; x <= end + 1e-9; x += step) {
            ticks.push(x);
        }
        return ticks;
    };

    const fetchInitialPlotData = async (dataFile, variable) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
            const response = await axios.post(`${apiUrl}/get-plot-data`, {
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
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const sseUrl = `${apiUrl}/get-plot-data-stream?job_name=${job.name}&data_file_name=${dataFile}&variable=${encodeURIComponent(variable)}`;
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

    // Merge new points, deduplicate by x (name), and keep chronological order
    const mergeAndSortByX = (prevData, buffer) => {
        if (!buffer.length) return prevData;
        const merged = [...prevData, ...buffer];
        const uniqueByX = new Map();
        merged.forEach((point) => uniqueByX.set(point.name, point));
        return Array.from(uniqueByX.values()).sort((a, b) => a.name - b.name);
    };

    useEffect(() => {
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [eventSource]);

    // Merge dataBuffer into chartData for real-time updates
    useEffect(() => {
        if (dataBuffer.length > 0) {
            setChartData((prevData) => mergeAndSortByX(prevData, dataBuffer));
            setDataBuffer([]); // Clear buffer after merging
        }
    }, [dataBuffer]);

    const exportChartAsPDF = async () => {
        const chartElement = chartRef.current;
        if (!chartElement) return;

        const canvas = await html2canvas(chartElement, { scale: 3 });
        const imageData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("landscape", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(16);
        pdf.text("Exploratory Plot of Selected Variable", 10, 15);
        pdf.setFontSize(12);
        pdf.text(`Data File: ${selectedDataFile}`, 10, 25);
        pdf.text(`Variable: ${selectedVariable}`, 10, 35);

        pdf.addImage(imageData, "PNG", 10, 50, pdfWidth - 20, pdfHeight - 60);
        pdf.save("enhanced_plot.pdf");
    };

    const exportPlotDataAsCSV = () => {
        if (!chartData.length) return;

        const csvRows = [];
        csvRows.push(['X Value', 'Y Value']);

        chartData.forEach(({ name, value }) => {
            csvRows.push([name, value]);
        });

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "plot_data.csv";
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        type="number"
                        scale="linear"
                        dataKey="name"
                        ticks={getAdaptiveTicks(chartData)} 
                        domain={['dataMin', 'dataMax']}
                        interval={0} // Render all provided ticks
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
                        formatter={(value) => value.toFixed(2)} 
                        labelFormatter={(label) => {
                            const numericLabel = Number(label); // Convert label to a number
                            return !isNaN(numericLabel) ? `Year: ${Math.round(numericLabel)}` : `Year: ${label}`; // Round if numeric
                        }} 
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
                >
                    Export Plot
                </button>
                <button 
                    onClick={exportPlotDataAsCSV} 
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s'
                    }}
                >
                    Export Data
                </button>
            </div>
            {renderLineChart()}
        </div>
    );
};

export default Plots;
