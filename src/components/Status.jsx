import React from 'react';

function Status({ status, isLoading }) {
    return (
        <>
            {status.message && (
                <div className={`status ${status.type}`}>
                    {status.message}
                </div>
            )}
            {isLoading && (
                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            )}
        </>
    );
}

export default Status;