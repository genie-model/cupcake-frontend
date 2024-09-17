import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Namelists = ({ job }) => {
    const [namelists, setNamelists] = useState([]);
    const [selectedNamelist, setSelectedNamelist] = useState('');
    const [namelistContent, setNamelistContent] = useState('');

    useEffect(() => {
        if (job) {
            // Fetch namelists for the selected job
            axios.get(`http://localhost:8001/jobs/${job.name}/namelists`)
                .then((response) => {
                    setNamelists(response.data.namelists);
                    if (response.data.namelists.length > 0) {
                        setSelectedNamelist(response.data.namelists[0]);
                        fetchNamelistContent(response.data.namelists[0]);
                    } else {
                        setSelectedNamelist(''); // No namelist available
                        setNamelistContent(''); // Clear previous content
                    }
                })
                .catch((error) => {
                    console.error("Error fetching namelists:", error);
                });
        } else {
            setNamelists([]); // Reset namelists when no job is selected
            setSelectedNamelist(''); // Reset selected namelist
            setNamelistContent(''); // Clear previous content
        }
    }, [job]);

    const fetchNamelistContent = (namelistName) => {
        if (namelistName) {
            axios.get(`http://localhost:8001/jobs/${job.name}/namelists/${namelistName}`)
                .then((response) => {
                    setNamelistContent(response.data.content);
                })
                .catch((error) => {
                    console.error("Error fetching namelist content:", error);
                });
        }
    };

    const handleNamelistChange = (e) => {
        const selected = e.target.value;
        setSelectedNamelist(selected);
        fetchNamelistContent(selected);
    };

    return (
        <div>
            {!job ? (
                <p>No job selected.</p> // Message when no job is selected
            ) : namelists.length > 0 ? (
                <div>
                    <br/>
                    <label htmlFor="namelistDropdown">Choose Namelist: </label>
                    <select
                        id="namelistDropdown"
                        value={selectedNamelist}
                        onChange={handleNamelistChange}
                    >
                        {namelists.map((namelist) => (
                            <option key={namelist} value={namelist}>
                                {namelist}
                            </option>
                        ))}
                    </select>
                    {namelistContent && (
                        <div>
                            <h4>Namelist Content:</h4>
                            <pre>{namelistContent}</pre>
                        </div>
                    )}
                </div>
            ) : (
                <p>No namelists available for this job.</p> // Message when job is selected but no namelists are available
            )}
        </div>
    );
};

export default Namelists;
