import React, { useState } from "react";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
    ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const Output = () => {
    const [selectedDataFile, setSelectedDataFile] = useState('');
    const [selectedVariable, setSelectedVariable] = useState('');

    const dataFiles = ['File1', 'File2', 'File3']; // Replace with actual file names
    const variables = ['uv', 'pv', 'amt']; // Replace with actual variable names

    const chartData = [
        { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
        { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
        { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
        { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
        { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
        { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
        { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 }
    ];

    const handleDataFileChange = (event) => {
        setSelectedDataFile(event.target.value);
    };

    const handleVariableChange = (event) => {
        setSelectedVariable(event.target.value);
    };

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

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        padding: '20px'
    };

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <label>
                    Data File:
                    <select value={selectedDataFile} onChange={handleDataFileChange}>
                        {dataFiles.map((file, index) => (
                            <option key={index} value={file}>
                                {file}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ marginLeft: '20px' }}>
                    Variable:
                    <select value={selectedVariable} onChange={handleVariableChange}>
                        {variables.map((variable, index) => (
                            <option key={index} value={variable}>
                                {variable}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div style={gridContainerStyle}>
                {renderLineChart()}
                {renderBarChart()}
                {renderPieChart()}
                {renderAreaChart()}
                {renderScatterChart()}
                {renderRadarChart()}
                {renderComposedChart()}
            </div>
        </div>
    );
};

export default Output;
