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

// A marker the bundle test (and a host, on load) can read to confirm the
// embedded surface wired up, without calling into the transpiler.
globalThis.bwEmbedReady = true;
