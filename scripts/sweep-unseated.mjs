#!/usr/bin/env node
/**
 * Sweep all example circuits for seating issues.
 *
 * Two checks:
 * 1. Circuits with ZERO breadboard-kind parts (schematic-style — reported
 *    but not an error if intentional)
 * 2. Circuits WITH breadboards where seatable parts lack a seat property
 *    (these are bugs — parts float in space on the canvas)
 *
 *   node scripts/sweep-unseated.mjs
 *   node scripts/sweep-unseated.mjs --strict   # exit 1 on any unseated
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');
const strict = process.argv.includes('--strict');

const BREADBOARD_KINDS = new Set(['breadboard', 'mini_breadboard', 'half_breadboard']);
// Parts that don't need seating:
// - Power symbols (vcc, gnd, vsource, battery)
// - MCU boards (sit alongside the breadboard, not in it)
// - Displays (seven_seg, ssd1306, char_lcd)
const EXEMPT_KINDS = new Set([
    'breadboard', 'mini_breadboard', 'half_breadboard',
    'vcc', 'gnd', 'vsource', 'battery_aa', 'battery_9v',
    'seven_seg', 'seven_seg_hex', 'seven_seg_3', 'ssd1306', 'char_lcd_i2c',
    'arduino_uno', 'arduino_nano', 'arduino_mega',
    'mcu', 'stc15_mcu', 'pi_pico', 'attiny88', 'attiny85', 'atmega168p',
    'ps2',
]);

const files = [];
for (const d of readdirSync(examplesDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(examplesDir, d.name))) {
        if (f.startsWith('circuit') && f.endsWith('.json'))
            files.push(join('examples', d.name, f));
    }
}
files.sort();

let noBreadboard = 0, unseatedCount = 0;
for (const rel of files) {
    const abs = join(root, rel);
    let data;
    try { data = JSON.parse(readFileSync(abs, 'utf8')); }
    catch (e) { console.log(`${rel}: PARSE ERROR — ${e.message}`); continue; }

    const parts = data.parts || [];
    const bbs = parts.filter(p => BREADBOARD_KINDS.has(p.kind));

    if (bbs.length === 0) {
        noBreadboard++;
        continue; // schematic-style: seating not applicable
    }

    // Has breadboard(s) — every seatable part must have a seat
    const unseated = parts.filter(p =>
        !EXEMPT_KINDS.has(p.kind) && !p.seat
    );
    if (unseated.length > 0) {
        console.log(`${rel}:`);
        for (const p of unseated) {
            console.log(`  "${p.id}" (${p.kind}): no seat`);
        }
        unseatedCount += unseated.length;
    }
}

console.log(`\n--- ${noBreadboard} schematic-style (no breadboard), ${unseatedCount} unseated part(s) in ${files.length} circuits ---`);
if (strict && unseatedCount > 0) process.exit(1);
