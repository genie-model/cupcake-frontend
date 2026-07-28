import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Plot from "react-plotly.js";
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
    const [activeTab, setActiveTab] = useState("timeseries"); // "timeseries" | "heatmap" | "fields"
    const chartRef = useRef(null);

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
        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                <button style={tabStyle("timeseries")} onClick={() => setActiveTab("timeseries")}>
                    Time Series
                </button>
                <button style={tabStyle("heatmap")} onClick={() => setActiveTab("heatmap")}>
                    Surface Temperature
                </button>
                <button style={tabStyle("fields")} onClick={() => setActiveTab("fields")}>
                    2D Fields
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
                    {waitingForOutput && (
                        <div style={{ color: '#777', fontSize: '14px', marginBottom: '12px' }}>
                            ⏳ Waiting for the model to write its first time-series output —
                            the plot variables will appear here automatically once they are available.
                        </div>
                    )}
                    {renderLineChart()}
                </>
            )}

            {activeTab === "heatmap" && <TempHeatmap job={job} />}

            {activeTab === "fields" && <FieldsPlot job={job} />}
        </div>
    );
};

// ---------------------------------------------------------------------------
// TempHeatmap — polls /get-temp-snapshot and renders a Plotly heatmap of ocean
// surface temperature (lon × lat). The model writes a snapshot 4x per model
// year (seasonal); each carries a quarter-index change token so we only
// re-render on a genuinely new frame. Polls every POLL_MS while the job is
// active (mirrors the time-series + Output panels) and stops at terminal state.
// ---------------------------------------------------------------------------
// Pinned display ranges (°C) so the eye sees real spatial change rather than
// Plotly auto-rescaling the colorbar every frame.
const ABS_ZMIN = -2;
const ABS_ZMAX = 32;
const ANOM_RANGE = 2;   // anomaly view: symmetric ±2 °C about zero

