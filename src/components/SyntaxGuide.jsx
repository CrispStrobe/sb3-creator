import React from 'react';

function SyntaxGuide() {
    return (
        <details className="syntax-details">
            <summary>📝 View Quick Syntax Reference</summary>
            <div className="syntax-guide">
                <div className="syntax-grid">
                    <div className="syntax-section">
                        <h4>Structure</h4>
                        <ul>
                            <li><code>SPRITE SpriteName:</code></li>
                            <li><code>STAGE:</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Events</h4>
                        <ul>
                            <li><code>WHEN flag clicked:</code></li>
                            <li><code>WHEN key space pressed:</code></li>
                            <li><code>WHEN sprite clicked:</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Control</h4>
                        <ul>
                            <li><code>FOREVER:</code></li>
                            <li><code>REPEAT 10:</code></li>
                            <li><code>IF condition THEN:</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Commands</h4>
                        <ul>
                            <li><code>move 10 steps</code></li>
                            <li><code>say Hello for 2 seconds</code></li>
                            <li><code>set score to 0</code></li>
                        </ul>
                    </div>
                </div>
            </div>
        </details>
    );
}

export default SyntaxGuide;