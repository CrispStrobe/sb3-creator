#!/usr/bin/env node
// Regenerate the arduino-import corpus recordings that
// test/arduino-import.test.mjs asserts against.
//
// The corpus is gitignored local state (corpus/arduino-examples is the CC0
// clone, corpus/arduino-imported the recordings), so these fixtures cannot
// ride a push — every machine that runs the sibling suite regenerates them
// with this script after an importer behaviour change is adjudicated.
// Until now they had no generator at all: they were recorded by hand once,
// which is how 21 of them went stale together when the importer learned to
// convert setup()/loop() instead of dropping them.
//
//   node scripts/update-arduino-import-fixtures.mjs           # rewrite stale recordings
//   node scripts/update-arduino-import-fixtures.mjs --check   # report drift, exit 1 if any
//   node scripts/update-arduino-import-fixtures.mjs --all     # also record cases that
//                                                             # have no fixture yet
//
// By default only EXISTING .warnings.json cases are updated — the recorded
// subset is a deliberate choice, not an accident of coverage.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cToPseudocode from '../src/utils/cToPseudocode.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_SRC = join(HERE, '..', 'corpus', 'arduino-examples', 'examples');
const CORPUS_OUT = join(HERE, '..', 'corpus', 'arduino-imported');
const ARDUINO_PREAMBLE = '#include <Arduino.h>\n#define LED_BUILTIN 13\n';

// Keep in lockstep with test/arduino-import.test.mjs.
const CATEGORIES = [
    '01.Basics', '02.Digital', '03.Analog',
    '04.Communication', '05.Control', '06.Sensors', '07.Display',
    '08.Strings', '09.USB', '10.StarterKit_BasicKit', '11.ArduinoISP',
];

const CHECK = process.argv.includes('--check');
const ALL = process.argv.includes('--all');

if (!existsSync(CORPUS_SRC)) {
    console.error(`no corpus at ${CORPUS_SRC} — clone arduino/arduino-examples there first`);
    process.exit(2);
}

let drift = 0, written = 0, clean = 0, skipped = 0;
for (const cat of CATEGORIES) {
    const dir = join(CORPUS_SRC, cat);
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const ino = join(dir, e.name, e.name + '.ino');
        if (!existsSync(ino)) continue;

        const warnFile = join(CORPUS_OUT, e.name.toLowerCase() + '.warnings.json');
        const bwFile = join(CORPUS_OUT, e.name.toLowerCase() + '.bw');
        if (!existsSync(warnFile) && !ALL) { skipped++; continue; }

        const r = cToPseudocode(ARDUINO_PREAMBLE + readFileSync(ino, 'utf8'));
        const warnJson = JSON.stringify(r.warnings, null, 2) + '\n';
        const bwOut = `# Imported from arduino/arduino-examples (CC0-1.0)\n# Source: ${cat}/${e.name}/${e.name}.ino\n\n${r.pseudocode.trimEnd()}\n`;

        const warnStale = !existsSync(warnFile) || readFileSync(warnFile, 'utf8') !== warnJson;
        const bwStale = !existsSync(bwFile) || readFileSync(bwFile, 'utf8') !== bwOut;
        if (!warnStale && !bwStale) { clean++; continue; }

        drift++;
        if (CHECK) {
            console.log(`DRIFT: ${e.name}${warnStale ? ' [warnings]' : ''}${bwStale ? ' [bw]' : ''}`);
        } else {
            writeFileSync(warnFile, warnJson);
            writeFileSync(bwFile, bwOut);
            written++;
            console.log(`updated: ${e.name}`);
        }
    }
}

console.log(`${clean} clean, ${drift} ${CHECK ? 'drifted' : 'rewritten'}, ${skipped} without fixtures${ALL ? '' : ' (unrecorded, use --all to record)'}`);
process.exit(CHECK && drift ? 1 : 0);
