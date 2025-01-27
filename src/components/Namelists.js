import React, { useState, useEffect } from "react";
import axios from "axios";

const Namelists = ({ job }) => {
  const [namelists, setNamelists] = useState([]);
  const [selectedNamelist, setSelectedNamelist] = useState("");
  const [namelistContent, setNamelistContent] = useState("");
  const [loadingNamelists, setLoadingNamelists] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (job && job.name) {
      // Fetch namelists for the selected job
      setLoadingNamelists(true);
      axios
        .get(`http://localhost:8000/jobs/${job.name}/namelists`)
        .then((response) => {
          setNamelists(response.data.namelists);
          if (response.data.namelists.length > 0) {
            const firstNamelist = response.data.namelists[0];
            setSelectedNamelist(firstNamelist);
            fetchNamelistContent(firstNamelist);
          } else {
            setSelectedNamelist(""); // No namelist available
            setNamelistContent(""); // Clear previous content
          }
          setLoadingNamelists(false);
        })
        .catch((error) => {
          console.error("Error fetching namelists:", error);
          setError("Error fetching namelists.");
          setLoadingNamelists(false);
        });
    } else {
      // Reset state when no job is selected
      setNamelists([]);
      setSelectedNamelist("");
      setNamelistContent("");
      setError(null);
    }
  }, [job]);

  const fetchNamelistContent = (namelistName) => {
    if (namelistName && job && job.name) {
      setLoadingContent(true);
      axios
        .get(
          `http://localhost:8000/jobs/${encodeURIComponent(
            job.name,
          )}/namelists/${encodeURIComponent(namelistName)}`,
        )
        .then((response) => {
          setNamelistContent(response.data.content);
          setLoadingContent(false);
        })
        .catch((error) => {
          console.error("Error fetching namelist content:", error);
          setError("Error fetching namelist content.");
          setLoadingContent(false);
        });
    }
  };

  const handleNamelistChange = (e) => {
    const selected = e.target.value;
    setSelectedNamelist(selected);
    setNamelistContent(""); // Clear previous content
    fetchNamelistContent(selected);
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!job) {
    return (
      <div>
        <p>No job selected.</p>
      </div>
    );
  }

  if (loadingNamelists) {
    return <div>Loading namelists...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      {namelists.length > 0 ? (
        <div>
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
          {loadingContent ? (
            <div>Loading content...</div>
          ) : namelistContent ? (
            <div
              style={{
                marginTop: "20px",
                border: "1px solid #ccc",
                padding: "10px",
                maxHeight: "400px",
                overflowY: "auto",
                backgroundColor: "#f9f9f9",
              }}
            >
              <pre style={{ fontFamily: "monospace" }}>{namelistContent}</pre>
            </div>
          ) : (
            <p>No content available for this namelist.</p>
          )}
        </div>
      ) : (
        <p>No namelists available for this job.</p>
      )}
    </div>
  );
};

export default Namelists;
