import React from 'react';
import examples from '../utils/examples';

// Grouped, labelled catalogue of the built-in examples. Any example key not listed
// here still shows up under "Other", so nothing is silently hidden.
const GROUPS = [
    {
        label: 'Games',
        items: [
            ['snake', '🐍 Snake'],
            ['snake_pro', '🐍 Snake (growing tail)'],
            ['breakout', '🧱 Breakout'],
            ['pong_2p', '🏓 Pong (2 players)'],
            ['pong_ai', '🤖 Pong (vs AI)'],
            ['tetris', '🟦 Tetris'],
            ['sokoban', '📦 Sokoban'],
            ['bomberman', '💣 Bomberman'],
            ['invaders', '👾 Space Invaders'],
            ['flappy', '🐤 Flappy'],
            ['tictactoe', '⭕ Tic-Tac-Toe (2 players)'],
            ['tictactoe_ai', '⭕ Tic-Tac-Toe (vs AI)'],
            ['g2048', '🔢 2048'],
            ['maze', '👻 Maze Chase'],
        ],
    },
    {
        label: 'Demos',
        items: [
            ['game', '🎯 Complete Game'],
            ['art', '🎨 Digital Art'],
            ['physics', '⚡ Physics Demo'],
            ['animation', '🎞️ Animation & Sound'],
            ['educational', '📚 Educational Tool'],
        ],
    },
    {
        label: 'Language basics',
        items: [
            ['motion', 'Motion'],
            ['looks', 'Looks'],
            ['sound', 'Sound'],
            ['pen', 'Pen'],
            ['sensing', 'Sensing'],
            ['control', 'Control'],
            ['operators', 'Operators'],
        ],
    },
];

function Examples({ onExampleChange }) {
    const listed = new Set(GROUPS.flatMap((g) => g.items.map(([key]) => key)));
    const other = Object.keys(examples).filter((k) => !listed.has(k));

    return (
        <div className="examples-dropdown">
            <label htmlFor="example-select">Load an Example:</label>
            <select id="example-select" onChange={(e) => onExampleChange(e.target.value)} defaultValue="game">
                {GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                        {group.items
                            .filter(([key]) => examples[key])
                            .map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                    </optgroup>
                ))}
                {other.length > 0 && (
                    <optgroup label="Other">
                        {other.map((key) => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
    );
}

export default Examples;
