import React, { useState } from 'react';
import FileStructure from './FileStructure';
import 'bootstrap/dist/css/bootstrap.min.css';

function HomePage() {
    const [showDiv, setShowDiv] = useState(false);

    const palleteIconClasses = ['glyphicon glyphicon-plus', 'glyphicon glyphicon-plus', 'glyphicon glyphicon-plus', 'glyphicon glyphicon-plus'];

    const palatteIcon = (iconClass) => {
        return (
            <div className='palatte-icon'>
                <button type="button" className="btn btn-default btn-sm">
                    <span className={iconClass}></span> Plus
                </button>
                <hr />
            </div>
        );
    }

    const divStyle = {
        display: showDiv ? 'block' : 'none',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        marginTop: '20px',
    };

    return (
        <>
            <div>
                <p className="top-text">Job</p>
                <div className="parent">
                    <div className="palatte-area">
                        <FileStructure />
                    </div>
                    <div className='content-area'>
                        <div className='icons'>
                            {
                                palleteIconClasses.map((iconClass, index) => (
                                    <div key={index}>
                                        {palatteIcon(iconClass)}
                                    </div>
                                ))
                            }
                        </div>
                        <div className='task'>
                            
                            <button>Status</button>
                            <button>Setup</button>
                            <button>Namelists</button>
                            <button>Output</button>
                            <button>Plots</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomePage;
