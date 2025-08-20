import React from 'react';

function Editor({ pseudocode, onPseudocodeChange, output }) {
    return (
        <div className="editor-grid">
            <div className="editor-panel">
                <div className="panel-header">
                    <span>✏️</span>
                    <span>Pseudocode Input</span>
                </div>
                <div className="panel-content">
                    <textarea 
                        id="pseudocode" 
                        placeholder="Enter your pseudocode here..."
                        value={pseudocode}
                        onChange={onPseudocodeChange}
                    ></textarea>
                </div>
            </div>
            
            <div className="editor-panel">
                <div className="panel-header">
                    <span>🔧</span>
                    <span>Generated Structure (JSON)</span>
                </div>
                <div className="panel-content">
                    <textarea 
                        id="output" 
                        readOnly 
                        placeholder="Generated Scratch project structure will appear here..."
                        value={output}
                    ></textarea>
                </div>
            </div>
        </div>
    );
}

export default Editor;