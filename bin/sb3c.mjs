#!/usr/bin/env node
// sb3c — compile a pseudocode file into a Scratch 3.0 .sb3 project on the command line.
//
//   sb3c <input.txt> [output.sb3]
//   sb3c --check <input.txt>     # parse + integrity check only, no file written
import fs from 'fs';
import SB3Creator from '../src/utils/sb3Creator.js';

const args = process.argv.slice(2);
const checkOnly = args[0] === '--check';
const positional = args.filter((a) => !a.startsWith('--'));
const input = positional[0];
const output = positional[1] || (input ? input.replace(/\.[^.]+$/, '') + '.sb3' : null);

if (!input) {
    console.error('usage: sb3c <input.txt> [output.sb3]');
    console.error('       sb3c --check <input.txt>');
    process.exit(2);
}

let code;
try {
    code = fs.readFileSync(input, 'utf8');
} catch {
    console.error(`sb3c: cannot read ${input}`);
    process.exit(2);
}

const creator = new SB3Creator();
try {
    creator.parse(code);
} catch (e) {
    console.error(`sb3c: parse error: ${e.message}`);
    process.exit(1);
}

const validation = creator.validate();
for (const w of validation.parsingWarnings) console.error(`warning: ${w}`);

const issues = creator.checkIntegrity();
for (const i of issues) console.error(`integrity: ${i}`);

if (!validation.isValid || issues.length) {
    validation.errors.forEach((e) => console.error(`error: ${e}`));
    process.exit(1);
}

console.error(
    `parsed ${validation.targets} target(s), ${validation.scriptsFound} script(s), ${validation.variablesCreated} variable(s)`
);

if (checkOnly) {
    console.log('ok');
    process.exit(0);
}

const blob = await creator.generateSB3();
const buf = Buffer.from(await blob.arrayBuffer());
fs.writeFileSync(output, buf);
console.log(`wrote ${output} (${buf.length} bytes)`);
