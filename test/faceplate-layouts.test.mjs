/**
 * Faceplate `controller.json` layouts — the schema gate the corpus never had.
 *
 * A faceplate example ships a panel layout beside its program. The host
 * (brickwright-lite's `pseudocode-importer.jsx`) restores it and then calls
 * `panel.setMode(layout.mode)` ONLY IF the file says so — and the panel model
 * defaults to `edit`, where every input control renders `disabled`.
 *
 * So a layout that carries a button and no `mode` opens with its buttons dead,
 * and nothing in either repo said a word about it. Four of the eleven shipped
 * layouts were in that state, including `retro-console` and `lego-hub-face` —
 * the benches for three lessons in brickwright-lite's Wave 4
 * ("Interactive systems"), whose review found it by driving the real panel:
 * `docs/LESSON-REVIEW-WAVE-4.md` defect 5b.
 *
 * Display-only layouts are unaffected (the variable pump ignores mode), which
 * is why the rule below is conditional on the layout actually carrying an input.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EX = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'examples');

// Widget kinds a learner OPERATES. A layout made only of displays and
// decorations is legitimately mode-agnostic; one with any of these is not.
const INPUT_TYPES = new Set(['button', 'slider', 'joystick', 'dpad', 'dial', 'keypad', 'keyboard']);

const layouts = readdirSync(EX, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(EX, d.name, 'controller.json'))
    .filter(existsSync)
    .map(file => ({ id: path.basename(path.dirname(file)), file, data: JSON.parse(readFileSync(file, 'utf8')) }));

test('the corpus still ships faceplate layouts for this gate to check', () => {
    // MEASURED 2026-08-29 (scripts/threshold-observe.mjs, 40-file sweep, box load 16-53):
    // layouts.length >= 11 -> observed 13.
    assert.ok(layouts.length >= 11, `only ${layouts.length} controller.json layouts found`);
});

test('every layout with an input widget declares "mode": "play"', () => {
    const dead = [];
    for (const { id, data } of layouts) {
        const widgets = Array.isArray(data.widgets) ? data.widgets : [];
        if (!widgets.some(w => INPUT_TYPES.has(w.type))) continue;
        if (data.mode !== 'play') dead.push(`${id} (mode: ${JSON.stringify(data.mode)})`);
    }
    assert.deepEqual(dead, [],
        'these layouts carry operable controls but do not open in play mode, so every control ' +
        'renders disabled until the learner finds the Play button:\n  ' + dead.join('\n  '));
});

test('no layout declares a mode the panel does not have', () => {
    for (const { id, data } of layouts) {
        if (data.mode === undefined) continue;
        assert.ok(data.mode === 'play' || data.mode === 'edit',
            `${id}: mode ${JSON.stringify(data.mode)} is neither "play" nor "edit" — ` +
            'ControllerPanel.setMode throws on anything else, and the importer calls it unguarded');
    }
});

test('every layout is version 1 with a widgets array and unique widget names', () => {
    for (const { id, data } of layouts) {
        assert.equal(data.version, 1, `${id}: ControllerPanel.fromJSON refuses any version but 1`);
        assert.ok(Array.isArray(data.widgets), `${id}: no widgets array`);
        const names = data.widgets.map(w => w.name);
        assert.deepEqual([...new Set(names)].sort(), [...names].sort(),
            `${id}: duplicate widget name — addWidget throws on the second one, and the host's ` +
            'restore loop removes every existing widget before it adds any');
    }
});
