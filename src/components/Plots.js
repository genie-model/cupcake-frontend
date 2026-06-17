import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import jspdf-autotable for table formatting in PDF

// Job states during which the model may still be writing time-series output.
const ACTIVE_STATES = ["QUEUED", "RUNNING", "PAUSE_REQUESTED", "PAUSED"];
const POLL_MS = 2500;

const Plots = ({ job }) => {
    const jobName = job?.name || null;
    const status = job?.status || null;
    const [dataFiles, setDataFiles] = useState([]);
    const [variables, setVariables] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [selectedDataFile, setSelectedDataFile] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');
    const chartRef = useRef(null);

    // ---------------------------------------------------------------------
    // Reset all plot state when the selected job changes.
    // ---------------------------------------------------------------------
    useEffect(() => {
        setSelectedDataFile('');
        setSelectedVariable('');
        setVariables([]);
        setChartData([]);
        setDataFiles([]);
    }, [jobName]);

    // ---------------------------------------------------------------------
    // Poll the data-files list. The model writes biogem_series_*.res only
    // after spin-up, and new series files can appear at different times, so we
    // re-list every POLL_MS while the job is active (previously this fired only
    // once on a status transition and never retried once RUNNING). One final
    // fetch runs when the job is terminal. Selection is never clobbered — we
    // only refresh the list of available files.
    // ---------------------------------------------------------------------
    useEffect(() => {
        if (!jobName) return;
        let cancelled = false;

        const fetchDataFiles = async () => {
            try {
                const response = await api.get(`/get_data_files_list/${jobName}`);
                if (cancelled) return;
                // sort alphabetically so the list box is grouped by prefix
                // (biogem_series_atm_*, _carb_*, _ocn_*, ...) not raw dir order
                const files = Array.isArray(response.data) ? [...response.data] : [];
                files.sort((a, b) => String(a).localeCompare(String(b)));
                setDataFiles(files);
            } catch (error) {
                // 404 simply means the model hasn't written any series files
                // yet — expected during spin-up. Keep an empty list quietly.
                if (error?.response?.status !== 404) {
                    console.error('Error fetching data files:', error);
                }
            }
        };

        fetchDataFiles();
        let intervalId;
        if (ACTIVE_STATES.includes(status)) {
            intervalId = setInterval(fetchDataFiles, POLL_MS);
        }
        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobName, status]);

    // ---------------------------------------------------------------------
    // Fetch the variable list once a data file is selected. The .res header
    // (which defines the columns) is written when the file is created and does
    // not grow, so no polling is needed — but retry a couple of times in case
    // the very first read lands before the header is flushed.
    // ---------------------------------------------------------------------
    useEffect(() => {
        if (!jobName || !selectedDataFile) {
            setVariables([]);
            return;
        }
        let cancelled = false;
        let attempts = 0;
        let timeoutId;

        const fetchVariables = async () => {
            try {
                const response = await api.get(`/get-variables/${jobName}/${selectedDataFile}`);
                if (cancelled) return;
                const vars = Array.isArray(response.data) ? [...response.data] : [];
                vars.sort((a, b) => String(a).localeCompare(String(b)));
                setVariables(vars);
                if (!vars.length && attempts < 3) {
                    attempts += 1;
                    timeoutId = setTimeout(fetchVariables, 1500);
                }
            } catch (error) {
                if (attempts < 3) {
                    attempts += 1;
                    timeoutId = setTimeout(fetchVariables, 1500);
                } else {
                    console.error('Error fetching variables:', error);
                }
            }
        };

        fetchVariables();
        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [jobName, selectedDataFile]);

    // ---------------------------------------------------------------------
    // Poll the plot data for the selected file+variable. Each call re-reads the
    // whole series fresh via POST /get-plot-data and replaces chartData. This
    // replaces the old tail-SSE (which seek()'d to end and broke when the
    // runner rewrote the .res file every 2s — the same bug fixed in Output.js).
    // Polling the full file is robust under file rewrite and NFS close-to-open.
    // ---------------------------------------------------------------------
    useEffect(() => {
        if (!jobName || !selectedDataFile || !selectedVariable) return;
        let cancelled = false;

        const fetchPlotData = async () => {
            try {
                const response = await api.post(`/get-plot-data`, {
                    job_name: jobName,
                    data_file_name: selectedDataFile,
                    variable: selectedVariable,
                });
                if (cancelled) return;
                const points = (response.data?.data || [])
                    .map(([x, y]) => ({ name: x, value: y }))
                    .sort((a, b) => a.name - b.name);
                setChartData(points);
            } catch (error) {
                // Keep whatever we already plotted; transient while syncing.
                if (error?.response?.status !== 404) {
                    console.error('Error fetching plot data:', error);
                }
            }
        };

        fetchPlotData();
        let intervalId;
        if (ACTIVE_STATES.includes(status)) {
            intervalId = setInterval(fetchPlotData, POLL_MS);
        }
        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobName, selectedDataFile, selectedVariable, status]);

    const handleDataFileChange = (event) => {
        const selectedFile = event.target.value;
        setSelectedDataFile(selectedFile);
        setSelectedVariable('');
        setChartData([]);
    };

    const handleVariableChange = (event) => {
        setSelectedVariable(event.target.value);
        setChartData([]);
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

    const isActive = ACTIVE_STATES.includes(status);
    const waitingForOutput = isActive && !dataFiles.length;

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
            {waitingForOutput && (
                <div style={{ color: '#777', fontSize: '14px', marginBottom: '12px' }}>
                    ⏳ Waiting for the model to write its first time-series output —
                    the plot variables will appear here automatically once they are available.
                </div>
            )}
            {renderLineChart()}
        </div>
    );
};

export default Plots;
