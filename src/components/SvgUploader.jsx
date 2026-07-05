import React, { useRef } from 'react';

// Upload SVG files and assign each to a sprite by name. On Generate, each SVG is
// baked in as that sprite's costume (replacing the generated shape/circle).
function SvgUploader({ uploads, onAdd, onRemove, onSpriteChange }) {
    const fileRef = useRef(null);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((f) => {
            if (!/\.svg$/i.test(f.name) && !f.type.includes('svg')) return;
            const reader = new FileReader();
            reader.onload = () => onAdd({ sprite: '', filename: f.name, svg: String(reader.result) });
            reader.readAsText(f);
        });
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <details className="syntax-details">
            <summary>🖼️ Custom sprite art (upload SVG)</summary>
            <div className="syntax-guide">
                <p style={{ margin: '0 0 8px' }}>
                    Upload one or more <code>.svg</code> files, then type the name of the sprite each
                    should become. On <strong>Generate SB3</strong>, every SVG is baked in as that
                    sprite&apos;s costume — and travels with the project into Scratch.
                </p>
                <input
                    ref={fileRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    multiple
                    onChange={handleFiles}
                />
                {uploads.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0' }}>
                        {uploads.map((u, i) => (
                            <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                <input
                                    placeholder="sprite name"
                                    value={u.sprite}
                                    onChange={(e) => onSpriteChange(i, e.target.value)}
                                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                />
                                <span style={{ opacity: 0.7, fontSize: '0.85em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {u.filename}
                                </span>
                                <button
                                    onClick={() => onRemove(i)}
                                    style={{ background: 'linear-gradient(135deg, #64748b, #94a3b8)', padding: '4px 10px' }}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </details>
    );
}

export default SvgUploader;
