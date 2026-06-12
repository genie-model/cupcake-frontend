import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import jspdf-autotable for table formatting in PDF
import Plot from "react-plotly.js";

const Plots = ({ job }) => {
    const jobName = job?.name || null;
    const [activeTab, setActiveTab] = useState("timeseries"); // "timeseries" | "heatmap"
    const [dataFiles, setDataFiles] = useState([]);
    const [variables, setVariables] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [dataBuffer, setDataBuffer] = useState([]);
    const [selectedDataFile, setSelectedDataFile] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');
    const [eventSource, setEventSource] = useState(null);
    const chartRef = useRef(null);

    // Reset when job name changes; clean up SSE in a separate effect below.
    useEffect(() => {
        // Reset plot state only when job name actually changes
        setSelectedDataFile('');
        setSelectedVariable('');
        setVariables([]);
        setChartData([]);
        setDataBuffer([]);
        setDataFiles([]);

        if (jobName) {
            fetchDataFiles(jobName);
        }
    }, [jobName]);

    // Close any existing SSE stream when switching jobs (jobName change)
    useEffect(() => {
        if (!eventSource) return;
        return () => {
            eventSource.close();
        };
    }, [eventSource, jobName]);

    // When status changes, refresh data files (without clearing state) if needed
    useEffect(() => {
        if (!jobName) return;
        // If no data files yet and job moved beyond RUNNABLE, try fetching
        if (!dataFiles.length && job?.status && job.status !== "RUNNABLE") {
            fetchDataFiles(jobName);
        }
        // Optional: always refresh on status changes (uncomment if desired)
        // else {
        //     fetchDataFiles(jobName);
        // }
    }, [jobName, job?.status]);

    const fetchDataFiles = async (jobName) => {
        try {
            const response = await api.get(`/get_data_files_list/${jobName}`);
            setDataFiles(response.data);
        } catch (error) {
            console.error('Error fetching data files:', error);
        }
    };

    const fetchVariables = async (selectedFile) => {
        try {
            const response = await api.get(`/get-variables/${job.name}/${selectedFile}`);
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
            const response = await api.post(`/get-plot-data`, {
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
        const token = localStorage.getItem("ctoaster_token");
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const sseUrl = `${apiUrl}/get-plot-data-stream?job_name=${job.name}&data_file_name=${dataFile}&variable=${encodeURIComponent(variable)}`;

        const controller = new AbortController();
        fetchEventSource(sseUrl, {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            onmessage(ev) {
                const [x, y] = ev.data.split(",").map(Number);
                setDataBuffer((prevBuffer) => [...prevBuffer, { name: x, value: y }]);
            },
            onerror(err) {
                console.error("EventSource error:", err);
                controller.abort();
            },
        });
        setEventSource({ close: () => controller.abort() });
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

    const tabStyle = (tab) => ({
        padding: '8px 20px',
        cursor: 'pointer',
        border: 'none',
        borderBottom: activeTab === tab ? '3px solid #4A90E2' : '3px solid transparent',
        backgroundColor: 'transparent',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        fontSize: '14px',
        color: activeTab === tab ? '#4A90E2' : '#555',
    });

    return (
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                <button style={tabStyle("timeseries")} onClick={() => setActiveTab("timeseries")}>
                    Time Series
                </button>
                <button style={tabStyle("heatmap")} onClick={() => setActiveTab("heatmap")}>
                    Surface Temperature
                </button>
            </div>

            {activeTab === "timeseries" && (
                <>
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
                </>
            )}

            {activeTab === "heatmap" && <TempHeatmap job={job} />}
        </div>
    );
};

// ---------------------------------------------------------------------------
// TempHeatmap — polls /get-temp-snapshot every 200 ms and renders a Plotly
// heatmap of ocean surface temperature (lon × lat).
// ---------------------------------------------------------------------------
// fixed display ranges (°C). Pinned so the eye sees real spatial change
// instead of Plotly auto-rescaling the colorbar on every frame.
const ABS_ZMIN = -2;
const ABS_ZMAX = 32;
const ANOM_RANGE = 2;   // anomaly view: symmetric ±2 °C about zero

const TempHeatmap = ({ job }) => {
    const [snapshotData, setSnapshotData] = useState(null);
    const [pollInterval, setPollInterval] = useState(200);
    const [viewMode, setViewMode] = useState("absolute"); // "absolute" | "anomaly"
    const intervalRef = useRef(null);
    const lastTokenRef = useRef(null);
    const baselineRef = useRef(null);   // first frame's temp grid, for anomaly

    useEffect(() => {
        if (!job?.name) return;

        const fetchSnapshot = async () => {
            try {
                const response = await api.get(`/get-temp-snapshot/${job.name}`);
                // re-render only when the model writes a new frame (quarter-index token)
                if (response.data.token !== lastTokenRef.current) {
                    lastTokenRef.current = response.data.token;
                    // capture the first frame as the anomaly baseline
                    if (baselineRef.current === null) {
                        baselineRef.current = response.data.temp;
                    }
                    setSnapshotData(response.data);
                }
            } catch {
                // snapshot not yet written — keep polling silently
            }
        };

        fetchSnapshot();
        intervalRef.current = setInterval(fetchSnapshot, pollInterval);

        return () => clearInterval(intervalRef.current);
    }, [job?.name, pollInterval]);

    const handleDoubleInterval = () => {
        setPollInterval((prev) => Math.min(prev * 2, 3200));
    };

    // re-baseline anomalies against the currently displayed frame
    const handleSetBaseline = () => {
        if (snapshotData) baselineRef.current = snapshotData.temp;
    };

    if (!snapshotData) {
        return (
            <div style={{ padding: "20px", color: "#888" }}>
                Waiting for temperature snapshot… (model writes 4×/year, each season)
                <br />
                <small>Polling every {pollInterval} ms</small>
            </div>
        );
    }

    const isAnomaly = viewMode === "anomaly";
    const baseline = baselineRef.current;

    // element-wise temp − baseline, preserving land mask (nulls)
    const z = isAnomaly && baseline
        ? snapshotData.temp.map((row, i) =>
              row.map((v, j) => {
                  const b = baseline?.[i]?.[j];
                  return v == null || b == null ? null : v - b;
              })
          )
        : snapshotData.temp;

    const plotData = [
        {
            type: "heatmap",
            x: snapshotData.lon,
            y: snapshotData.lat,
            // netCDF4-python reads Fortran (lon,lat) as (lat,lon) — correct for Plotly
            z,
            // RdBu (no reverse): warm = red, cold = blue (conventional)
            colorscale: "RdBu",
            reversescale: false,
            zmin: isAnomaly ? -ANOM_RANGE : ABS_ZMIN,
            zmax: isAnomaly ? ANOM_RANGE : ABS_ZMAX,
            zmid: isAnomaly ? 0 : undefined,
            colorbar: { title: isAnomaly ? "Δ°C vs first" : "Temp (°C)" },
        },
    ];

    const layout = {
        title: isAnomaly
            ? "Surface Temperature Anomaly (vs first frame)"
            : "Ocean Surface Temperature",
        // full geographic extent: lon −180..180, lat −90..90
        xaxis: { title: "Longitude (°E)", range: [-180, 180], dtick: 60, zeroline: false },
        yaxis: { title: "Latitude (°N)", range: [-90, 90], dtick: 30, zeroline: false },
        margin: { t: 50, r: 20, b: 60, l: 60 },
    };

    return (
        <div>
            <div style={{ marginBottom: "8px", fontSize: "13px" }}>
                <label style={{ marginRight: "12px" }}>
                    <input
                        type="checkbox"
                        checked={isAnomaly}
                        onChange={(e) => setViewMode(e.target.checked ? "anomaly" : "absolute")}
                    />{" "}
                    Anomaly view (vs first frame)
                </label>
                {isAnomaly && (
                    <button onClick={handleSetBaseline} style={{ fontSize: "12px" }}>
                        Reset baseline to current
                    </button>
                )}
            </div>
            <Plot
                data={plotData}
                layout={layout}
                style={{ width: "100%", height: "500px" }}
                config={{ responsive: true }}
            />
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#888" }}>
                Polling every {pollInterval} ms.{" "}
                <button onClick={handleDoubleInterval} style={{ fontSize: "12px" }}>
                    Slow down (×2)
                </button>
            </div>
        </div>
    );
};

export default Plots;
