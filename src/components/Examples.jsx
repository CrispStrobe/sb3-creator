import React from 'react';

function Examples({ onExampleChange }) {
    return (
        <div className="examples-dropdown">
            <label htmlFor="example-select">Load an Example:</label>
            <select id="example-select" onChange={(e) => onExampleChange(e.target.value)} defaultValue="game">
                <option value="game">🎯 Complete Game</option>
                <option value="art">🎨 Digital Art</option>
                <option value="physics">⚡ Physics Demo</option>
                <option value="educational">📚 Educational Tool</option>
            </select>
        </div>
    );
}

export default Examples;