const TempHeatmap = ({ job }) => {
    const jobName = job?.name || null;
    const status = job?.status || null;
    const [snapshotData, setSnapshotData] = useState(null);
    const [viewMode, setViewMode] = useState("absolute"); // "absolute" | "anomaly"
    const lastTokenRef = useRef(null);
    const baselineRef = useRef(null);   // first frame's temp grid, for anomaly

    // Reset when the selected job changes.
    useEffect(() => {
        setSnapshotData(null);
        lastTokenRef.current = null;
        baselineRef.current = null;
    }, [jobName]);

    // Poll the snapshot. Fetch immediately (so a completed job shows its final
    // frame), then poll only while active. Re-render only when the change token
    // advances. NFS freshness + atomic .nc sync make each read consistent.
    useEffect(() => {
        if (!jobName) return;
        let cancelled = false;

        const fetchSnapshot = async () => {
            try {
                const response = await api.get(`/get-temp-snapshot/${jobName}`);
                if (cancelled) return;
                if (response.data.token !== lastTokenRef.current) {
                    lastTokenRef.current = response.data.token;
                    if (baselineRef.current === null) {
                        baselineRef.current = response.data.temp;
                    }
                    setSnapshotData(response.data);
                }
            } catch {
                // snapshot not yet written (404) — keep polling silently
            }
        };

        fetchSnapshot();
        let intervalId;
        if (ACTIVE_STATES.includes(status)) {
            intervalId = setInterval(fetchSnapshot, POLL_MS);
        }
        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobName, status]);

    // Re-baseline anomalies against the currently displayed frame.
    const handleSetBaseline = () => {
        if (snapshotData) baselineRef.current = snapshotData.temp;
    };

    if (!snapshotData) {
        return (
            <div style={{ padding: "20px", color: "#888" }}>
                ⏳ Waiting for the temperature snapshot — the model writes one
                4×/year (each season), so the first frame appears after spin-up.
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
            z,
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
        xaxis: { title: "Longitude (°E)", range: [-180, 180], dtick: 60, zeroline: false },
        // scaleanchor locks 1° lat == 1° lon in pixels so the map keeps its true
        // equirectangular proportion (360° lon : 180° lat = 2:1) regardless of
        // the panel width, instead of x/y stretching independently to fill the box.
        yaxis: {
            title: "Latitude (°N)", range: [-90, 90], dtick: 30, zeroline: false,
            scaleanchor: "x", scaleratio: 1,
        },
        margin: { t: 40, r: 20, b: 48, l: 52 },
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
            {/* 2:1 box so the equirectangular map (locked via scaleanchor) fills
                it without letterboxing, and stays responsive to panel width. */}
            <div style={{ width: "100%", maxWidth: 1100, aspectRatio: "2 / 1" }}>
                <Plot
                    data={plotData}
                    layout={{ ...layout, autosize: true }}
                    useResizeHandler
                    style={{ width: "100%", height: "100%" }}
                    // No modebar — the zoom/pan/download toolbar isn't needed for a
                    // live map; keep only hover tooltips.
                    config={{ responsive: true, displayModeBar: false, displaylogo: false }}
                />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// FieldsPlot — live 2D spatial plots for every model variable.
//
// Reads /get-fields-meta once to build the dropdowns (variable, slice type, and
// depth/latitude), then polls /get-field-snapshot for the selected variable's
// full array and slices it client-side, so changing depth or latitude is
// instant (no extra request). The model writes one annual-mean frame per model
// year; the year is the change token (re-render only on a new year) and is shown
// as a "Year: xxx" label. Poll only while the job is active.
//
//   - Horizontal slice: a lon × lat map at a chosen depth level (locked
//     equirectangular aspect, like the SST map).
//   - Vertical slice: a lon × depth section at a chosen latitude (surface on
//     top). Only offered for variables that have a depth dimension.
//
// Colour range uses the whole run's observed min/max, expanding as new extremes
// arrive (never clips, no per-variable tuning) so colour == value across frames.
// ---------------------------------------------------------------------------
const FieldsPlot = ({ job }) => {
    const jobName = job?.name || null;
    const status = job?.status || null;

    const [meta, setMeta] = useState(null);          // { lon, lat, depth, variables }
    const [selectedVar, setSelectedVar] = useState("");
    const [sliceType, setSliceType] = useState("horizontal"); // "horizontal" | "vertical"
    const [depthIdx, setDepthIdx] = useState(0);
    const [latIdx, setLatIdx] = useState(0);
    const [fieldData, setFieldData] = useState(null); // { token, is3d, values }

    const lastTokenRef = useRef(null);
    const rangeRef = useRef(null);   // { min, max } expanding across frames for selectedVar

    // Reset everything when the job changes.
    useEffect(() => {
        setMeta(null);
        setSelectedVar("");
        setSliceType("horizontal");
        setDepthIdx(0);
        setLatIdx(0);
        setFieldData(null);
        lastTokenRef.current = null;
        rangeRef.current = null;
    }, [jobName]);

    // Fetch metadata (axes + variable list). Available from run start (model
    // writes a zero-filled snapshot at init). Poll until it loads, then stop.
    useEffect(() => {
        if (!jobName || meta) return;
        let cancelled = false;

        const fetchMeta = async () => {
            try {
                const { data } = await api.get(`/get-fields-meta/${jobName}`);
                if (cancelled || !data.variables?.length) return;
                setMeta(data);
                setSelectedVar((prev) => prev || data.variables[0].name);
                setLatIdx(Math.floor((data.lat?.length || 1) / 2)); // default: near equator
            } catch {
                // snapshot not synced yet (404) — keep polling
            }
        };

        fetchMeta();
        let intervalId;
        if (ACTIVE_STATES.includes(status)) intervalId = setInterval(fetchMeta, POLL_MS);
        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobName, status, meta]);

    // Reset the frame + colour range whenever the selected variable changes, so
    // the next poll re-fetches and re-scales for the new variable.
    useEffect(() => {
        lastTokenRef.current = null;
        rangeRef.current = null;
        setFieldData(null);
    }, [selectedVar]);

    // Poll the selected variable's array. Re-render only on a new change token.
    useEffect(() => {
        if (!jobName || !selectedVar) return;
        let cancelled = false;

        const fetchField = async () => {
            try {
                const { data } = await api.get(`/get-field-snapshot/${jobName}/${selectedVar}`);
                if (cancelled) return;
                // token is the model year; the zero-filled init file carries -1, so
                // ignore it and wait for the first real annual-mean frame.
                if (data.token >= 0 && data.token !== lastTokenRef.current) {
                    lastTokenRef.current = data.token;
                    // expand the observed colour range over the whole field (all depths)
                    const r = rangeRef.current || { min: Infinity, max: -Infinity };
                    const scan = (a) => {
                        for (const el of a) {
                            if (Array.isArray(el)) scan(el);
                            else if (el != null && Number.isFinite(el)) {
                                if (el < r.min) r.min = el;
                                if (el > r.max) r.max = el;
                            }
                        }
                    };
                    scan(data.values);
                    rangeRef.current = r;
                    setFieldData(data);
                }
            } catch {
                // not written yet — keep polling silently
            }
        };

        fetchField();
        let intervalId;
        if (ACTIVE_STATES.includes(status)) intervalId = setInterval(fetchField, POLL_MS);
        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
        };
    }, [jobName, status, selectedVar]);

    if (!meta) {
        return (
            <div style={{ padding: "20px", color: "#888" }}>
                ⏳ Loading the list of plottable variables…
            </div>
        );
    }

    const varMeta = meta.variables.find((v) => v.name === selectedVar) || null;
    const is3d = varMeta ? varMeta.is3d : false;
    // A 2D variable has no vertical section — force horizontal.
    const effSlice = is3d ? sliceType : "horizontal";

    // Build the Plotly z-grid + axes from the current slice selection.
    let z = null, xData = meta.lon, yData = meta.lat;
    if (fieldData && fieldData.values) {
        if (effSlice === "horizontal") {
            z = is3d ? fieldData.values[depthIdx] : fieldData.values; // lat × lon
            xData = meta.lon; yData = meta.lat;
        } else if (effSlice === "vertical") {
            // vertical: values are [depth][lat][lon]; take the chosen latitude → [depth][lon]
            z = fieldData.values.map((depthRow) => depthRow[latIdx]);
            xData = meta.lon; yData = meta.depth;
        } else {
            // zonal mean: average each [depth][lat] row across longitude (skipping
            // land/null cells) → a depth × latitude section, no longitude chosen.
            z = fieldData.values.map((depthRow) =>
                depthRow.map((lonRow) => {
                    const vals = lonRow.filter((v) => v != null && Number.isFinite(v));
                    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                })
            );
            xData = meta.lat; yData = meta.depth;
        }
    }

    const r = rangeRef.current;
    const haveRange = r && Number.isFinite(r.min) && Number.isFinite(r.max) && r.max > r.min;
    const unitStr = varMeta?.units ? ` (${varMeta.units})` : "";

    const plotData = z
        ? [{
            type: "heatmap",
            x: xData,
            y: yData,
            z,
            colorscale: "Viridis",
            zmin: haveRange ? r.min : undefined,
            zmax: haveRange ? r.max : undefined,
            colorbar: { title: varMeta?.units || "" },
        }]
        : [];

    const horizLayout = {
        title: `${varMeta?.label || selectedVar}${unitStr}`,
        xaxis: { title: "Longitude (°E)", range: [-180, 180], dtick: 60, zeroline: false },
        // lock 1° lat == 1° lon so the map keeps true 2:1 equirectangular proportion
        yaxis: {
            title: "Latitude (°N)", range: [-90, 90], dtick: 30, zeroline: false,
            scaleanchor: "x", scaleratio: 1,
        },
        margin: { t: 40, r: 20, b: 48, l: 52 },
    };
    const vertLayout = {
        title: `${varMeta?.label || selectedVar}${unitStr} — section @ ${fmtLat(meta.lat?.[latIdx])}`,
        xaxis: { title: "Longitude (°E)", range: [-180, 180], dtick: 60, zeroline: false },
        // depth is not degrees, so no scaleanchor; surface (shallowest) on top
        yaxis: { title: "Depth (m)", autorange: "reversed", zeroline: false },
        margin: { t: 40, r: 20, b: 48, l: 60 },
    };
    const zonalLayout = {
        title: `${varMeta?.label || selectedVar}${unitStr} — zonal mean (avg over longitude)`,
        xaxis: { title: "Latitude (°N)", range: [-90, 90], dtick: 30, zeroline: false },
        // depth vs latitude; surface (shallowest) on top
        yaxis: { title: "Depth (m)", autorange: "reversed", zeroline: false },
        margin: { t: 40, r: 20, b: 48, l: 60 },
    };
    const layout = effSlice === "horizontal" ? horizLayout
        : effSlice === "zonal" ? zonalLayout : vertLayout;
    // horizontal keeps a fixed 2:1 box; vertical / zonal fill a shorter wide box
    const boxStyle = effSlice === "horizontal"
        ? { width: "100%", maxWidth: 1100, aspectRatio: "2 / 1" }
        : { width: "100%", maxWidth: 1100, height: 380 };

    const controlStyle = { fontSize: "13px", marginRight: "16px" };

    return (
        <div>
            <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                <label style={controlStyle}>
                    Variable:{" "}
                    <select value={selectedVar} onChange={(e) => setSelectedVar(e.target.value)}>
                        {meta.variables.map((v) => (
                            <option key={v.name} value={v.name}>{v.label}</option>
                        ))}
                    </select>
                </label>
                <label style={controlStyle}>
                    Slice:{" "}
                    <select
                        value={effSlice}
                        onChange={(e) => setSliceType(e.target.value)}
                        disabled={!is3d}
                        title={is3d ? "" : "This variable is surface-only (no vertical section)"}
                    >
                        <option value="horizontal">Horizontal (map)</option>
                        <option value="vertical">Vertical (section)</option>
                        <option value="zonal">Zonal mean (section)</option>
                    </select>
                </label>
                {effSlice === "horizontal" && is3d && (
                    <label style={controlStyle}>
                        Depth:{" "}
                        <select value={depthIdx} onChange={(e) => setDepthIdx(Number(e.target.value))}>
                            {meta.depth.map((d, i) => (
                                <option key={i} value={i}>{Math.round(d)} m</option>
                            ))}
                        </select>
                    </label>
                )}
                {effSlice === "vertical" && (
                    <label style={controlStyle}>
                        Latitude:{" "}
                        <select value={latIdx} onChange={(e) => setLatIdx(Number(e.target.value))}>
                            {meta.lat.map((la, i) => (
                                <option key={i} value={i}>{fmtLat(la)}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {!fieldData ? (
                <div style={{ padding: "20px", color: "#888" }}>
                    ⏳ Waiting for the first annual-average frame — the model writes one
                    per model year, so the first frame appears once year 1 completes.
                </div>
            ) : (
                <>
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: "#333", marginBottom: "6px" }}>
                        Year: {fieldData.year}
                    </div>
                    <div style={boxStyle}>
                        <Plot
                            data={plotData}
                            layout={{ ...layout, autosize: true }}
                            useResizeHandler
                            style={{ width: "100%", height: "100%" }}
                            config={{ responsive: true, displayModeBar: false, displaylogo: false }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// Format a latitude value as e.g. "18°N" / "6°S" / "0°".
const fmtLat = (v) => {
    if (v == null) return "";
    const r = Math.round(v);
    if (r === 0) return "0°";
    return `${Math.abs(r)}°${r > 0 ? "N" : "S"}`;
};

export default Plots;
