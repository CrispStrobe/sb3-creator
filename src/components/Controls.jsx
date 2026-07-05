import React from 'react';

function Controls({ onGenerate, onValidate, onDownload, onOpenInScratch, onClear, isReady }) {
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
            <button onClick={onOpenInScratch} disabled={!isReady} style={{ background: 'linear-gradient(135deg, #ff8c1a, #ffab19)' }}>
                <span>🐱</span>
                Open in Scratch
            </button>
            <button onClick={onClear} style={{ background: 'linear-gradient(135deg, #64748b, #94a3b8)' }}>
                <span>🗑️</span>
                Clear
            </button>
        </div>
    );
}

export default Controls;