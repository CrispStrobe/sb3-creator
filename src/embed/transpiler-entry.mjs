// The EMBEDDED transpiler entry — the surface a non-JS host (a Rust CLI
// embedding QuickJS or boa, or a Wasm host) calls to reach the ONE JS
// transpiler, SB3Creator, in-process.
//
// Why this exists: Brickwright has exactly one transpiler and it is JS
// (SB3Creator). The browser and the node `bw` CLI run it directly; a
// self-contained Rust binary runs it by embedding a JS engine and evaling
// the bundle built from THIS entry (see scripts/bundle-embed.mjs). No node
// subprocess, no network, no Python — the same transpiler the browser
// runs, so a headless client never drifts from the app.
//
// The functions are hung on globalThis (not ES exports) because a bare
// engine evals the bundle as a script and then calls globals by name; it
// has no module loader. Every function returns plain JSON-friendly values
// and throws Error on refusal, so the host marshals results and errors
// across the language boundary with no JS objects escaping.
//
// C -> binary (the flash image) is NOT here: that is compilation
// (gcc/sdcc/cc65), not transpilation, and stays a toolchain/service step.

import SB3Creator from '../utils/sb3Creator.js';
import cowgolToPseudocode from '../utils/cowgolToPseudocode.js';
import {cowgolTargets} from '../utils/cowgol.js';

/** The list of retargetable device ids (the RETARGET_POOLS keys). */
globalThis.bwDevices = function bwDevices () {
    return Object.keys(SB3Creator.RETARGET_POOLS);
};

/**
 * Retarget a program's hardware declarations to another device.
 * @param {string} pseudocode
 * @param {string} device  a bwDevices() id
 * @returns {string} the retargeted pseudocode
 * @throws if the target refuses (too few pins, etc.)
 */
globalThis.bwRetarget = function bwRetarget (pseudocode, device) {
    const r = SB3Creator.retargetPseudocode(pseudocode, device);
    if (!r.ok) throw new Error('retarget to ' + device + ' refused: ' + (r.reasons || []).join('; '));
    return r.pseudocode;
};

/**
 * Transpile pseudocode to C for the device declared in the source (via a
 * DEVICE header), optionally retargeting first when `device` is given.
 * Uses the proven generateC form (debug:true) — the same one `bw compile`
 * and the browser use; without it STM32 emits the wrong (pico) timebase.
 * @param {string} pseudocode
 * @param {string} [device]  retarget to this id first (optional)
 * @returns {string} the generated C source
 */
globalThis.bwTranspileC = function bwTranspileC (pseudocode, device) {
    let code = pseudocode;
    if (device) code = globalThis.bwRetarget(code, device);
    const c = new SB3Creator();
    c.parse(code);
    return c.generateC(undefined, { debug: true });
};

/** Native generator profiles; compiler installation is discovered separately. */
globalThis.bwCowgolTargets = cowgolTargets;

/**
 * The same bounded Cowgol bridge exposed by the editor and CLI.
 * Omit options.target for reversible host source, or select an exact native
 * profile from bwCowgolTargets(). A target never implicitly retargets hardware;
 * pass device separately to request the existing explicit retarget operation.
 * Refusal throws before any source result crosses the host boundary.
 */
globalThis.bwTranspileCowgol = function bwTranspileCowgol (pseudocode, device, options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        Object.keys(options).some(key => key !== 'target' && key !== 'profile')) {
        throw new Error('Cowgol options must contain only target and profile');
    }
    for (const key of ['target', 'profile']) if (Object.hasOwn(options, key) &&
        (typeof options[key] !== 'string' || !options[key])) {
        throw new Error('Cowgol ' + key + ' must be a nonempty string');
    }
    const c = new SB3Creator();
    const native = Object.hasOwn(options, 'target');
    const checkWarnings = warnings => {
        if (native && warnings?.length) throw new Error('Native Cowgol source has parser warnings: ' + warnings.join('; '));
    };
    c.parse(pseudocode);
    checkWarnings(c.warnings);
    if (device) {
        const retargeted = SB3Creator.retargetPseudocode(pseudocode, device);
        if (!retargeted.ok) throw new Error('retarget to ' + device + ' refused: ' + (retargeted.reasons || []).join('; '));
        checkWarnings(retargeted.warnings);
        c.parse(retargeted.pseudocode);
        checkWarnings(c.warnings);
    }
    const result = c.generateCowgol(undefined, options);
    if (!result.ok) throw new Error('Cowgol refused: ' + result.reasons.join('; '));
    result.warnings = [...(c.warnings || []), ...result.warnings];
    return result;
};

globalThis.bwReadCowgol = function bwReadCowgol (source) {
    const result = cowgolToPseudocode(source);
    if (!result.ok) throw new Error('Cowgol read refused: ' + result.reasons.join('; '));
    return result;
};

// A marker the bundle test (and a host, on load) can read to confirm the
// embedded surface wired up, without calling into the transpiler.
globalThis.bwEmbedReady = true;
