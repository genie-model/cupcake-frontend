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
            const response = await axios.get(`http://locahost:8001/get_data_files_list/${job.name}`);
            setDataFiles(response.data);
        } catch (error) {
            console.error('Error fetching data files:', error);
        }
    };

    const fetchVariables = async (selectedFile) => {
        try {
            const response = await axios.get(`http://locahost:8001/get-variables/${job.name}/${selectedFile}`);
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
            const response = await axios.post('http://locahost:8001/get-plot-data', {
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
        const sseUrl = `http://locahost:8001/get-plot-data-stream?job_name=${job.name}&data_file_name=${dataFile}&variable=${encodeURIComponent(variable)}`;
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
    
        // Capture chart with a high resolution
        const canvas = await html2canvas(chartElement, { scale: 3 });
        const imageData = canvas.toDataURL("image/png");
    
        // Create a PDF with A4 dimensions in landscape mode
        const pdf = new jsPDF("landscape", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
    
        // Draw a blank full-page rectangle to ensure full A4 length
        pdf.setFillColor(255, 255, 255); // White background
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
    
        // Add title with enhanced styling
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0); // Black color
        pdf.text("Exploratory Plot of Selected Variable", 10, 15);
    
        // Add metadata with subtle grey color
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100); // Grey color for metadata
        pdf.text(`Data File: ${selectedDataFile}`, 10, 25);
        pdf.text(`Variable: ${selectedVariable}`, 10, 35);
        pdf.text("X-Axis: Time (Years)", 10, 45);
        pdf.text(`Y-Axis: ${selectedVariable} (Unit)`, 10, 55);
    
        // Draw a separator line before data summary
        pdf.setDrawColor(200, 200, 200); // Light grey for separator
        pdf.line(10, 60, pdfWidth - 10, 60);
    
        // Data Summary in table format with colored header
        pdf.setTextColor(0, 0, 255); // Blue for data summary title
        pdf.text("Data Summary:", 10, 70);
        pdf.setTextColor(0, 0, 0); // Black for table content
        pdf.autoTable({
            startY: 75,
            head: [['Min Value', 'Max Value', 'Mean Value']],
            body: [[
                Math.min(...chartData.map(d => d.value)).toFixed(2),
                Math.max(...chartData.map(d => d.value)).toFixed(2),
                (chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length).toFixed(2)
            ]],
            theme: 'grid', // Simple table styling
            headStyles: { fillColor: [74, 144, 226], textColor: [255, 255, 255] }, // Blue header with white text
            margin: { left: 10, right: 10 }
        });
    
        // Calculate image size to fit within A4 landscape dimensions, maximizing height
        const imgWidth = pdfWidth - 20; // Leave a small margin on both sides
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pdfHeight - 140); // Adjust to fit within remaining space
    
        // Add the high-resolution chart image, maximizing height to fit naturally
        pdf.addImage(imageData, "PNG", 10, 115, imgWidth, imgHeight);
    
        // Draw a separator line before footer
        pdf.setDrawColor(200, 200, 200);
        pdf.line(10, pdfHeight - 20, pdfWidth - 10, pdfHeight - 20);
    
        // Footer with date and job information
        const exportDate = new Date().toLocaleDateString();
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Exported on: ${exportDate}`, 10, pdfHeight - 10);
        pdf.text(`Job: ${job.name || 'N/A'}`, pdfWidth - 60, pdfHeight - 10);
    
        pdf.save("enhanced_plot.pdf");
    };                                      

    const exportPlotDataAsPDF = () => {
        const pdf = new jsPDF();

        // Title and metadata
        pdf.setFontSize(16);
        pdf.text("Plot Data Exploration", 10, 10);
        pdf.setFontSize(12);
        pdf.text(`Data File: ${selectedDataFile}`, 10, 20);
        pdf.text(`Variable: ${selectedVariable}`, 10, 30);

        // Data summary table
        pdf.text("Data Summary:", 10, 50);
        pdf.autoTable({
            startY: 55,
            head: [['Min', 'Max', 'Mean']],
            body: [[
                Math.min(...chartData.map(d => d.value)).toFixed(2),
                Math.max(...chartData.map(d => d.value)).toFixed(2),
                (chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length).toFixed(2)
            ]]
        });

        // Data points table
        pdf.text("Data Points:", 10, 80);
        const dataPoints = chartData.map((data, index) => [index + 1, data.name, data.value.toFixed(2)]);
        pdf.autoTable({
            startY: 85,
            head: [['SNo', 'X', 'Y']],
            body: dataPoints
        });

        pdf.save("plot_data_exploration.pdf");
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
                <button 
                    onClick={exportPlotDataAsPDF} 
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
                    onMouseOver={(e) => e.target.style.backgroundColor = '#388E3C'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                >
                    Export Data
                </button>
            </div>
            {renderLineChart()}
        </div>
    );
};

export default Plots;
