import React from 'react';

function Controls({ onGenerate, onValidate, onDownload, onClear, isReady }) {
    return (
        <div className="controls">
            <button onClick={onGenerate}>
                <span>🚀</span>
                Generate SB3
            </button>
            <button onClick={onValidate} disabled={!isReady}>
                <span>✅</span>
                Validate
            </button>
            <button onClick={onDownload} disabled={!isReady}>
                <span>💾</span>
                Download
            </button>
            <button onClick={onClear} style={{ background: 'linear-gradient(135deg, #64748b, #94a3b8)' }}>
                <span>🗑️</span>
                Clear
            </button>
        </div>
    );
}

export default Controls;