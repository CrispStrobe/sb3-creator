#!/usr/bin/env node
// Visual/UX audit of gallery examples — lightweight version.
// Parses each program.bw, checks for issues that would be visible in the app:
// - Parse warnings (blocks that won't render)
// - Extension requirements (missing extensions)
// - Block counts and script counts
// - Device/pin declarations
// - Comment-only programs (pure circuit, no blocks)
//
//   node test/browser/visual-audit.mjs
//
// Writes examples/AUDIT/visual-audit.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import SB3Creator from '../../src/utils/sb3Creator.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(dir, '..', '..', 'examples');

// Collect all gallery examples with program.bw
const allExamples = fs.readdirSync(examplesDir)
    .filter(d => {
        if (d === 'AUDIT') return false;
        try {
            const s = fs.statSync(path.join(examplesDir, d));
            return s.isDirectory() && fs.existsSync(path.join(examplesDir, d, 'program.bw'));
        } catch { return false; }
    })
    .sort();

console.log(`Visual audit (parse-level): ${allExamples.length} examples`);

const results = [];

for (const name of allExamples) {
    const bwCode = fs.readFileSync(path.join(examplesDir, name, 'program.bw'), 'utf8');
    const sc = new SB3Creator();

    let verdict = 'visual-pass';
    let detail = {};

    try {
        sc.parse(bwCode);
        const warns = sc.warnings || [];
        const project = sc.project || {};
        const stc = project.stc || {};

        // Count blocks and scripts
        const targets = project.targets || [];
        let blockCount = 0;
        let scriptCount = 0;
        for (const t of targets) {
            const blocks = t.blocks || {};
            const bkeys = Object.keys(blocks);
            blockCount += bkeys.length;
            scriptCount += bkeys.filter(k => blocks[k].topLevel).length;
        }

        // Check if comment-only (pure circuit)
        const isCommentOnly = bwCode.trim().split('\n').every(l => l.trim() === '' || l.trim().startsWith('#'));

        // Check for device/pins
        const device = stc.device || null;
        const pins = stc.pins || [];
        const extensions = project.extensions || [];

        detail = {
            parseWarnings: warns.length,
            blocks: blockCount,
            scripts: scriptCount,
            device,
            pins: pins.length,
            extensions: extensions.length,
            commentOnly: isCommentOnly,
        };

        // Determine verdict
        if (warns.length > 0) {
            // Parse warnings mean some lines didn't become blocks
            const warnTexts = warns.map(w => (w.message || String(w)).slice(0, 100));
            detail.warnings = warnTexts.slice(0, 5);

            // Check if warnings are critical (skipped lines that should be blocks)
            const skipped = warns.filter(w => (w.message || String(w)).includes('Skipping'));
            if (skipped.length > 0 && !isCommentOnly) {
                verdict = 'content-bug';
                detail.reason = `${skipped.length} lines skipped by parser`;
            }
        }

        if (blockCount === 0 && !isCommentOnly) {
            verdict = 'content-bug';
            detail.reason = 'no blocks generated from non-empty program';
        }

    } catch (e) {
        verdict = 'app-bug';
        detail = { error: (e.message || String(e)).slice(0, 200) };
    }

    results.push({ name, verdict, ...detail });
    const icon = verdict === 'visual-pass' ? '✓' : verdict === 'content-bug' ? '!' : '✗';
    const summary = verdict === 'visual-pass'
        ? `blocks=${detail.blocks} scripts=${detail.scripts} warns=${detail.parseWarnings}`
        : detail.reason || detail.error || '';
    process.stdout.write(`  ${icon} ${name}: ${verdict} — ${summary}\n`);
}

// Write results
const outFile = path.join(examplesDir, 'AUDIT', 'visual-audit.json');
fs.writeFileSync(outFile, JSON.stringify(results, null, 1));

const passes = results.filter(r => r.verdict === 'visual-pass').length;
const contentBugs = results.filter(r => r.verdict === 'content-bug').length;
const appBugs = results.filter(r => r.verdict === 'app-bug').length;
const commentOnly = results.filter(r => r.commentOnly).length;
console.log(`\nDone: ${passes} visual-pass, ${contentBugs} content-bug, ${appBugs} app-bug, ${commentOnly} comment-only (pure circuit)`);
