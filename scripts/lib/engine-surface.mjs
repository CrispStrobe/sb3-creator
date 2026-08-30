/**
 * ONE description of what the app injects into bw-circuit-ui, and one way to
 * inject it.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `setEngine()` is bw-circuit-ui's whole boundary onto bw-board. Three of its
 * keys are required and the rest are OPTIONAL — the library degrades quietly
 * when one is absent, by design, so that an older vendored build still runs.
 * That graceful degradation is exactly what makes a stale injection invisible:
 * a caller that omits `getDevice` does not fail, it silently measures a
 * DIFFERENT CIRCUIT than the one the app builds.
 *
 * It has produced two wrong verdicts already, both of which cost a day:
 *
 *   - a hand-rolled census in bw-board injected `setEngine` without
 *     `getDevice`, so every registered board kind collapsed to a generic
 *     `mcu` whose pin sources are keyed by the NETLIST's spelling. It reported
 *     the disp-bargraph family as broken and blamed seven correct circuit
 *     files (bw-board e35ff99 retracted it);
 *   - the same omission, plus bw-circuit-ui's `engineKindFor` testing for a
 *     `hasDevice` nobody exported (cui fbe7338), hid six `arduino_uno` benches
 *     that declared `terminals: ["gnd2"]` while wiring five pins. With the
 *     collapse fixed, `_syncDeviceGpioDrives` walks the PART's terminal list
 *     and those LEDs go dark (sb3-creator aa87c81).
 *
 * Sixteen call sites across `test/` and `scripts/` each spelled the injection
 * out by hand, and fourteen of them were stale. A seventeenth copy would drift
 * the same way, so there are no copies any more: `ENGINE_SURFACE` below is the
 * list, `injectEngine()` is the only way to apply it, and
 * `test/engine-surface-adoption.test.mjs` refuses a hand-rolled object literal.
 *
 * PROVENANCE OF THE LIST
 * ----------------------
 * Copied from what production actually calls — brickwright-lite
 * `overlay/scratch-gui/src/components/tw-pseudocode/circuit-tab.jsx`, the
 * `setEngine({...})` in `CircuitTab.load()`. Not from bw-circuit-ui's
 * documentation, which describes the three-key minimum and the optional extras
 * separately and would let a reader assemble a surface the app never uses.
 *
 * If lite's call changes, this list changes with it and the numbers in this
 * repo's EXPECTED corpus get re-measured. That is the point: the corpus claims
 * to describe what a learner sees, and a learner sees the app's engine.
 */

import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo root, resolved from this file — never from CWD. */
export const REPO_ROOT = resolve(HERE, '..', '..');

/**
 * Every key the app passes to `setEngine`, in the app's own order.
 *
 * Three are required by bw-circuit-ui (`BoardImpl`, `inferNetlist`,
 * `checkWiring`); the rest are optional there and mandatory HERE, because a
 * gate that measures a circuit the app never builds is not measuring anything.
 *
 * `createSweepWorker` is deliberately ABSENT: it is a `Worker` factory, the app
 * does not pass one either, and without it `SweepPanel` runs the same points
 * chunked on the main thread — identical numbers, one thread.
 */
export const ENGINE_SURFACE = Object.freeze([
    'BoardImpl',
    'inferNetlist',
    'checkWiring',
    'hasDevice',
    'getDevice',
    'extract6502Machine',
    'extractZ80Machine',
    'runDcSweep',
    'runAcSweep',
    'logSpace',
    // Appended 2026-08-30 with lite fce761908: the app now injects the DRC's
    // current authority (fab-parity's lane — rule 8 summed 0 mA without it).
    'getMaxCurrent',
    'PORT_LIMITS',
]);

/**
 * Kinds the app deliberately hides from the designer's terminal authority.
 *
 * `stc_mcu` is the legacy arbitrary-package surface: shipped circuits use P5
 * and package pins that the registry's smaller concrete STC model does not
 * name. Returning that model would make bw-circuit-ui treat its terminal list
 * as authoritative and DISCONNECT those wires. Null selects the generic MCU
 * boundary for this one kind, and every other registered model passes through.
 *
 * Verbatim from lite's circuit-tab.jsx (`getCircuitDevice`). Widening this set
 * is a product decision, not a test convenience.
 */
export const DEVICE_PASSTHROUGH_EXEMPT = Object.freeze(['stc_mcu']);

/**
 * The app's `getCircuitDevice`: bw-board's accessor with the exempt kinds
 * answered `null`.
 *
 * @param {(kind: string) => any} getDevice bw-board's registry accessor
 * @returns {(kind: string) => any}
 */
export function circuitGetDevice (getDevice) {
    if (typeof getDevice !== 'function') {
        throw new TypeError('circuitGetDevice: bw-board getDevice is required');
    }
    const exempt = new Set(DEVICE_PASSTHROUGH_EXEMPT);
    return (kind) => (exempt.has(kind) ? null : getDevice(kind));
}

/**
 * Build the injection object from a bw-board module namespace.
 *
 * Throws when a key is missing rather than passing `undefined` through: an
 * absent optional key is how every one of the defects above stayed silent, and
 * the caller here is a gate, not a browser that must keep rendering.
 *
 * @param {Record<string, any>} eng bw-board's `src/index.js` namespace, plus
 *   `extract6502Machine` / `extractZ80Machine` if they are not on it.
 * @returns {Record<string, any>} exactly the ENGINE_SURFACE keys
 */
