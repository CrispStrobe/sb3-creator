/**
 * How each gate decides which examples it enrols.
 *
 * One place, so `test/example-gate-enrolment.test.mjs` can compute the coverage
 * map and a metadata change shows up as a coverage diff. Each predicate is a
 * restatement of the filter in the named suite; the comment beside it quotes
 * the line it mirrors, because a restatement that drifts from its original is
 * worse than no map at all.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SB3Creator from '../../src/utils/sb3Creator.js';

/** Facts about one example, computed once and shared by every predicate. */
function factsFor(EXAMPLES, entry) {
    const dir = join(EXAMPLES, entry.id);
    const bw = join(dir, 'program.bw');
    const f = {
        entry,
        hasProgramFile: existsSync(bw),
        circuitFiles: existsSync(dir)
            ? readdirSync(dir).filter(n => /^circuit.*\.json$/.test(n)) : [],
        assertBlock: false,
        blocks: 0,
        emitsDeviceC: false,
        declaresParams: false,
    };
    const exp = join(dir, 'EXPECTED.md');
    if (existsSync(exp)) f.assertBlock = /```assert\n[\s\S]*?```/.test(readFileSync(exp, 'utf8'));
    for (const name of f.circuitFiles) {
        try {
            const data = JSON.parse(readFileSync(join(dir, name), 'utf8'));
            if ((data.parts || []).some(p => Object.keys(p.params || {}).length)) { f.declaresParams = true; break; }
        } catch { /* a malformed circuit is another gate's finding */ }
    }
    if (f.hasProgramFile) {
        const creator = new SB3Creator();
        try {
            const project = creator.parse(readFileSync(bw, 'utf8'));
            for (const t of project.targets || [])
                for (const [, b] of Object.entries(t.blocks || {}))
                    if (b && typeof b === 'object' && !Array.isArray(b) && b.opcode) f.blocks++;
            f.emitsDeviceC = /@bw-begin/.test(creator.generateC());
        } catch { /* a program that will not parse is another gate's finding */ }
    }
    return f;
}

/** Spelled as gallery.test.mjs spells it — ten micro:bit/SPIKE entries never set the flag. */
const deviceOnly = (e) => e.deviceOnly === true || e.authored === 'microbit' || e.authored === 'spike';

