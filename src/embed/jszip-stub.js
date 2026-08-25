// JSZip stub for the EMBEDDED transpiler bundle.
//
// SB3Creator imports JSZip only for reading and writing .sb3 archives
// (the zip container). The embedded transpiler exposes the
// pseudocode -> C and retarget paths, which never touch a zip. Aliasing
// jszip to this stub keeps the bundle free of node/browser dependencies
// so it runs in a bare JS engine (QuickJS/boa inside a Rust binary). If a
// zip path is ever reached in that host it throws clearly instead of
// silently misbehaving.
export default class JSZip {
    constructor () {
        throw new Error('JSZip is unavailable in the embedded transpiler bundle '
            + '(pseudocode->C and retarget only; .sb3 archive I/O is not embedded)');
    }

    static loadAsync () {
        return Promise.reject(new Error('JSZip.loadAsync unavailable in the embedded transpiler bundle'));
    }
}
