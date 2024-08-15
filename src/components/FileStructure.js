import React, { useState, useEffect } from "react";
import axios from "axios";
import caretRight from "bootstrap-icons/icons/caret-right.svg";
import caretDown from "bootstrap-icons/icons/caret-down.svg";

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

const RenderNode = ({ level, heading, childExist, isOpen, onClick }) => {
  const marginLeft = 2 * level + "rem";
  return (
    <div style={{ marginLeft }}>
      <JobIcon
        heading={heading}
        childExist={childExist}
        isOpen={isOpen}
        onClick={onClick}
      />
    </div>
  );
};

const RenderTree = ({
  node,
  level,
  expandedNodes,
  toggleNode,
  onSelectJob,
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
          />
        ))}
    </div>
  );
};

const FileStructure = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:8001/jobs");
        const jobList = response.data.jobs.map((job) => ({
          heading: job.name,
          child: {},
        }));
        setJobs(jobList);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchJobs();
  }, []);

  const toggleNode = (heading) => {
    setExpandedNodes((prev) => {
      const isCollapsed = prev[heading];
      const newExpandedNodes = { ...prev, [heading]: !isCollapsed };
      // If collapsing "My Jobs", clear the selected job
      if (heading === "My Jobs" && isCollapsed && onSelectJob) {
        onSelectJob(null);
      }
      return newExpandedNodes;
    });
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
            onSelectJob={onSelectJob}
          />
        ))}
    </div>
  );
};

export default FileStructure;
