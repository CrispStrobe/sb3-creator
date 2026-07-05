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
                            <li><code>SPRITE Name:</code></li>
                            <li><code>STAGE:</code></li>
                            <li><code>GLOBAL score</code> / <code>LOCAL hp</code></li>
                            <li><code>LIST inventory</code></li>
                            <li><code># comment</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Events (hats)</h4>
                        <ul>
                            <li><code>WHEN flag clicked:</code></li>
                            <li><code>WHEN space key pressed:</code></li>
                            <li><code>WHEN sprite clicked:</code></li>
                            <li><code>WHEN I receive "go":</code></li>
                            <li><code>WHEN I start as a clone:</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Control</h4>
                        <ul>
                            <li><code>FOREVER:</code></li>
                            <li><code>REPEAT 10:</code></li>
                            <li><code>REPEAT UNTIL x &gt; 5:</code></li>
                            <li><code>IF cond THEN:</code> / <code>ELSE:</code></li>
                            <li><code>wait until cond</code></li>
                            <li><code>stop all</code> / <code>stop this script</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Clones &amp; broadcasts</h4>
                        <ul>
                            <li><code>create clone of myself</code></li>
                            <li><code>create clone of Bullet</code></li>
                            <li><code>delete this clone</code></li>
                            <li><code>broadcast "go"</code></li>
                            <li><code>broadcast "go" and wait</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Motion &amp; Looks</h4>
                        <ul>
                            <li><code>move 10 steps</code></li>
                            <li><code>go to x: 0 y: 0</code></li>
                            <li><code>glide 1 secs to x: 50 y: 0</code></li>
                            <li><code>point towards mouse-pointer</code></li>
                            <li><code>set size to 80</code> / <code>set ghost effect to 50</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Data &amp; lists</h4>
                        <ul>
                            <li><code>set score to 0</code></li>
                            <li><code>change score by 1</code></li>
                            <li><code>add 5 to nums</code></li>
                            <li><code>delete all of nums</code></li>
                            <li><code>replace item 1 of nums with 9</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Expressions</h4>
                        <ul>
                            <li><code>(a + b) * c</code>, <code>7 mod 3</code></li>
                            <li><code>pick random 1 to 10</code></li>
                            <li><code>round x</code>, <code>sqrt of x</code></li>
                            <li><code>"Score: " join score</code></li>
                            <li><code>x position</code>, <code>size</code>, <code>timer</code>, <code>answer</code></li>
                        </ul>
                    </div>
                    <div className="syntax-section">
                        <h4>Conditions</h4>
                        <ul>
                            <li><code>a &gt; b</code>, <code>a &lt;= b</code>, <code>a = b</code></li>
                            <li><code>cond and cond</code> / <code>or</code> / <code>not cond</code></li>
                            <li><code>touching Sprite</code> / <code>touching color #ff0000</code></li>
                            <li><code>key space pressed?</code> / <code>mouse down?</code></li>
                            <li><code>nums contains 3</code></li>
                        </ul>
                    </div>
                </div>
            </div>
        </details>
    );
}

export default SyntaxGuide;