export function engineSurfaceFrom (eng) {
    const surface = {};
    const missing = [];
    for (const key of ENGINE_SURFACE) {
        const value = key === 'getDevice'
            ? (typeof eng.getDevice === 'function' ? circuitGetDevice(eng.getDevice) : undefined)
            : eng[key];
        if (typeof value !== 'function') { missing.push(key); continue; }
        surface[key] = value;
    }
    if (missing.length) {
        throw new Error(
            `engineSurfaceFrom: bw-board is missing ${missing.join(', ')}. ` +
            'The app injects all of ENGINE_SURFACE; a gate that injects less measures ' +
            'a circuit production never builds. If bw-board genuinely dropped a key, ' +
            'change ENGINE_SURFACE and re-measure the corpus — do not omit it here.');
    }
    return surface;
}

const ENV_VAR = { 'bw-board': 'BW_BOARD', 'bw-circuit-ui': 'BW_CIRCUIT_UI' };
const MARKER = { 'bw-board': 'src/board.js', 'bw-circuit-ui': 'src/engine.js' };

/**
 * Locate a sibling checkout the same way `test/helpers/siblings.mjs` does:
 * an explicit env pointer WINS ABSOLUTELY (no fallback behind it — a fallback
 * made a mutation proof lie), otherwise `<repo>/../<name>`.
 *
 * @param {string} name 'bw-board' | 'bw-circuit-ui'
 * @returns {string|null} absolute path
 */
export function locateSibling (name) {
    const fromEnv = process.env[ENV_VAR[name]];
    const candidates = fromEnv ? [fromEnv] : [join(REPO_ROOT, '..', name)];
    for (const c of candidates) if (existsSync(join(c, MARKER[name]))) return c;
    return null;
}

const asURL = (p) => pathToFileURL(p.endsWith('/') ? p : p + '/');

/**
 * Load both siblings, register every device model, and inject the app's
 * surface into bw-circuit-ui.
 *
 * This is the ONLY supported way to call `setEngine` from this repo.
 *
 * @param {{board?: string, cui?: string}} [paths] override the located siblings
 * @returns {Promise<{surface, board, cui, Circuit, resetIds, setEngine, paths}>}
 */
export async function injectEngine (paths = {}) {
    const boardPath = paths.board || locateSibling('bw-board');
    const cuiPath = paths.cui || locateSibling('bw-circuit-ui');
    if (!boardPath) throw new Error('injectEngine: bw-board not found (set BW_BOARD)');
    if (!cuiPath) throw new Error('injectEngine: bw-circuit-ui not found (set BW_CIRCUIT_UI)');

    const boardURL = asURL(boardPath);
    const cuiURL = asURL(cuiPath);

    const board = await import(new URL('src/index.js', boardURL).href);
    // The registry has no self-registration: seventeen `register*` exports and,
    // until 2026-08-10, zero callers outside the engine's own tests. Register at
    // injection, exactly where the app does it — a per-file `register*` loop
    // (what six generators used to do) registers a DIFFERENT subset per script.
    if (typeof board.registerAllDevices === 'function') board.registerAllDevices();

    // The extractors are separate modules in bw-board and separate imports in
    // the app; older checkouts may not have them, and that is a hard failure
    // here for the same reason a missing optional key is.
    const m6502 = await import(new URL('src/m6502-extract.js', boardURL).href);
    const z80 = await import(new URL('src/z80-extract.js', boardURL).href);

    const surface = engineSurfaceFrom({
        ...board,
        extract6502Machine: m6502.extract6502Machine,
        extractZ80Machine: z80.extractZ80Machine,
    });

    const cui = await import(new URL('src/engine.js', cuiURL).href);
    cui.setEngine(surface);
    // The DRC reads its extractors from a separate module-level slot, not from
    // the engine object — the app wires both (circuit-tab.jsx line 15).
    try {
        const drc = await import(new URL('src/model/drc.js', cuiURL).href);
        if (typeof drc.setExtractors === 'function') {
            drc.setExtractors({
                extract6502Machine: surface.extract6502Machine,
                extractZ80Machine: surface.extractZ80Machine,
            });
        }
    } catch { /* an older cui has no drc extractor slot; the engine object covers it */ }

    const circuit = await import(new URL('src/model/circuit.js', cuiURL).href);

    return {
        surface,
        board,
        cui,
        setEngine: cui.setEngine,
        Circuit: circuit.Circuit,
        resetIds: circuit.resetIds,
        paths: { 'bw-board': boardPath, 'bw-circuit-ui': cuiPath },
        boardURL,
        cuiURL,
    };
}

/**
 * Register every part sidecar bw-circuit-ui ships, the way the app does.
 *
 * Authored circuits omit `terminals` on sidecar-known kinds, so a load without
 * the sidecars resolves a different terminal list than the browser does.
 * Separate from `injectEngine` because the app loads them separately too, and
 * NOT fatally: a designer with no sidecars is degraded and usable.
 *
 * @param {string} cuiPath
 * @returns {Promise<number>} how many sidecars registered
 */
export async function registerSidecars (cuiPath) {
    const { readdirSync, readFileSync } = await import('node:fs');
    const cuiURL = asURL(cuiPath);
    const { registerSidecar } = await import(new URL('src/model/parts-registry.js', cuiURL).href);
    const dir = join(cuiPath, 'src', 'parts-data');
    if (!existsSync(dir)) return 0;
    let n = 0;
    for (const file of readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
            const sidecar = JSON.parse(readFileSync(join(dir, file), 'utf8'));
            if (sidecar.kind) { registerSidecar(sidecar); n++; }
        } catch { /* a malformed sidecar is bw-circuit-ui's gate, not ours */ }
    }
    return n;
}
