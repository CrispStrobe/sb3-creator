import React, { useState, useRef, useEffect } from 'react';
import RobustSB3Creator from './utils/sb3Creator';
import examples from './utils/examples';

import Header from './components/Header';
import SyntaxGuide from './components/SyntaxGuide';
import SvgUploader from './components/SvgUploader';
import Examples from './components/Examples';
import Editor from './components/Editor';
import Controls from './components/Controls';
import Status from './components/Status';

function App() {
    const [pseudocode, setPseudocode] = useState('');
    const [output, setOutput] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [svgUploads, setSvgUploads] = useState([]); // [{ sprite, filename, svg }]
    
    const creatorRef = useRef(null);
    if (!creatorRef.current) {
        creatorRef.current = new RobustSB3Creator();
    }

    // Seed the editor with a default example on mount.
    useEffect(() => {
        setPseudocode(examples.game);
    }, []);

    const showStatus = (message, type, duration = 5000) => {
        setStatus({ message, type });
        // Only auto-clear success messages
        if (type === 'success') {
            setTimeout(() => setStatus(s => (s.message === message ? { message: '', type: '' } : s)), duration);
        }
    };

    const handleExampleChange = (exampleName) => {
        if (examples[exampleName]) {
            setPseudocode(examples[exampleName]);
            showStatus('Example loaded successfully!', 'success');
            setOutput('');
            setIsReady(false);
        }
    };

    const handleGenerate = () => {
        if (!pseudocode.trim()) {
            showStatus('Please enter some pseudocode first!', 'error');
            return;
        }

        setIsLoading(true);
        showStatus('Generating SB3 file...', 'info');

        setTimeout(() => {
            try {
                const project = creatorRef.current.parse(pseudocode);

                // Bake any uploaded SVGs onto their sprites (after parse, before packaging).
                const missing = [];
                svgUploads.forEach((u) => {
                    const name = (u.sprite || '').trim();
                    if (!name || !u.svg) return;
                    if (!creatorRef.current.applyCustomSVG(name, u.svg)) missing.push(name);
                });

                const outputJson = JSON.stringify(project, null, 2);
                setOutput(outputJson);

                creatorRef.current.generateSB3().then(() => {
                    setIsReady(true);
                    const validation = creatorRef.current.validate();
                    const warns = [...validation.parsingWarnings];
                    if (missing.length) warns.push(`no sprite named ${missing.join(', ')} for uploaded SVG`);
                    if (warns.length > 0) {
                        showStatus(`Generated with warnings: ${warns.join(' · ')}`, 'warning');
                    } else {
                        showStatus('SB3 file generated successfully!', 'success');
                    }
                }).catch(err => {
                    showStatus(`Error generating SB3 file: ${err.message}`, 'error');
                    setIsReady(false);
                });
            } catch (error) {
                showStatus(`Parsing Error: ${error.message}`, 'error');
                console.error('Parsing error details:', error);
                setIsReady(false);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    const handleValidate = () => {
        try {
            const validation = creatorRef.current.validate();
            let message = '';
            if (validation.isValid && validation.parsingWarnings.length === 0) {
                message = `✅ Valid! | Scripts: ${validation.scriptsFound}, Vars: ${validation.variablesCreated}`;
                showStatus(message, 'success');
            } else if (validation.isValid && validation.parsingWarnings.length > 0) {
                message = `⚠️ Valid with warnings: ${validation.parsingWarnings.join(', ')}`;
                showStatus(message, 'warning');
            } else {
                message = `❌ Invalid: ${validation.errors.join(', ')}`;
                showStatus(message, 'error');
            }
        } catch (error) {
            showStatus(`Validation error: ${error.message}`, 'error');
        }
    };

    const handleDownload = () => {
        const sb3Blob = creatorRef.current.generatedSB3;
        if (!sb3Blob) {
            showStatus('Please generate an SB3 file first!', 'error');
            return;
        }
        try {
            const url = URL.createObjectURL(sb3Blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated_project.sb3';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showStatus('SB3 file download started!', 'success');
        } catch (error) {
            showStatus(`Download error: ${error.message}`, 'error');
        }
    };

    // Open the generated project directly in the hosted Scratch (TurboWarp) editor.
    // The whole .sb3 is passed as a data: URL in the location HASH — the fragment is
    // never sent to the server, so it avoids the 414 URI-Too-Long that a query string
    // of this size would hit on GitHub Pages.
    const SCRATCH_EDITOR = 'https://crispstrobe.github.io/scratch-gui/editor.html';
    const handleOpenInScratch = () => {
        const blob = creatorRef.current.generatedSB3;
        if (!blob) {
            showStatus('Please generate an SB3 file first!', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = String(reader.result).split(',')[1];
            const dataUrl = `data:application/octet-stream;base64,${base64}`;
            const url = `${SCRATCH_EDITOR}#project_url=${encodeURIComponent(dataUrl)}`;
            window.open(url, '_blank', 'noopener');
            showStatus('Opening your project in Scratch…', 'success');
        };
        reader.onerror = () => showStatus('Could not read the generated file.', 'error');
        reader.readAsDataURL(blob);
    };

    const addSvgUpload = (u) => setSvgUploads((list) => [...list, u]);
    const removeSvgUpload = (i) => setSvgUploads((list) => list.filter((_, idx) => idx !== i));
    const setUploadSprite = (i, sprite) =>
        setSvgUploads((list) => list.map((u, idx) => (idx === i ? { ...u, sprite } : u)));

    const handleClear = () => {
        setPseudocode('');
        setOutput('');
        setIsReady(false);
        creatorRef.current.generatedSB3 = null;
        showStatus('All cleared!', 'success');
    };

    return (
        <div className="container">
            <Header />
            <main className="main-content">
                <div className="controls-bar">
                    <Examples onExampleChange={handleExampleChange} />
                    <SyntaxGuide />
                    <SvgUploader
                        uploads={svgUploads}
                        onAdd={addSvgUpload}
                        onRemove={removeSvgUpload}
                        onSpriteChange={setUploadSprite}
                    />
                </div>
                
                <Editor
                    pseudocode={pseudocode}
                    onPseudocodeChange={(e) => setPseudocode(e.target.value)}
                    output={output}
                />
                
                <Controls
                    onGenerate={handleGenerate}
                    onValidate={handleValidate}
                    onDownload={handleDownload}
                    onOpenInScratch={handleOpenInScratch}
                    onClear={handleClear}
                    isReady={isReady}
                />
                
                <div className="status-bar">
                  <Status status={status} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
}

export default App;