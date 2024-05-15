import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCog, faList, faFileAlt, faChartBar } from '@fortawesome/free-solid-svg-icons';


function HomePage() {
    const [showDiv, setShowDiv] = useState(false);
    const [showList, setShowList] = useState(false);

    const handleClick = () => {
        setShowDiv(true);
    };

    const divStyle = {
        display: showDiv ? 'block' : 'none',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        marginTop: '20px',
    };

    const jobs = ["job1","job2","job3"];

    const jobIcon = (heading) => (<div className='header'>
        <img></img>
        {heading}          
    </div>);

    return (
        <>
            <div>
                <p className="top-text">Job</p>
                <div className="parent">
                    <div className="palatte-area">
                        <button className='job-list' onClick={()=>setShowList(!showList)}>
                        {jobIcon("My Jobs")}
                        </button>
                        {showList && <div>{jobs.map((name) => <div className='job'>{jobIcon(name)}</div>)}</div>}
                    </div>
                    <div className='content-area'>
                        <div className='icons'></div>
                        <div className='task'>
                            <button>1</button>
                            <button>2</button>
                            <button>3</button>
                            <button>4</button>
                            <button>5</button>
                        </div>
                    </div>
                </div>
            </div>
            
        </>  
    );
}

export default HomePage;