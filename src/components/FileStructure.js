import React, { useState, useEffect } from "react";
import axios from "axios";
import caretRight from "bootstrap-icons/icons/caret-right.svg";
import caretDown from "bootstrap-icons/icons/caret-down.svg";

// JobIcon component for showing jobs in the tree
const JobIcon = ({ heading, childExist, isOpen, onClick }) => {
  return (
    <div onClick={onClick} style={{ cursor: "pointer" }}>
      {childExist && (
        <img src={isOpen ? caretDown : caretRight} alt="caret icon" />
      )}
      {heading}
    </div>
  );
};

// RenderNode component for each job in the file structure
const RenderNode = ({
  level,
  heading,
  childExist,
  isOpen,
  onClick,
  selected,
}) => {
  const marginLeft = `${2 * level}rem`;
  return (
    <div style={{ marginLeft }} className={selected ? "selected-job" : ""}>
      <JobIcon
        heading={heading}
        childExist={childExist}
        isOpen={isOpen}
        onClick={onClick}
      />
    </div>
  );
};

// Recursive function to render the tree structure
const RenderTree = ({
  node,
  level,
  expandedNodes,
  toggleNode,
  onSelectJob,
  selectedJob,
}) => {
  if (!node) return null;

  const isOpen = expandedNodes[node.heading];
  const hasChild = node.child && Object.keys(node.child).length > 0;

  return (
    <div>
      <RenderNode
        level={level}
        heading={node.heading}
        childExist={hasChild}
        isOpen={isOpen}
        onClick={() => {
          toggleNode(node.heading);
          if (!hasChild && onSelectJob) {
            onSelectJob(node.heading);
          }
        }}
        selected={node.heading === selectedJob}
      />
      {isOpen &&
        hasChild &&
        Object.keys(node.child).map((key) => (
          <RenderTree
            key={key}
            node={node.child[key]}
            level={level + 1}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            onSelectJob={onSelectJob}
            selectedJob={selectedJob}
          />
        ))}
    </div>
  );
};

// Main FileStructure component
const FileStructure = ({ onSelectJob, setRefreshJobs }) => {
  const [jobs, setJobs] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch the list of jobs
  const fetchJobs = async () => {
    try {
      const response = await axios.get("http://localhost:8000/jobs");
      const jobList = response.data.jobs.map((job) => ({
        heading: job.name,
        child: {},
      }));
      setJobs(jobList);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchJobs();
    setRefreshJobs(() => fetchJobs);
  }, [setRefreshJobs]);

  const toggleNode = (heading) => {
    setExpandedNodes((prev) => {
      const isCollapsed = prev[heading];
      const newExpandedNodes = { ...prev, [heading]: !isCollapsed };
      if (heading === "My Jobs" && !isCollapsed) {
        setSelectedJob(null);
        if (onSelectJob) {
          onSelectJob(null);
        }
      }
      return newExpandedNodes;
    });
  };

  const handleSelectJob = (jobName) => {
    setSelectedJob(jobName);
    if (onSelectJob) {
      onSelectJob(jobName);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="file-dir-container">
      <JobIcon
        heading="My Jobs"
        childExist={true}
        isOpen={expandedNodes["My Jobs"]}
        onClick={() => toggleNode("My Jobs")}
      />
      {expandedNodes["My Jobs"] &&
        jobs.map((job, index) => (
          <RenderTree
            key={index}
            node={job}
            level={1}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            onSelectJob={handleSelectJob}
            selectedJob={selectedJob}
          />
        ))}
    </div>
  );
};

export default FileStructure;
