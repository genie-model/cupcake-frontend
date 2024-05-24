import React, { useState } from 'react';
import caretRight from 'bootstrap-icons/icons/caret-right.svg';
import caretDown from 'bootstrap-icons/icons/caret-down.svg';

const data = {
  job1: {
    heading: 'Job 1',
    child: {
      job1: {
        heading: 'Job 1.1',
        child: {}
      },
      job2: {
        heading: 'Job 1.2',
        child: {}
      },
      job3: {
        heading: 'Job 1.3',
        child: {}
      }
    }
  }
};

const JobIcon = ({ heading, childExist, isOpen, onClick }) => {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      {childExist && <img src={isOpen ? caretDown : caretRight} alt="caret icon" />}
      {heading}
    </div>
  );
};

const RenderNode = ({ level, heading, childExist, isOpen, onClick }) => {
  const marginLeft = 2 * level+`rem`;
  return (
    <div style={{ marginLeft }}>
      <JobIcon heading={heading} childExist={childExist} isOpen={isOpen} onClick={onClick} />
    </div>
  );
};

const RenderTree = ({ node, level, expandedNodes, toggleNode }) => {
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
        onClick={() => toggleNode(node.heading)}
      />
      {isOpen && hasChild && Object.keys(node.child).map((key) => (
        <RenderTree
          key={key}
          node={node.child[key]}
          level={level + 1}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        />
      ))}
    </div>
  );
};

const FileStructure = () => {
    const [expandedNodes, setExpandedNodes] = useState({});

    const toggleNode = (heading) => {
        setExpandedNodes(prev => ({
        ...prev,
        [heading]: !prev[heading]
        }));
    };

    return (
        <div className="file-dir-container">
        <JobIcon heading="My Jobs" childExist={true} isOpen={expandedNodes["My Jobs"]} onClick={() => toggleNode("My Jobs")} />
        {expandedNodes["My Jobs"] && <RenderTree node={data.job1} level={1} expandedNodes={expandedNodes} toggleNode={toggleNode} />}
        </div>
    );
}

export default FileStructure;