export const ENROLMENT = [
    {   gate: 'gallery',
        // `hasProgram = existsSync(bwPath) || !!_indexByDir.get(name)?.files?.program`
        why: 'the program-side compile/round-trip tests, skipped without a program',
        p: (f) => f.hasProgramFile || !!f.entry.files?.program },
    {   gate: 'example-kind-matches-content',
        why: 'every catalog entry, branching on kind',
        p: () => true },
    {   gate: 'index-metadata-matches-disk',
        why: 'every catalog entry',
        p: () => true },
    {   gate: 'retarget-gallery',
        // `e.kind === 'program' && Array.isArray(e.devices) && e.authored !== 'microbit' && e.authored !== 'spike'`
        why: 'devices must equal the retarget dry-run — the gate the kind flip pulled in',
        p: (f) => f.entry.kind === 'program' && Array.isArray(f.entry.devices)
            && f.entry.authored !== 'microbit' && f.entry.authored !== 'spike' },
    {   gate: 'retarget-amplification',
        // same filter as retarget-gallery (a1b6030)
        why: 'per-device retarget amplification',
        p: (f) => f.entry.kind === 'program' && Array.isArray(f.entry.devices)
            && f.entry.authored !== 'microbit' && f.entry.authored !== 'spike' },
    {   gate: 'gen-device-benches',
        // scripts/gen-device-benches.mjs: `if (!e.devices || e.devices.length < 2) continue;`
        // and `if (!(e.kind === 'program' || e.kind === 'full')) continue;`
        why: 'NOT a test — the generator whose skip reads as a successful no-op',
        p: (f) => (f.entry.kind === 'program' || f.entry.kind === 'full')
            && (f.entry.devices || []).length >= 2 },
    {   gate: 'example-corpus-contract',
        // `if (Array.isArray(entry.devices) && entry.files?.circuit)`
        why: 'devices must equal benches plus the authored chip',
        p: (f) => Array.isArray(f.entry.devices) && !!f.entry.files?.circuit },
    {   gate: 'assert-physics',
        why: 'the machine-checkable claims in EXPECTED.md',
        p: (f) => f.assertBlock },
    {   gate: 'debug-micropython',
        // `e.files?.program` whose text matches /DEVICE\s+MICROBIT/i
        why: 'micro:bit debug builds',
        p: (f) => !!f.entry.files?.program && f.hasProgramFile
            && /DEVICE\s+MICROBIT/i.test(readFileSync(join(f.dirFor, 'program.bw'), 'utf8')) },
    {   gate: 'debug-trace-audit',
        // /DEVICE\s+(MICROBIT|PICO)/i over each entry.files.program
        why: 'MicroPython trace instrumentation',
        p: (f) => !!f.entry.files?.program && f.hasProgramFile
            && /DEVICE\s+(MICROBIT|PICO)/i.test(readFileSync(join(f.dirFor, 'program.bw'), 'utf8')) },
    {   gate: 'circuit-params-are-read',
        why: 'every declared circuit param must be one the engine reads',
        p: (f) => f.declaresParams },
    {   gate: 'program-reads-what-it-writes',
        why: 'variable names and dangling reads',
        p: (f) => f.hasProgramFile },
    {   gate: 'vm-and-c-agree-on-arithmetic',
        why: 'arithmetic that means one thing in the VM and another on the device',
        p: (f) => f.emitsDeviceC },
    {   gate: 'documented-tables-are-derived',
        why: 'the four conversion tables re-derived from the emitted program',
        p: (f) => ['02-dimmer', '10-motor-speed', 'arduino-01-read-analog-voltage',
            'arduino-05-switch-case'].includes(f.entry.id) },
    {   gate: 'vm',
        // `galleryIndex.filter(entry => entry.files?.program)`
        why: 'every shipped program must load and start in the real Scratch VM',
        p: (f) => !!f.entry.files?.program },
    {   gate: 'simulator-driver-controls-respond',
        // The gate's outer filter, expressible here: an example with BOTH files
        // whose program declares an INPUT pin. Its INNER filter — is a button or
        // switch on that pin's net — needs the circuit solved, which this map
        // cannot do, so the gate carries its own floors instead (at least 33
        // benches and 67 pins) and says so in its own message.
        why: 'every declared INPUT pin with a control on its net must respond to it',
        p: (f) => !!f.entry.files?.program && !!f.entry.files?.circuit && f.hasProgramFile
            && /^\s*PIN\s+\S+\s*=[^\n]*\bINPUT\b/mi.test(
                readFileSync(join(f.dirFor, 'program.bw'), 'utf8')) },
    {   gate: 'gallery-e2e',
        // MCU_TESTS / PURE_TESTS are hand-listed specs, not a metadata filter
        why: 'hand-picked benches driven pin by pin',
        p: (f) => GALLERY_E2E_NAMED.has(f.entry.id) },
];

/**
 * The examples gallery-e2e names in MCU_TESTS / PURE_TESTS, read out of the
 * suite rather than copied — a hand-copied list is the drift this file exists
 * to prevent. Both objects are scanned; BLOCKED sits between them in the source
 * and its entries are deliberately NOT counted, being examples the suite names
 * in order to say it cannot run them.
 */
const GALLERY_E2E_NAMED = (() => {
    try {
        const src = readFileSync(new URL('../../test/gallery-e2e.test.mjs', import.meta.url), 'utf8');
        const names = new Set();
        for (const decl of ['const MCU_TESTS = {', 'const PURE_TESTS = {']) {
            const start = src.indexOf(decl);
            if (start < 0) continue;
            const end = src.indexOf('\n};', start);
            const body = src.slice(start, end < 0 ? undefined : end);
            for (const m of body.matchAll(/^\s{4}'([\w-]+)':\s*\{/gm)) names.add(m[1]);
        }
        return names;
    } catch { return new Set(); }
})();

/**
 * Test files that read examples/index.json but do not select examples by
 * metadata — so their coverage cannot move when a field changes.
 */
export const NOT_PER_EXAMPLE = new Map([
    ['curriculum', 'validates curriculum station ids against the catalog; enrols no example'],
    ['circuit-json-roundtrip', 'iterates circuit FILES found on disk; the index is only a directory lookup'],
    ['example-gate-enrolment', 'this map itself'],
]);

/** Suites that read every example unconditionally, with no metadata filter. */
export const CORPUS_WIDE = new Set([]);

export function buildEnrolment(EXAMPLES) {
    const index = JSON.parse(readFileSync(join(EXAMPLES, 'index.json'), 'utf8'));
    const map = {}, counts = Object.fromEntries(ENROLMENT.map(e => [e.gate, 0]));
    for (const entry of index) {
        const f = factsFor(EXAMPLES, entry);
        f.dirFor = join(EXAMPLES, entry.id);
        const gates = [];
        for (const { gate, p } of ENROLMENT) {
            let hit = false;
            try { hit = !!p(f); } catch { hit = false; }
            if (hit) { gates.push(gate); counts[gate]++; }
        }
        map[entry.id] = gates.sort();
    }
    return { map, counts };
}
