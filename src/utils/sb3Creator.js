import JSZip from 'jszip';
// Auto-generated hardware-extension registry (scripts/gen-runtime-registry.mjs). Covers all
// the LEGO/hardware extensions declaratively so the pluggable driver "works for all of them".
import { RUNTIME_EXTENSIONS as GENERATED_RUNTIME, RUNTIME_EXTENSION_URLS as GENERATED_URLS } from './runtimeRegistry.generated.js';
// Scratch-runtime shim table: maps graphical blocks (motion/looks/sensing/…) to
// reversible `scratch.<method>(...)` calls so Python/JS round-trips preserve the project.
import { OP_TO_SCRATCH, OP_TO_ARRAYS, spritePrefix, sanitizeIdent } from './scratchRuntime.js';
// The host C target's runtime and shim naming (see cHostRuntime.js for why the
// shim is generated from OP_TO_SCRATCH rather than written out).
import { cHostRuntime, cShimName, C_HOST_INCLUDES } from './cHostRuntime.js';
// The LED cube's shift directions. Shared with the C reader so the two cannot
// drift — they already did once, and the round trip lost the block.
import { CUBE_DIRECTIONS, cubeDirectionIndex } from './cubeDirections.js';


// Structured error classes
class SB3Error extends Error {
    constructor(message, type = 'SB3Error') {
        super(message);
        this.name = type;
        this.isSB3Error = true;
    }
}

class ParseError extends SB3Error {
    constructor(message, line = null) {
        super(message, 'ParseError');
        this.line = line;
    }
}

class ValidationError extends SB3Error {
    constructor(message) {
        super(message, 'ValidationError');
    }
}

class AssetError extends SB3Error {
    constructor(message) {
        super(message, 'AssetError');
    }
}

/**
 * SB3 Creator: compiles the pseudocode language into a Scratch 3.0 project.
 */
class SB3Creator {
    constructor() {
        this.reset();
    }

    reset() {
        this.project = {
            targets: [],
            monitors: [],
            extensions: [],
            meta: { semver: "3.0.0", vm: "4.6.0", agent: "SB3 Creator/1.0.0" }
        };
        this.usedIds = new Set();
        this.variables = new Map(); // scope:name -> {id, name, isGlobal}
        this.lists = new Map(); // scope:name -> {id, name, isGlobal}
        this.broadcasts = new Map(); // name -> id
        this.assets = new Map(); // assetId -> {type, data, metadata}
        // Explicit scope declarations (GLOBAL / LOCAL / LIST) override the magic-name fallback.
        this.declaredGlobals = new Set(); // var names forced global
        this.declaredLocals = new Set(); // `${scope}:${name}` forced local
        this.declaredGlobalLists = new Set(); // list names forced global
        this.declaredLocalLists = new Set(); // `${scope}:${name}` forced local
        this.spriteColorIndex = 0;
        this.spriteColors = new Map(); // sprite name -> costume colour (for extra costumes)
        this.procedures = []; // registered custom blocks (for call-site matching)
        this.currentProcArgs = null; // param name -> {type} while parsing a definition body
        this.targetNames = new Set(['Stage']); // all sprite/stage names (for sensing_of)
        this.generatedSB3 = null;
        this.errors = [];
        this.warnings = [];
        this.scriptCount = 0;
        // Comments are the ground truth on the blocks, not the text: a `# comment`
        // line is attached as a Scratch block comment to the block that follows it,
        // so it survives compile → From-blocks (decompile) round-trips.
        this._pendingComment = '';
        this._commentSeq = 0;
    }

    // Use Scratch's character set for IDs
    generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#%()*+,-./:;=?@[]^_`{|}~';
        let id;
        do {
            id = '';
            for (let i = 0; i < 20; i++) {
                id += chars[Math.floor(Math.random() * chars.length)];
            }
        } while (this.usedIds.has(id));
        this.usedIds.add(id);
        return id;
    }

    // Filesystem-safe id for asset filenames (mirrors Scratch's md5-hex names).
    // The full block-id alphabet contains '/' and '.', which JSZip path-normalizes
    // and would desync a costume's md5ext from its stored zip entry.
    generateAssetId() {
        const hex = '0123456789abcdef';
        let id;
        do {
            id = '';
            for (let i = 0; i < 32; i++) id += hex[Math.floor(Math.random() * 16)];
        } while (this.usedIds.has(id));
        this.usedIds.add(id);
        return id;
    }

    // Push a warning tagged with its 1-based source line number.
    warn(lineIndex, message) {
        this.warnings.push(`Line ${lineIndex + 1}: ${message}`);
    }

    // Strip a trailing `// comment` that is outside any double-quoted string.
    stripComment(line) {
        let inStr = false;
        for (let i = 0; i < line.length - 1; i++) {
            const c = line[i];
            if (c === '"') inStr = !inStr;
            else if (!inStr && c === '/' && line[i + 1] === '/') return line.slice(0, i);
        }
        return line;
    }

    // Reconcile project.extensions with the blocks that are actually used. Scratch
    // opcodes are `<category>_<name>`; any non-core category is an extension id. This
    // both AUTO-ADDS extensions the code needs (compile direction) and parses which
    // extensions are genuinely used in the blocks (read direction). Custom gallery
    // extensions also get an extensionURL so the VM can load them.
    // Source of truth for URLs: github.com/CrispStrobe/extensions (see reference/extensions/).
    syncExtensions(project = this.project) {
        const CORE = SB3Creator.CORE_CATEGORIES;
        const used = new Set();
        for (const t of project.targets || []) {
            for (const b of Object.values(t.blocks || {})) {
                const op = b.opcode || '';
                const i = op.indexOf('_');
                if (i <= 0) continue;
                const prefix = op.slice(0, i);
                if (!CORE.has(prefix)) used.add(prefix);
            }
        }
        project.extensions = [...used];
        const urls = { ...(project.extensionURLs || {}) };
        for (const id of used) if (SB3Creator.EXTENSION_URLS[id]) urls[id] = SB3Creator.EXTENSION_URLS[id];
        if (Object.keys(urls).length) project.extensionURLs = urls;
        return project.extensions;
    }

    // ---- Pluggable runtime/hardware extension convention (see RUNTIME_EXTENSIONS) ----

    // Look up an opcode in the runtime registry -> { runtime, method, kind, args, neutral }.
    runtimeOp(opcode) {
        const i = opcode.indexOf('_');
        if (i <= 0) return null;
        const reg = SB3Creator.RUNTIME_EXTENSIONS[opcode.slice(0, i)];
        const op = reg && reg.ops[opcode.slice(i + 1)];
        return op ? { runtime: reg.runtime, ...op } : null;
    }

    // Resolve one runtime-op argument: a menu/dropdown shadow -> its field value (quoted);
    // a plain field -> the same; a value input -> the language value via `valFn(key)`.
    runtimeArg(b, key, blocks, valFn) {
        const input = b.inputs[key];
        // Blocks whose arguments are fields rather than inputs (the stc12 pin blocks are the
        // first) would otherwise resolve to a neutral value and lose the pin name entirely.
        if (!input && b.fields && b.fields[key]) return this.pyStr(String(b.fields[key][0]));
        if (!input) return valFn(key);
        const inner = input[1];
        if (!Array.isArray(inner)) {
            const shadow = blocks[inner];
            if (shadow && shadow.shadow && shadow.fields) {
                const fk = Object.keys(shadow.fields)[0];
                if (fk) return JSON.stringify(String(shadow.fields[fk][0]));
            }
        }
        return valFn(key);
    }

    // Build `_<runtime>.<method>(args)` for a runtime-extension block, or null. Records the
    // runtime as used so its driver shim gets emitted.
    runtimeCall(b, blocks, valFn) {
        const op = this.runtimeOp(b.opcode);
        if (!op) return null;
        if (!this._runtimesUsed) this._runtimesUsed = new Set();
        this._runtimesUsed.add(b.opcode.slice(0, b.opcode.indexOf('_')));
        const args = (op.args || []).map(k => this.runtimeArg(b, k, blocks, valFn));
        const call = `_${op.runtime}.${op.method}(${args.join(', ')})`;
        return { kind: op.kind, call: this._async ? `await ${call}` : call };
    }

    // Emit a driver for a runtime extension. The program is driver-agnostic; this is the
    // single swap point. `mode` selects the backend:
    //   'shim'     — neutral no-op stub (default): runs anywhere, drives nothing.
    //   'remote'   — forwards each call to a Brickwright bridge over WebSocket
    //                (github.com/CrispStrobe/brickwright-bridges, e.g. universal_lego_bridge.py,
    //                normalized JSON {"command","args"} → device binary).
    //   'ondevice' — for on-brick code (ev3dev/pybricks); the per-hardware transpilers
    //                (github.com/CrispStrobe/extensions, ev3dev_py_transpile.js → real ev3dev2)
    //                are the source of truth — emit a header pointing there over the neutral base.
    // `lang` is 'py' or 'js'. See reference/runtime-drivers.md.
    runtimeShim(extId, lang, mode = 'shim') {
        const reg = SB3Creator.RUNTIME_EXTENSIONS[extId];
        if (!reg) return [];
        const rt = reg.runtime;
        const methods = new Map();
        for (const op of Object.values(reg.ops)) if (!methods.has(op.method)) methods.set(op.method, op);
        const cls = rt.charAt(0).toUpperCase() + rt.slice(1);
        // The simulated-board driver. Only the stc12 runtime has the pin table needed to
        // speak boundary A, so other runtimes fall back to the neutral stub.
        if (mode === 'simulator' && extId === 'stc12' && this._driverPins) {
            return this.stc12SimulatorDriver(lang, this._driverPins);
        }
        // The circuit extension talks directly to the board (boundary B).
        // Meter reporters sample at display rate (~60 Hz), not per edge.
        if (mode === 'simulator' && extId === 'circuit') {
            return this.circuitSimulatorDriver(lang);
        }
        // Device convenience blocks: read state from board.getDeviceState().
        if (mode === 'simulator' && extId === 'devices') {
            return this.devicesSimulatorDriver(lang);
        }
        // LED cube: a frame buffer that the board's led_cube can read if attached.
        if (mode === 'simulator' && extId === 'ledcube') {
            return this.ledcubeSimulatorDriver(lang);
        }
        const banner = {
            shim: 'neutral stub — drives nothing; implement to drive real hardware',
            simulator: 'simulated board — no board attached for this runtime, so neutral',
            remote: `forwards to a Brickwright bridge (brickwright-bridges) over WebSocket`,
            ondevice: `on-brick target — see the per-hardware transpiler (extensions/CrispStrobe) for real ev3dev/pybricks code`
        }[mode] || 'neutral stub';
        if (lang === 'py') {
            const lines = [`# _${rt} driver — ${banner}`];
            if (mode === 'remote') {
                lines.push('# pip install websockets; run a bridge from github.com/CrispStrobe/brickwright-bridges');
                lines.push('import json');
                lines.push(`class _${cls}Driver:`);
                lines.push('    def __init__(self, url="ws://localhost:8080"): self._url = url; self._ws = None');
                lines.push('    def _send(self, command, args):');
                lines.push(`        payload = json.dumps({"ext": "${rt}", "command": command, "args": args})`);
                lines.push('        # send `payload` to the bridge (async websockets); the bridge maps it to the');
                lines.push('        # device per hub — see brickwright-bridges/universal_lego_bridge.py from_normalized.');
            } else {
                lines.push(`class _${cls}Driver:`);
            }
            const df = this._async ? 'async def' : 'def';   // async so `await _boost.x()` works
            for (const [method, op] of methods) {
                if (mode === 'remote' && op.kind === 'command') { lines.push(`    ${df} ${method}(self, *a): self._send("${method}", list(a))`); continue; }
                let neutral = op.neutral || '0';
                if (neutral === 'NaN') neutral = 'float("nan")';  // Python has no bare NaN
                const ret = op.kind === 'command' ? 'pass' : op.kind === 'boolean' ? 'return False' : `return ${neutral}`;
                lines.push(`    ${df} ${method}(self, *a): ${ret}`);
            }
            lines.push('    def on(self, event, handler): pass  # register an event-hat handler');
            lines.push(`_${rt} = _${cls}Driver()`);
            return lines;
        }
        const entries = [...methods].map(([method, op]) => {
            if (mode === 'remote' && op.kind === 'command') return `${method}: (...a) => _${rt}_send("${method}", a)`;
            const ret = op.kind === 'command' ? '() => {}' : op.kind === 'boolean' ? '() => false' : `() => ${op.neutral || '0'}`;
            return `${method}: ${ret}`;
        });
        entries.push('on: (event, handler) => {}');   // register an event-hat handler
        const out = [`// _${rt} driver — ${banner}`];
        if (mode === 'remote') {
            // Real WebSocket transport to a Brickwright bridge. The bridge maps
            // {ext, command, args} to the device (per hub, e.g. universal_lego_bridge.py
            // from_normalized). Point the URL at your running bridge (8080 / 20110).
            out.push(`const _${rt}_ws = (typeof WebSocket !== 'undefined') ? new WebSocket("ws://localhost:8080") : null;`);
            out.push(`const _${rt}_send = (command, args) => { if (_${rt}_ws && _${rt}_ws.readyState === 1) _${rt}_ws.send(JSON.stringify({ ext: "${rt}", command, args })); };`);
        }
        out.push(`const _${rt} = { ${entries.join(', ')} };`);
        return out;
    }

    // The `simulator` driver for the stc12 runtime: turns the emitted program into the MCU
    // side of **boundary A** (see reference/simulation-contract.md), talking to a board layer.
    //
    // The program says `turn on led1`; the board needs `setPin("P1.0", mode, driveHigh)`. Only
    // the project knows that led1 is P1.0, is push-pull, and is wired ACTIVE LOW — so the pin
    // table is emitted as data beside the driver. That inversion (`on` -> a 0 on an active-low
    // pin) is the whole reason the board can then *show* why the naive wiring stays dark.
    //
    // The host supplies `bwBoard`; with none attached the driver stays neutral, so the program
    // still runs standalone.
    stc12SimulatorDriver(lang, pins) {
        const table = {};
        for (const p of pins) {
            table[p.name] = { pin: `P${p.port}.${p.bit}`, dir: p.direction, low: !!p.activeLow };
        }
        const json = JSON.stringify(table);
        // `set high`/`set low` are levels; `turn on`/`off` are states and respect the polarity.
        const drive = 'const _drv = (p, st) => (st === "high" ? true : st === "low" ? false : ((st === "on") !== p.low));';
        const mode = 'const _mod = (p) => (p.dir === "output" ? "pushpull" : p.dir === "analog" ? "input" : "quasi");';
        // Boundary A is (pins, TIME). Driving pins without advancing the clock leaves the
        // board frozen: the 20 ms brightness integrator never samples, RC never charges, and
        // the buzzer has no edges to measure a period from. So a `wait` must move the clock —
        // which means overriding the neutral `scratch.wait` the stage shim installs.
        if (lang === 'py') {
            return [
                '# _stc12 driver — simulated board (boundary A). Supply `bw_board` to attach one.',
                'import json',
                `_stc12_pins = json.loads(${this.pyStr(json)})`,
                'class _Stc12Simulated:',
                '    def _p(self, name): return _stc12_pins.get(name)',
                '    def _mode(self, p): return "pushpull" if p["dir"] == "output" else ("input" if p["dir"] == "analog" else "quasi")',
                '    def _drive(self, p, st): return True if st == "high" else False if st == "low" else ((st == "on") != p["low"])',
                '    def setPin(self, name, state):',
                '        p = self._p(name)',
                '        if p and _board(): _board().setPin(p["pin"], self._mode(p), self._drive(p, state))',
                '    def writePin(self, name, v):',
                '        p = self._p(name)',
                '        if p and _board(): _board().setPin(p["pin"], self._mode(p), bool(int(v)))',
                '    def togglePin(self, name):',
                '        p = self._p(name)',
                '        if p and _board(): _board().setPin(p["pin"], self._mode(p), not _board().readPin(p["pin"]))',
                '    def readPin(self, name):',
                '        p = self._p(name)',
                '        if not p or not _board(): return 0',
                '        # An ANALOG pin reads volts from the board; the MCU scales to counts.',
                '        if p["dir"] == "analog": return int(_board().readAnalog(p["pin"]) / 5.0 * 1023)',
                '        return (not _board().readPin(p["pin"])) if p["low"] else _board().readPin(p["pin"])',
                '    def setPwm(self, name, value):',
                '        p = self._p(name)',
                '        if p and _board(): _board().setPwm(p["pin"], int(value))',
                '    def setTone(self, name, value):',
                '        p = self._p(name)',
                '        if p and _board(): _board().setTone(p["pin"], int(value))',
                '    def setPort(self, name, value): pass  # TODO: whole-port sim',
                '    def readPort(self, name): return 0  # TODO: whole-port sim',
                '    def setPart(self, name, value): pass  # TODO: shift-register sim',
                '    def print(self, value, mode):',
                '        if mode == "text": print(value)',
                '        else: print(int(value))',
                '    def on(self, event, handler): pass',
                'def _board(): return globals().get("bw_board")',
                '_stc12 = _Stc12Simulated()',
                '',
                '# Simulated time. A wait advances the board clock; without this the board is frozen.',
                '_bw_t = [0]',
                'def _bw_wait(secs, *_a):',
                '    _bw_t[0] += int(round(float(secs) * 1e9))',
                '    b = _board()',
                '    if b: b.advanceTo(_bw_t[0])',
                'scratch.wait = _bw_wait'
            ];
        }
        return [
            '// _stc12 driver — simulated board (boundary A). Supply `bwBoard` to attach one.',
            `const _stc12_pins = ${json};`,
            drive, mode,
            'const _board = () => (typeof bwBoard !== "undefined" ? bwBoard : null);',
            'const _stc12 = {',
            '    setPin: (name, st) => { const p = _stc12_pins[name], b = _board();',
            '        if (p && b) b.setPin(p.pin, _mod(p), _drv(p, st)); },',
            '    writePin: (name, v) => { const p = _stc12_pins[name], b = _board();',
            '        if (p && b) b.setPin(p.pin, _mod(p), !!Number(v)); },',
            '    togglePin: (name) => { const p = _stc12_pins[name], b = _board();',
            '        if (p && b) b.setPin(p.pin, _mod(p), !b.readPin(p.pin)); },',
            '    readPin: (name) => { const p = _stc12_pins[name], b = _board();',
            '        if (!p || !b) return 0;',
            '        // An ANALOG pin reads volts from the board; the MCU scales to counts.',
            '        if (p.dir === "analog") return Math.round(b.readAnalog(p.pin) / 5.0 * 1023);',
            '        return p.low ? (b.readPin(p.pin) ? 0 : 1) : b.readPin(p.pin); },',
            '    setPwm: (name, v) => { const p = _stc12_pins[name], b = _board();',
            '        if (p && b && b.setPwm) b.setPwm(p.pin, Number(v)); },',
            '    setTone: (name, v) => { const p = _stc12_pins[name], b = _board();',
            '        if (p && b && b.setTone) b.setTone(p.pin, Number(v)); },',
            '    setPort: (name, v) => {},',  // TODO: whole-port sim
            '    readPort: (name) => 0,',     // TODO: whole-port sim
            '    setPart: (name, v) => {},',   // TODO: shift-register sim
            '    print: (v, mode) => { console.log(mode === "text" ? v : Number(v)); },',
            '    on: (event, handler) => {}',
            '};',
            '',
            '// Simulated time. A wait advances the board clock; without this the board is frozen:',
            '// the brightness integrator never samples and the buzzer has no edges to measure.',
            'let _bw_t = 0n;',
            'scratch.wait = (secs) => { _bw_t += BigInt(Math.round(Number(secs) * 1e9));',
            '    const b = _board(); if (b) b.advanceTo(_bw_t); };',
            'const _bw_now_ns = () => _bw_t;'
        ];
    }

    // The circuit extension driver — boundary B exposed to Python/JS. Meter reporters
    // sample at display rate (~60 Hz), not per edge (measured constraint from bw-board).
    circuitSimulatorDriver(lang) {
        // No-board returns NaN (stopgap) — visibly wrong, not a plausible 0.
        // Greying out unavailable blocks per target is the real fix.
        // Self-contained board lookup: the stc12 driver defines `_board`, but a project can
        // use circuit blocks WITHOUT any stc12 pin block, and then `_board` would not exist
        // (a ReferenceError/NameError on the first reporter). Own helper name, no collision
        // when both drivers are emitted side by side.
        if (lang === 'py') {
            return [
                '# _circuit driver — board instruments (boundary B). Supply `bw_board` to attach one.',
                '# No-board reporters return float("nan") — visibly wrong, not a plausible 0.',
                'def _circuit_board(): return globals().get("bw_board")',
                'class _CircuitSimulated:',
                '    def nodeVoltage(self, net):',
                '        b = _circuit_board()',
                '        return b.nodeVoltage(net) if b else float("nan")',
                '    def branchCurrent(self, part):',
                '        b = _circuit_board()',
                '        return b.branchCurrent(part, "a") if b else float("nan")',
                '    def resistance(self, a, b_net):',
                '        b = _circuit_board()',
                '        return b.resistance(a, b_net) if b else float("nan")',
                '    def ledBrightness(self, part):',
                '        b = _circuit_board()',
                '        return b.ledBrightness(part) if b else float("nan")',
                '    def buzzerTone(self, part):',
                '        b = _circuit_board()',
                '        if not b: return float("nan")',
                '        r = b.buzzerTone(part)',
                '        return r.get("hz", 0) if r.get("on") else 0',
                '    def setControl(self, control, value):',
                '        b = _circuit_board()',
                '        if b: b.setControl(control, float(value))',
                '    def setPower(self, state):',
                '        b = _circuit_board()',
                '        if b: b.setPower(state == "on")',
                '_circuit = _CircuitSimulated()'
            ];
        }
        return [
            '// _circuit driver — board instruments (boundary B). Supply `bwBoard` to attach one.',
            '// No-board reporters return NaN — visibly wrong, not a plausible 0.',
            '// Stopgap: greying out unavailable blocks per target is the real fix.',
            'const _circuit_board = () => (typeof bwBoard !== "undefined" ? bwBoard : null);',
            'const _circuit = {',
            '    nodeVoltage: (net) => { const b = _circuit_board(); return b ? b.nodeVoltage(net) : NaN; },',
            '    branchCurrent: (part) => { const b = _circuit_board(); return b ? b.branchCurrent(part, "a") : NaN; },',
            '    resistance: (a, bNet) => { const b = _circuit_board(); return b ? b.resistance(a, bNet) : NaN; },',
            '    ledBrightness: (part) => { const b = _circuit_board(); return b ? b.ledBrightness(part) : NaN; },',
            '    buzzerTone: (part) => { const b = _circuit_board(); if (!b) return NaN;',
            '        const r = b.buzzerTone(part); return r && r.on ? r.hz : 0; },',
            '    setControl: (control, v) => { const b = _circuit_board(); if (b) b.setControl(control, Number(v)); },',
            '    setPower: (state) => { const b = _circuit_board(); if (b) b.setPower(state === "on"); }',
            '};'
        ];
    }

    // Device convenience blocks simulator driver — reads getDeviceState()
    // from the board for reporters, forwards commands for actuators.
    devicesSimulatorDriver(lang) {
        if (lang === 'py') {
            return [
                '# _devices driver — reads device state from the board via getDeviceState().',
                'class _DevicesSimulated:',
                '    def _state(self, name):',
                '        b = _board()',
                '        return b.getDeviceState(str(name)) if b and hasattr(b, "getDeviceState") else None',
                '    def servoAngle(self, s):',
                '        st = self._state(s)',
                '        return st.get("targetAngle", 0) if st else float("nan")',
                '    def motorSpeed(self, m):',
                '        st = self._state(m)',
                '        return st.get("omega", 0) if st else float("nan")',
                '    def motorDirection(self, m):',
                '        st = self._state(m)',
                '        return st.get("direction", "stopped") if st else "stopped"',
                '    def deviceState(self, d):',
                '        st = self._state(d)',
                '        if not st: return "unknown"',
                '        if "energized" in st: return "on" if st["energized"] else "off"',
                '        return "unknown"',
                '    def temperature(self, s):',
                '        st = self._state(s)',
                '        return st.get("temperature", float("nan")) if st else float("nan")',
                '    def light(self, s):',
                '        st = self._state(s)',
                '        return st.get("lux", float("nan")) if st else float("nan")',
                '    def distance(self, s):',
                '        st = self._state(s)',
                '        return st.get("distance", float("nan")) if st else float("nan")',
                '    def flex(self, s):',
                '        st = self._state(s)',
                '        return st.get("flex", float("nan")) if st else float("nan")',
                '    def force(self, s):',
                '        st = self._state(s)',
                '        return st.get("force", float("nan")) if st else float("nan")',
                '    def irCode(self, s):',
                '        st = self._state(s)',
                '        return st.get("code", float("nan")) if st else float("nan")',
                '    def pressed(self, b): return bool(self._state(b) and self._state(b).get("pressed"))',
                '    def above(self, s, t): v = self._state(s); return float(v.get("value", 0) if v else 0) > float(t)',
                '    def closer(self, s, d): v = self._state(s); return float(v.get("distance", 999) if v else 999) < float(d)',
                '    def motion(self, s): return bool(self._state(s) and self._state(s).get("motion"))',
                '    def tilted(self, s): return bool(self._state(s) and self._state(s).get("tilted"))',
                '    def energised(self, d): return bool(self._state(d) and self._state(d).get("energized"))',
                '    # Commands are forwarded to the board if it supports them.',
                '    def setServo(self, s, a): pass',
                '    def setMotor(self, m, s): pass',
                '    def setDirection(self, m, d): pass',
                '    def setRelay(self, r, s): pass',
                '    def activate(self, d): pass',
                '    def deactivate(self, d): pass',
                '    def showDigit(self, d, n): pass',
                '    def setRgb(self, l, r, g, b): pass',
                '    def lcdPrint(self, d, t): pass',
                '    def lcdCursor(self, d, r, c): pass',
                '    def lcdClear(self, d): pass',
                '    def setPixel(self, m, x, y, b): pass',
                '    def clearMatrix(self, m): pass',
                '    def setNeopixel(self, s, i, r, g, b): pass',
                '    def clearNeopixels(self, s): pass',
                '_devices = _DevicesSimulated()',
            ];
        }
        return [
            '// _devices driver — reads device state from the board via getDeviceState().',
            'const _devices = {',
            '    _state: (name) => { const b = _board(); return b && b.getDeviceState ? b.getDeviceState(String(name)) : null; },',
            '    servoAngle: (s) => { const st = _devices._state(s); return st ? (st.targetAngle ?? 0) : NaN; },',
            '    motorSpeed: (m) => { const st = _devices._state(m); return st ? (st.omega ?? 0) : NaN; },',
            '    motorDirection: (m) => { const st = _devices._state(m); return st ? (st.direction ?? "stopped") : "stopped"; },',
            '    deviceState: (d) => { const st = _devices._state(d); if (!st) return "unknown"; return ("energized" in st) ? (st.energized ? "on" : "off") : "unknown"; },',
            '    temperature: (s) => { const st = _devices._state(s); return st ? (st.temperature ?? NaN) : NaN; },',
            '    light: (s) => { const st = _devices._state(s); return st ? (st.lux ?? NaN) : NaN; },',
            '    distance: (s) => { const st = _devices._state(s); return st ? (st.distance ?? NaN) : NaN; },',
            '    flex: (s) => { const st = _devices._state(s); return st ? (st.flex ?? NaN) : NaN; },',
            '    force: (s) => { const st = _devices._state(s); return st ? (st.force ?? NaN) : NaN; },',
            '    irCode: (s) => { const st = _devices._state(s); return st ? (st.code ?? NaN) : NaN; },',
            '    pressed: (b) => { const st = _devices._state(b); return !!(st && st.pressed); },',
            '    above: (s, t) => { const st = _devices._state(s); return ((st && st.value) ?? 0) > Number(t); },',
            '    closer: (s, d) => { const st = _devices._state(s); return ((st && st.distance) ?? 999) < Number(d); },',
            '    motion: (s) => { const st = _devices._state(s); return !!(st && st.motion); },',
            '    tilted: (s) => { const st = _devices._state(s); return !!(st && st.tilted); },',
            '    energised: (d) => { const st = _devices._state(d); return !!(st && st.energized); },',
            '    // Commands — no-ops in the simulator driver (the board handles them through pins)',
            '    setServo: () => {}, setMotor: () => {}, setDirection: () => {}, setRelay: () => {},',
            '    activate: () => {}, deactivate: () => {}, showDigit: () => {}, setRgb: () => {},',
            '    lcdPrint: () => {}, lcdCursor: () => {}, lcdClear: () => {},',
            '    setPixel: () => {}, clearMatrix: () => {}, setNeopixel: () => {}, clearNeopixels: () => {},',
            '};',
        ];
    }

    // LED cube simulator driver — a frame buffer that records voxel state.
    // The board's led_cube kind reads scan history from it if attached.
    ledcubeSimulatorDriver(lang) {
        const cube = (this.project && this.project.stc && this.project.stc.ledcube) || { size: 4, selects: 8 };
        const S = cube.selects;
        const N = cube.size;
        if (lang === 'py') {
            return [
                `# _ledcube driver — ${N}x${N}x${N} frame buffer.`,
                `_ledcube_frame = [0] * ${S}`,
                'class _LedcubeDriver:',
                `    def _addr(self, x, y, z, c=1): return (z * 2 + (1 if c > 1 else 0), y * ${N} + x)`,
                '    def setVoxel(self, x, y, z, c):',
                '        s, b = self._addr(int(x), int(y), int(z), int(c))',
                `        if 0 <= s < ${S} and 0 <= b < 8:`,
                `            _ledcube_frame[s] = (_ledcube_frame[s] | (1 << b)) if c else (_ledcube_frame[s] & ~(1 << b))`,
                '    def clearVoxel(self, x, y, z): self.setVoxel(int(x), int(y), int(z), 0)',
                `    def fillLayer(self, layer, c):`,
                `        s = int(layer) * 2 + (1 if int(c) > 1 else 0)`,
                `        if 0 <= s < ${S}: _ledcube_frame[s] = 0xFF if c else 0`,
                `    def fillColumn(self, x, y, c):`,
                `        for z in range(${N}): self.setVoxel(int(x), int(y), z, int(c))`,
                `    def fillWall(self, z, c):`,
                `        for y in range(${N}):`,
                `            for x in range(${N}): self.setVoxel(x, y, int(z), int(c))`,
                `    def clear(self):`,
                `        for i in range(${S}): _ledcube_frame[i] = 0`,
                `    def invert(self):`,
                `        for i in range(${S}): _ledcube_frame[i] = _ledcube_frame[i] ^ 0xFF`,
                '    def shift(self, d): pass  # direction shift — needs voxel map',
                `    def hold(self, ms): scratch.wait(float(ms) / 1000)`,
                '    def readVoxel(self, x, y, z):',
                '        s, b = self._addr(int(x), int(y), int(z))',
                `        if 0 <= s < ${S} and 0 <= b < 8: return (_ledcube_frame[s] >> b) & 1`,
                '        return 0',
                '_ledcube = _LedcubeDriver()',
            ];
        }
        return [
            `// _ledcube driver — ${N}x${N}x${N} frame buffer.`,
            `const _ledcube_frame = new Uint8Array(${S});`,
            'const _ledcube = {',
            `    _addr: (x, y, z, c = 1) => [z * 2 + (c > 1 ? 1 : 0), y * ${N} + x],`,
            '    setVoxel: (x, y, z, c) => { const [s, b] = _ledcube._addr(x, y, z, c);',
            `        if (s >= 0 && s < ${S} && b >= 0 && b < 8)`,
            '            _ledcube_frame[s] = c ? (_ledcube_frame[s] | (1 << b)) : (_ledcube_frame[s] & ~(1 << b)); },',
            '    clearVoxel: (x, y, z) => _ledcube.setVoxel(x, y, z, 0),',
            `    fillLayer: (layer, c) => { const s = layer * 2 + (c > 1 ? 1 : 0);`,
            `        if (s >= 0 && s < ${S}) _ledcube_frame[s] = c ? 0xFF : 0; },`,
            `    fillColumn: (x, y, c) => { for (let z = 0; z < ${N}; z++) _ledcube.setVoxel(x, y, z, c); },`,
            `    fillWall: (z, c) => { for (let y = 0; y < ${N}; y++) for (let x = 0; x < ${N}; x++) _ledcube.setVoxel(x, y, z, c); },`,
            `    clear: () => { _ledcube_frame.fill(0); },`,
            `    invert: () => { for (let i = 0; i < ${S}; i++) _ledcube_frame[i] ^= 0xFF; },`,
            '    shift: (d) => {},  // direction shift — needs voxel map',
            '    hold: (ms) => { scratch.wait(ms / 1000); },',
            '    readVoxel: (x, y, z) => { const [s, b] = _ledcube._addr(x, y, z);',
            `        return (s >= 0 && s < ${S} && b >= 0 && b < 8) ? (_ledcube_frame[s] >> b) & 1 : 0; },`,
            '};',
        ];
    }

    // Attach any buffered `# comment` to a freshly created block as a Scratch block
    // comment (stored on the target, referenced by the block) so it survives to decompile.
    attachPendingComment(target, block, blockId) {
        if (!this._pendingComment || !block) return;
        const cid = `cmt_${this._commentSeq++}`;
        if (!target.comments) target.comments = {};
        target.comments[cid] = {
            blockId, x: 0, y: 0, width: 200, height: 100, minimized: false, text: this._pendingComment
        };
        block.comment = cid;
        this._pendingComment = '';
    }

    // Determine if a variable should be global.
    // Explicit GLOBAL/LOCAL declarations win; otherwise fall back to the legacy
    // magic-name list (kept only for backwards compatibility) or Stage scope.
    isGlobalVariable(name, target) {
        if (this.declaredLocals.has(`${target.name}:${name}`)) return false;
        if (this.declaredGlobals.has(name)) return true;
        if (target.isStage) return true;
        const globalVars = ['health', 'score', 'game active', 'speed', 'lives', 'level', 'time', 'points'];
        return globalVars.includes(name.toLowerCase());
    }

    isGlobalList(name, target) {
        if (this.declaredLocalLists.has(`${target.name}:${name}`)) return false;
        if (this.declaredGlobalLists.has(name)) return true;
        return target.isStage;
    }

    getOrCreateVariable(name, target) {
        const isGlobal = this.isGlobalVariable(name, target);
        const scope = isGlobal ? 'Stage' : target.name;
        const key = `${scope}:${name}`;

        if (!this.variables.has(key)) {
            const id = this.generateId();
            this.variables.set(key, { id, name, isGlobal });

            const varTarget = isGlobal ? this.project.targets.find(t => t.isStage) : target;
            if (varTarget) {
                if (!varTarget.variables) varTarget.variables = {};
                varTarget.variables[id] = [name, 0];

                // Create monitor for global variables
                if (isGlobal) {
                    this.createMonitor(id, name, 'data_variable');
                }
            }
        }
        return this.variables.get(key);
    }

    getOrCreateList(name, target) {
        const isGlobal = this.isGlobalList(name, target);
        const scope = isGlobal ? 'Stage' : target.name;
        const key = `${scope}:${name}`;

        if (!this.lists.has(key)) {
            const id = this.generateId();
            this.lists.set(key, { id, name, isGlobal });

            const listTarget = isGlobal ? this.project.targets.find(t => t.isStage) : target;
            if (listTarget) {
                if (!listTarget.lists) listTarget.lists = {};
                listTarget.lists[id] = [name, []];
                this.createMonitor(id, name, 'data_listcontents');
            }
        }
        return this.lists.get(key);
    }

    // Does a variable already exist in scope? Used to disambiguate reporter phrases
    // (e.g. `size`) from user variables of the same name.
    variableExists(name, target) {
        return this.variables.has(`Stage:${name}`) || this.variables.has(`${target.name}:${name}`);
    }

    listExists(name, target) {
        return this.lists.has(`Stage:${name}`) || this.lists.has(`${target.name}:${name}`);
    }

    getOrCreateBroadcast(name) {
        if (!this.broadcasts.has(name)) {
            const id = this.generateId();
            this.broadcasts.set(name, id);
            const stage = this.project.targets.find(t => t.isStage);
            if (stage) {
                if (!stage.broadcasts) stage.broadcasts = {};
                stage.broadcasts[id] = name;
            }
        }
        return { id: this.broadcasts.get(name), name };
    }

    // Set a monitor's initial on-stage visibility (used by show/hide commands so
    // the display state matches the author's intent from frame 0, not just after
    // the runtime show/hide block fires).
    setMonitorVisible(varId, visible) {
        const m = this.project.monitors.find(mon => mon.id === varId);
        if (m) m.visible = visible;
    }

    createMonitor(varId, varName, opcode = 'data_variable') {
        if (this.project.monitors.find(m => m.id === varId)) return;

        const isList = opcode === 'data_listcontents';
        const monitorY = 5 + this.project.monitors.length * 28;
        this.project.monitors.push({
            id: varId,
            mode: isList ? "list" : "default",
            opcode,
            params: isList ? { LIST: varName } : { VARIABLE: varName },
            spriteName: null,
            value: isList ? [] : 0,
            width: isList ? 100 : 0,
            height: isList ? 120 : 0,
            x: 5,
            y: monitorY,
            // Hidden by default — games use lots of internal state (loop counters,
            // board cells) that shouldn't clutter the stage. Use `show variable X`
            // / `show list X` to display one.
            visible: false,
            sliderMin: 0,
            sliderMax: 100,
            isDiscrete: true
        });
    }

    // Create shadow block for dropdown menus
    createShadowBlock(opcode, fieldName, value, parentId) {
        const shadowId = this.generateId();
        const shadowOpcode = this.getShadowOpcode(opcode, fieldName);
        
        return {
            id: shadowId,
            block: {
                opcode: shadowOpcode,
                next: null,
                parent: parentId,
                inputs: {},
                fields: { [fieldName]: [value, null] },
                shadow: true,
                topLevel: false
            }
        };
    }

    getShadowOpcode(parentOpcode, fieldName) {
        const shadowMap = {
            'KEY_OPTION': 'sensing_keyoptions',
            'TOUCHINGOBJECTMENU': 'sensing_touchingobjectmenu',
            'DISTANCETOMENU': 'sensing_distancetomenu',
            'BACKDROP': 'event_whenbackdropswitchesto_menu',
            'BROADCAST_OPTION': 'event_broadcast_menu',
            'STOP_OPTION': 'control_stop_menu',
            'CLONE_OPTION': 'control_create_clone_of_menu'
        };
        return shadowMap[fieldName] || parentOpcode + '_menu';
    }

    createBlock(opcode, options = {}) {
        const id = this.generateId();
        const block = {
            opcode,
            next: null,
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: false,
            ...options
        };
        return { id, block: { [id]: block } };
    }

    // ---- Expression engine helpers -------------------------------------------------

    // Register a reporter/boolean block and return its id.
    pushBlock(context, opcode, inputs = {}, fields = {}) {
        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode,
            parent: context.parentId,
            next: null,
            shadow: false,
            topLevel: false,
            inputs,
            fields
        };
        return id;
    }

    // Register a dropdown menu shadow block and return an input array [1, id].
    menuInput(context, opcode, field, value) {
        const id = this.generateId();
        context.extraBlocks[id] = {
            opcode,
            parent: context.parentId,
            next: null,
            shadow: true,
            topLevel: false,
            inputs: {},
            fields: { [field]: [value, null] }
        };
        return [1, id];
    }

    valueOfBlock(id) { return [3, id, [4, "0"]]; }

    // Index of the ')' matching the '(' at position `open`, or -1.
    matchParen(s, open) {
        let depth = 0, inStr = false;
        for (let i = open; i < s.length; i++) {
            const c = s[i];
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '(') depth++;
            else if (c === ')') { depth--; if (depth === 0) return i; }
        }
        return -1;
    }

    stripOuterParens(s) {
        s = s.trim();
        while (s.startsWith('(') && this.matchParen(s, 0) === s.length - 1) {
            s = s.slice(1, -1).trim();
        }
        return s;
    }

    prevMeaningful(s, i) {
        for (let j = i - 1; j >= 0; j--) {
            if (s[j] !== ' ') return s[j];
        }
        return null;
    }

    // Split `s` at the rightmost top-level occurrence of any operator in `ops`
    // (left-associative). Respects parentheses and quotes. Returns {left,right,op} or null.
    splitBinary(s, ops, opts = {}) {
        const ci = !!opts.ci;
        let depth = 0, inStr = false, best = null;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (ch === '(') { depth++; continue; }
            if (ch === ')') { depth--; continue; }
            if (depth !== 0) continue;
            for (const op of ops) {
                const seg = s.substr(i, op.length);
                if (ci ? seg.toLowerCase() !== op.toLowerCase() : seg !== op) continue;
                if (op === '+' || op === '-') {
                    const prev = this.prevMeaningful(s, i);
                    if (prev === null || '+-*/(,'.includes(prev)) continue; // unary sign, not a binary op
                }
                if (op === '<' && s[i + 1] === '=') continue;
                if (op === '>' && s[i + 1] === '=') continue;
                if (op === '=' && (s[i - 1] === '<' || s[i - 1] === '>' || s[i + 1] === '=')) continue;
                if (!s.slice(0, i).trim() || !s.slice(i + op.length).trim()) continue;
                best = { index: i, op };
            }
        }
        if (!best) return null;
        return {
            left: s.slice(0, best.index).trim(),
            right: s.slice(best.index + best.op.length).trim(),
            op: best.op.trim()
        };
    }

    // Parse a numeric/string value expression into a Scratch input array.
    parseValue(valueStr, context) {
        let s = this.stripOuterParens((valueStr || '').trim());

        // Literals
        if (/^-?\d+(\.\d+)?$/.test(s)) return [1, [4, s]];
        // Hex, because a bit mask is unreadable in decimal and firmware is written in them.
        if (/^0[xX][0-9a-fA-F]+$/.test(s)) return [1, [4, String(parseInt(s, 16))]];
        if (s.length >= 2 && s.startsWith('"') && s.endsWith('"') && this.matchQuote(s) === s.length - 1) {
            return [1, [10, s.slice(1, -1)]];
        }
        if (/^(true|false)$/i.test(s)) return [1, [10, s.toLowerCase()]];
        if (/^#[0-9a-fA-F]{6}$/.test(s)) return [1, [9, s.toLowerCase()]];

        // Bounded reporters (item/letter/pick random) are recognized before operator
        // splitting: their trailing `of`/`to`/`in` keyword bounds an index/argument
        // expression that may itself contain operators (e.g. `item (r*8+c)+1 of board`).
        // Unbounded reporters (abs/round/…) stay after operators so that
        // `abs of vx * -1` keeps its `(abs of vx) * -1` meaning.
        if (/^(item|letter|pick random)\b/i.test(s)) {
            const early = this.parseReporter(s, context);
            if (early) return early;
        }

        // Binary operators, loosest binding first
        let sp;
        if ((sp = this.splitBinary(s, [' join ']))) {
            return this.valueOfBlock(this.pushBlock(context, 'operator_join', {
                STRING1: this.parseValue(sp.left, context),
                STRING2: this.parseValue(sp.right, context)
            }));
        }
        if ((sp = this.splitBinary(s, ['+', '-']))) {
            const op = sp.op === '+' ? 'operator_add' : 'operator_subtract';
            return this.valueOfBlock(this.pushBlock(context, op, {
                NUM1: this.parseValue(sp.left, context),
                NUM2: this.parseValue(sp.right, context)
            }));
        }
        if ((sp = this.splitBinary(s, ['*', '/', ' mod ']))) {
            const op = sp.op === '*' ? 'operator_multiply' : sp.op === '/' ? 'operator_divide' : 'operator_mod';
            return this.valueOfBlock(this.pushBlock(context, op, {
                NUM1: this.parseValue(sp.left, context),
                NUM2: this.parseValue(sp.right, context)
            }));
        }

        // Unary minus applied to a non-literal (e.g. `-score`)
        if (s.startsWith('-') && s.length > 1) {
            return this.valueOfBlock(this.pushBlock(context, 'operator_subtract', {
                NUM1: [1, [4, "0"]],
                NUM2: this.parseValue(s.slice(1).trim(), context)
            }));
        }

        // Reporter phrases
        const reporter = this.parseReporter(s, context);
        if (reporter) return reporter;

        // Identifier -> list or variable reporter
        if (/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(s)) {
            if (this.listExists(s, context.target)) {
                const list = this.getOrCreateList(s, context.target);
                return [3, [13, list.name, list.id], [10, ""]];
            }
            const variable = this.getOrCreateVariable(s, context.target);
            return [3, [12, variable.name, variable.id], [10, ""]];
        }

        // Fallback: string literal
        return [1, [10, s]];
    }

    matchQuote(s) {
        for (let i = 1; i < s.length; i++) {
            if (s[i] === '"') return i;
        }
        return -1;
    }

    // Reporter phrases (blocks that report a value). Returns an input array or null.
    parseReporter(s, context) {
        const B = (op, inputs = {}, fields = {}) => this.valueOfBlock(this.pushBlock(context, op, inputs, fields));
        let m;

        // Custom-block parameters resolve to argument reporters inside their definition.
        if (this.currentProcArgs && this.currentProcArgs.has(s)) {
            const arg = this.currentProcArgs.get(s);
            const op = arg.type === 'b' ? 'argument_reporter_boolean' : 'argument_reporter_string_number';
            return B(op, {}, { VALUE: [s, null] });
        }

        // STC12 pin read: digital level, or the 10-bit ADC value for an ANALOG pin.
        if ((m = s.match(/^read\s+([A-Za-z_]\w*)$/i)) && this.stcPin(m[1])) {
            return B('stc12_read', {}, { PIN: [this.stcPin(m[1]).name, null] });
        }
        // STC12 port read: the whole 8-bit port value.
        if ((m = s.match(/^read\s+([A-Za-z_]\w*)$/i)) && this.stcPort(m[1])) {
            return B('stc12_readport', {}, { PORT: [this.stcPort(m[1]).name, null] });
        }
        // TABLE lookup: table[index] — a constant byte from code-space flash.
        if ((m = s.match(/^([A-Za-z_]\w*)\[(.+)\]$/)) && this.stcTable(m[1])) {
            return B('stc12_tableindex', { INDEX: this.parseValue(m[2], context) },
                { TABLE: [this.stcTable(m[1]).name, null] });
        }
        // Circuit extension reporters (boundary B instruments).
        if ((m = s.match(/^voltage at\s+(.+)$/i))) {
            return B('circuit_nodevoltage', { NET: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^current through\s+(.+)$/i))) {
            return B('circuit_branchcurrent', { PART: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^resistance between\s+(.+?)\s+and\s+(.+)$/i))) {
            return B('circuit_resistance', { A: this.parseValue(m[1], context), B: this.parseValue(m[2], context) });
        }
        if ((m = s.match(/^brightness of\s+(.+)$/i))) {
            return B('circuit_ledbrightness', { PART: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^tone of\s+(.+)$/i))) {
            return B('circuit_buzzertone', { PART: this.parseValue(m[1], context) });
        }
        // LED cube voxel read: voxel <x> <y> <z>
        if ((m = s.match(/^voxel\s+(.+?)\s+(.+?)\s+(.+)$/i)) && this.project && this.project.stc && this.project.stc.ledcube) {
            return B('ledcube_readvoxel', {
                X: this.parseValue(m[1], context), Y: this.parseValue(m[2], context),
                Z: this.parseValue(m[3], context)
            });
        }

        // Device reporters
        if ((m = s.match(/^temperature from\s+(.+)$/i))) {
            return B('devices_temperature', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^light from\s+(.+)$/i))) {
            return B('devices_light', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^angle of\s+(.+)$/i))) {
            return B('devices_servoangle', { SERVO: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^distance from\s+(.+)$/i))) {
            return B('devices_distance', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^speed of\s+(.+)$/i))) {
            return B('devices_motorspeed', { MOTOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^direction of\s+(.+)$/i))) {
            return B('devices_motordirection', { MOTOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^state of\s+(.+)$/i))) {
            return B('devices_devicestate', { DEVICE: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^flex of\s+(.+)$/i))) {
            return B('devices_flex', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^force on\s+(.+)$/i))) {
            return B('devices_force', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^ir code from\s+(.+)$/i))) {
            return B('devices_ircode', { SENSOR: this.parseValue(m[1], context) });
        }

        if ((m = s.match(/^pick random\s+(.+)$/i))) {
            const parts = this.splitBinary(m[1], [' to '], { ci: true });
            if (parts) {
                return B('operator_random', {
                    FROM: this.parseValue(parts.left, context),
                    TO: this.parseValue(parts.right, context)
                });
            }
        }
        if ((m = s.match(/^round\s+(.+)$/i))) {
            return B('operator_round', { NUM: this.parseValue(m[1], context) });
        }
        // Bitwise. Scratch has none, and that absence is what made half the real 8051
        // firmware in the corpus untranslatable — masking a port, setting one bit, shifting
        // a reading. Worded like `mod` and `join` rather than punctuated, so pseudocode
        // still reads aloud.
        if ((m = s.match(/^bitnot\s+(.+)$/i))) return B('bitops_not', { NUM: this.parseValue(m[1], context) });
        for (const [word, op] of [['bitand', 'and'], ['bitor', 'or'], ['bitxor', 'xor'],
            ['shiftleft', 'shl'], ['shiftright', 'shr']]) {
            const sp = this.splitBinary(s, [` ${word} `], { ci: true });
            if (sp) {
                return B(`bitops_${op}`, {
                    NUM1: this.parseValue(sp.left, context),
                    NUM2: this.parseValue(sp.right, context)
                });
            }
        }
        // Planète Maths distinctive reporters (no standard equivalent). syncExtensions
        // auto-declares the `planetemaths` extension from these opcodes.
        if ((m = s.match(/^factorial of\s+(.+)$/i))) return B('planetemaths_factorial', { NUM1: this.parseValue(m[1], context) });
        if ((m = s.match(/^sum of digits of\s+(.+)$/i))) return B('planetemaths_sommechiffres', { NUM1: this.parseValue(m[1], context) });
        if ((m = s.match(/^min of\s+(.+?)\s+and\s+(.+)$/i))) return B('planetemaths_min', { NUM1: this.parseValue(m[1], context), NUM2: this.parseValue(m[2], context) });
        if ((m = s.match(/^max of\s+(.+?)\s+and\s+(.+)$/i))) return B('planetemaths_max', { NUM1: this.parseValue(m[1], context), NUM2: this.parseValue(m[2], context) });
        if ((m = s.match(/^(.+?)\s+to the power of\s+(.+)$/i))) return B('planetemaths_pow', { NUM1: this.parseValue(m[1], context), NUM2: this.parseValue(m[2], context) });
        if (/^pi$/i.test(s) && !this.variableExists('pi', context.target)) return B('planetemaths_nombre_pi', {});
        if (/^euler$/i.test(s) && !this.variableExists('euler', context.target)) return B('planetemaths_nombre_e', {});
        // Arrays & Vectors reporters (anchored on `array "NAME"`; 0-based).
        if (/\barray\s+"/.test(s)) {
            const aN = (n) => [1, [10, n]];
            // 2D / matrix reporters. get2D first, so `item row R col C of array` isn't
            // mis-parsed as a 1D `item <index> of array`.
            if ((m = s.match(/^item\s+row\s+(.+?)\s+col\s+(.+?)\s+of array\s+"([^"]*)"$/i))) return B('arrays_get2D', { NAME: aN(m[3]), ROW: this.parseValue(m[1], context), COL: this.parseValue(m[2], context) });
            if ((m = s.match(/^transpose of array\s+"([^"]*)"$/i))) return B('arrays_transpose', { NAME: aN(m[1]) });
            if ((m = s.match(/^reshape array\s+"([^"]*)"\s+to\s+(.+)$/i))) return B('arrays_reshape', { NAME: aN(m[1]), SHAPE: [1, [10, m[2].trim()]] });
            // functional reporters (FUNC is a quoted JS arrow string; emitted as a Python lambda / raw JS)
            if ((m = s.match(/^map\s+"([^"]*)"\s+over array\s+"([^"]*)"$/i))) return B('arrays_map', { NAME: aN(m[2]), FUNC: [1, [10, m[1]]] });
            if ((m = s.match(/^filter array\s+"([^"]*)"\s+by\s+"([^"]*)"$/i))) return B('arrays_filter', { NAME: aN(m[1]), FUNC: [1, [10, m[2]]] });
            if ((m = s.match(/^reduce array\s+"([^"]*)"\s+with\s+"([^"]*)"\s+from\s+(.+)$/i))) return B('arrays_reduce', { NAME: aN(m[1]), FUNC: [1, [10, m[2]]], INIT: this.parseValue(m[3], context) });
            if ((m = s.match(/^item\s+(.+?)\s+of array\s+"([^"]*)"$/i))) return B('arrays_get', { NAME: aN(m[2]), INDEX: this.parseValue(m[1], context) });
            if ((m = s.match(/^pop from array\s+"([^"]*)"$/i))) return B('arrays_pop', { NAME: aN(m[1]) });
            if ((m = s.match(/^length of array\s+"([^"]*)"$/i))) return B('arrays_length', { NAME: aN(m[1]) });
            if ((m = s.match(/^sum of array\s+"([^"]*)"$/i))) return B('arrays_sum', { NAME: aN(m[1]) });
            if ((m = s.match(/^(?:mean|average) of array\s+"([^"]*)"$/i))) return B('arrays_mean', { NAME: aN(m[1]) });
            if ((m = s.match(/^smallest of array\s+"([^"]*)"$/i))) return B('arrays_min', { NAME: aN(m[1]) });
            if ((m = s.match(/^largest of array\s+"([^"]*)"$/i))) return B('arrays_max', { NAME: aN(m[1]) });
            if ((m = s.match(/^index of\s+(.+?)\s+in array\s+"([^"]*)"$/i))) return B('arrays_indexOf', { NAME: aN(m[2]), VALUE: this.parseValue(m[1], context) });
            if ((m = s.match(/^reverse of array\s+"([^"]*)"$/i))) return B('arrays_reverse', { NAME: aN(m[1]) });
            if ((m = s.match(/^flatten of array\s+"([^"]*)"$/i))) return B('arrays_flatten', { NAME: aN(m[1]) });
            if ((m = s.match(/^sort of array\s+"([^"]*)"\s+(ascending|descending)$/i))) return B('arrays_sort', { NAME: aN(m[1]) }, { ORDER: [m[2].toLowerCase(), null] });
            if ((m = s.match(/^slice of array\s+"([^"]*)"\s+from\s+(.+?)\s+to\s+(.+)$/i))) return B('arrays_slice', { NAME: aN(m[1]), START: this.parseValue(m[2], context), END: this.parseValue(m[3], context) });
            if ((m = s.match(/^array\s+"([^"]*)"\s+as text$/i))) return B('arrays_toJSON', { NAME: aN(m[1]) });
        }
        if ((m = s.match(/^(abs|floor|ceiling|sqrt|sin|cos|tan|asin|acos|atan|ln|log)\s+of\s+(.+)$/i))) {
            return B('operator_mathop', { NUM: this.parseValue(m[2], context) }, { OPERATOR: [m[1].toLowerCase(), null] });
        }
        if ((m = s.match(/^letter\s+(.+?)\s+of\s+(.+)$/i))) {
            return B('operator_letter_of', {
                LETTER: this.parseValue(m[1], context),
                STRING: this.parseValue(m[2], context)
            });
        }
        if ((m = s.match(/^item\s+#\s+of\s+(.+)\s+in\s+(.+)$/i))) {
            const list = this.getOrCreateList(m[2].trim(), context.target);
            return B('data_itemnumoflist', { ITEM: this.parseValue(m[1], context) }, { LIST: [list.name, list.id] });
        }
        if ((m = s.match(/^item\s+(.+?)\s+of\s+(.+)$/i)) && this.listExists(m[2].trim(), context.target)) {
            const list = this.getOrCreateList(m[2].trim(), context.target);
            return B('data_itemoflist', { INDEX: this.parseValue(m[1], context) }, { LIST: [list.name, list.id] });
        }
        if ((m = s.match(/^length of\s+(.+)$/i))) {
            const arg = m[1].trim();
            if (this.listExists(arg, context.target)) {
                const list = this.getOrCreateList(arg, context.target);
                return B('data_lengthoflist', {}, { LIST: [list.name, list.id] });
            }
            return B('operator_length', { STRING: this.parseValue(arg, context) });
        }
        if ((m = s.match(/^distance to\s+(.+)$/i))) {
            const target = /^mouse(-pointer)?$/i.test(m[1].trim()) ? '_mouse_' : m[1].trim();
            return B('sensing_distanceto', { DISTANCETOMENU: this.menuInput(context, 'sensing_distancetomenu', 'DISTANCETOMENU', target) });
        }

        // [property] of [Sprite|Stage] -> sensing_of (only when the object is a real target).
        if ((m = s.match(/^(.+?)\s+of\s+(.+)$/i)) && this.targetExists(m[2].trim())) {
            const objName = m[2].trim();
            const object = /^stage$/i.test(objName) ? '_stage_' : objName;
            const propMap = {
                'x position': 'x position', 'y position': 'y position', 'direction': 'direction',
                'costume number': 'costume #', 'costume name': 'costume name', 'size': 'size',
                'volume': 'volume', 'backdrop number': 'backdrop #', 'backdrop name': 'backdrop name'
            };
            const prop = propMap[m[1].trim().toLowerCase()] || m[1].trim();
            return B('sensing_of', { OBJECT: this.menuInput(context, 'sensing_of_object_menu', 'OBJECT', object) }, { PROPERTY: [prop, null] });
        }

        // current date/time
        if ((m = s.match(/^current (year|month|date|hour|minute|second)$/i))) {
            return B('sensing_current', {}, { CURRENTMENU: [m[1].toUpperCase(), null] });
        }
        if (/^day of week$/i.test(s)) return B('sensing_current', {}, { CURRENTMENU: ['DAYOFWEEK', null] });

        // Zero-argument reporters. Single ambiguous words defer to an existing variable.
        const simple = {
            'x position': 'motion_xposition',
            'y position': 'motion_yposition',
            'mouse x': 'sensing_mousex',
            'mouse y': 'sensing_mousey',
            'days since 2000': 'sensing_dayssince2000'
        };
        const key = s.toLowerCase();
        if (simple[key]) return B(simple[key]);
        if (key === 'answer') return B('sensing_answer');
        if (key === 'timer') return B('sensing_timer');
        if (key === 'loudness') return B('sensing_loudness');
        if (key === 'username') return B('sensing_username');
        if (key === 'costume number') return B('looks_costumenumbername', {}, { NUMBER_NAME: ['number', null] });
        if (key === 'costume name') return B('looks_costumenumbername', {}, { NUMBER_NAME: ['name', null] });
        if (key === 'backdrop number') return B('looks_backdropnumbername', {}, { NUMBER_NAME: ['number', null] });
        if (key === 'backdrop name') return B('looks_backdropnumbername', {}, { NUMBER_NAME: ['name', null] });
        const ambiguous = { direction: 'motion_direction', size: 'looks_size', volume: 'sound_volume' };
        if (ambiguous[key] && !this.variableExists(s, context.target)) return B(ambiguous[key]);

        return null;
    }

    targetExists(name) {
        const lower = name.toLowerCase();
        for (const n of this.targetNames) if (n.toLowerCase() === lower) return true;
        return false;
    }

    // Normalize a key name for KEY_OPTION / WHEN key pressed menus.
    normalizeKey(key) {
        key = key.toLowerCase().trim();
        const keyMap = {
            'leftarrow': 'left arrow', 'rightarrow': 'right arrow',
            'uparrow': 'up arrow', 'downarrow': 'down arrow',
            'left': 'left arrow', 'right': 'right arrow',
            'up': 'up arrow', 'down': 'down arrow'
        };
        return keyMap[key] || key;
    }

    // ---- STC12 / 8051 target: the device model ------------------------------------
    // `DEVICE` / `CLOCK` / `PIN` are top-level declarations (like GLOBAL / COSTUME) and
    // live on `project.stc`, so they survive pseudocode ⇄ blocks and ride along inside
    // project.json. The spelling deliberately mirrors ../stc-compiler's pseudocode
    // dialect (`stc_pseudocode.py`), which is this target's reference implementation
    // and test oracle — see generateC().
    stcConfig(project = this.project) {
        if (!project.stc) project.stc = { device: 'stc12c5a60s2', clock: 11059200, pins: [], ports: [], parts: [], tables: [] };
        const cfg = project.stc;
        if (!cfg.ports) cfg.ports = [];
        if (!cfg.parts) cfg.parts = [];
        if (!cfg.tables) cfg.tables = [];
        if (!cfg.ledcube) cfg.ledcube = null;
        return cfg;
    }

    // A declared pin by name (case-insensitive), or null. Pin commands only claim a line
    // when the name really is a pin, so `turn on led1` cannot shadow anything else.
    stcPin(name) {
        const cfg = this.project && this.project.stc;
        if (!cfg || !name) return null;
        const lower = String(name).trim().toLowerCase();
        return cfg.pins.find((p) => p.name.toLowerCase() === lower) || null;
    }

    // A declared whole-port by name, or null.
    stcPort(name) {
        const cfg = this.project && this.project.stc;
        if (!cfg || !cfg.ports || !name) return null;
        const lower = String(name).trim().toLowerCase();
        return cfg.ports.find((p) => p.name.toLowerCase() === lower) || null;
    }

    // A declared lookup table by name, or null.
    stcTable(name) {
        const cfg = this.project && this.project.stc;
        if (!cfg || !cfg.tables || !name) return null;
        const lower = String(name).trim().toLowerCase();
        return cfg.tables.find((t) => t.name.toLowerCase() === lower) || null;
    }

    // A declared shift-register part by name, or null.
    stcPart(name) {
        const cfg = this.project && this.project.stc;
        if (!cfg || !cfg.parts || !name) return null;
        const lower = String(name).trim().toLowerCase();
        return cfg.parts.find((p) => p.name.toLowerCase() === lower) || null;
    }

    // Parse a top-level DEVICE / CLOCK / PIN declaration. Returns true if the line was one.
    parseStcDeclaration(trimmed, lineIndex) {
        let m;
        if ((m = trimmed.match(/^DEVICE\s+([\w-]+):?$/i))) {
            const device = m[1].toLowerCase();
            if (!SB3Creator.STC_PARTS[device]) {
                this.warn(lineIndex, `Unknown DEVICE "${m[1]}"; known: ${Object.keys(SB3Creator.STC_PARTS).sort().join(', ')}`);
                return true;
            }
            this.stcConfig().device = device;
            return true;
        }
        if ((m = trimmed.match(/^CLOCK\s+([\d_]+)\s*(hz|mhz)?$/i))) {
            const value = Number(m[1].replace(/_/g, ''));
            this.stcConfig().clock = /^mhz$/i.test(m[2] || '') ? value * 1000000 : value;
            return true;
        }
        // A numbered pin (D13, A0) for the boards that have them. Kept as its
        // own branch: an Arduino pin has no port and no bit, so every check
        // below it is about a coordinate system it is not in.
        if ((m = trimmed.match(/^PIN\s+([A-Za-z_]\w*)\s*=\s*([DA]\d+|GP\d+|P\d+|BUTTON_[AB])\s+(OUTPUT|INPUT|ANALOG|PWM|TONE)(?:\s+ACTIVE\s+(LOW|HIGH))?$/i))) {
            const [, name, where, direction, active] = m;
            const cfg = this.stcConfig();
            const part = SB3Creator.STC_PARTS[cfg.device];
            const core = part && part.core;
            // Three vocabularies reach here and each board owns exactly one.
            // Naming a pin in another board's spelling is the mistake worth
            // catching, because both spellings look perfectly reasonable.
            // Per DEVICE, not per core: a micro:bit and a Pico are both
            // MicroPython and share no pin name at all, so one regex for the
            // pair let each accept the other's spelling.
            const SPOKEN = {
                'arduino-uno': [/^(D\d+|A\d+)$/i, 'D0-D13 or A0-A5'],
                'arduino-nano': [/^(D\d+|A\d+)$/i, 'D0-D13 or A0-A7'],
                atmega328p: [/^(D\d+|A\d+)$/i, 'D0-D13 or A0-A5'],
                microbit: [/^(P\d+|BUTTON_[AB])$/i, 'P0-P20, BUTTON_A or BUTTON_B'],
                pico: [/^GP\d+$/i, 'GP0-GP28']
            };
            const spoken = SPOKEN[cfg.device];
            if (!spoken || !spoken[0].test(where)) {
                const want = spoken ? spoken[1] : 'P<port>.<bit>';
                this.warn(lineIndex, `"${where.toUpperCase()}" is not how ${cfg.device || 'this device'} names a pin; it uses ${want}`);
                return true;
            }
            // The board ends somewhere, and the compiler already refuses past
            // it. Disagreeing here would mean a project that builds in one
            // place and not the other.
            const LAST = { 'arduino-uno': { D: 13, A: 5 }, 'arduino-nano': { D: 13, A: 7 },
                atmega328p: { D: 13, A: 5 }, microbit: { P: 20 }, pico: { GP: 28 } };
            const edge = LAST[cfg.device] || {};
            const num = where.match(/^([A-Z]+)(\d+)$/i);
            if (num && edge[num[1].toUpperCase()] !== undefined && Number(num[2]) > edge[num[1].toUpperCase()]) {
                this.warn(lineIndex, `${cfg.device} has no ${where.toUpperCase()}; it goes up to ${num[1].toUpperCase()}${edge[num[1].toUpperCase()]}`);
                return true;
            }
            if (this.stcPin(name)) {
                this.warn(lineIndex, `Pin "${name}" declared twice`);
                return true;
            }
            // The Nano's A6/A7 reach the pad with no digital buffer behind
            // them, so a digital write to one does nothing on the board. The
            // compiler refuses it; agreeing here is the point of the rule
            // above about not disagreeing with it.
            if (cfg.device === 'arduino-nano' && /^A[67]$/i.test(where) && !/^analog$/i.test(direction)) {
                this.warn(lineIndex, `${where.toUpperCase()} is analog-input only on the Nano (the TQFP package brings out the ADC channel with no digital buffer), so it cannot be an ${direction.toUpperCase()}`);
                return true;
            }
            if (core === 'arduino' && /^analog$/i.test(direction) && !/^A/i.test(where)) {
                this.warn(lineIndex, `ANALOG needs an analog input (A0 and up), not ${where.toUpperCase()}`);
                return true;
            }
            if (core === 'micropython' && /^button_[ab]$/i.test(where) && !/^input$/i.test(direction)) {
                this.warn(lineIndex, `${where.toUpperCase()} is a button and can only be an INPUT`);
                return true;
            }
            cfg.pins.push({
                name,
                where: where.toUpperCase(),
                direction: direction.toLowerCase(),
                activeLow: /^low$/i.test(active || '')
            });
            return true;
        }
        if ((m = trimmed.match(/^PIN\s+([A-Za-z_]\w*)\s*=\s*P([0-4])\.([0-7])\s+(OUTPUT|INPUT|ANALOG|PWM|TONE)(?:\s+ACTIVE\s+(LOW|HIGH))?$/i))) {
            const [, name, port, bit, direction, active] = m;
            const cfg = this.stcConfig();
            if (this.stcPin(name)) {
                this.warn(lineIndex, `Pin "${name}" declared twice`);
                return true;
            }
            // ADC channel n is physically P1.n — there is no mux to anywhere else.
            if (/^analog$/i.test(direction) && port !== '1') {
                this.warn(lineIndex, `ANALOG is only available on P1.0-P1.7 (ADC0-ADC7), not P${port}.${bit}`);
                return true;
            }
            // PORT conflict: a PIN inside a declared PORT would be clobbered by every
            // port write, and neither declaration looks wrong on its own.
            if (cfg.ports.some((w) => w.port === Number(port))) {
                const conflict = cfg.ports.find((w) => w.port === Number(port));
                this.warn(lineIndex, `P${port} is already declared as the whole port "${conflict.name}"; a PORT write covers all eight bits and would clobber P${port}.${bit}`);
                return true;
            }
            cfg.pins.push({
                name,
                port: Number(port),
                bit: Number(bit),
                direction: direction.toLowerCase(),
                activeLow: /^low$/i.test(active || '')
            });
            return true;
        }
        // PORT <name> = P<n> OUTPUT|INPUT [ACTIVE LOW|HIGH]
        if ((m = trimmed.match(/^PORT\s+([A-Za-z_]\w*)\s*=\s*P([0-4])\s+(OUTPUT|INPUT)(?:\s+ACTIVE\s+(LOW|HIGH))?$/i))) {
            const [, name, port, direction, active] = m;
            const cfg = this.stcConfig();
            const portNum = Number(port);
            if (this.stcPort(name) || this.stcPin(name) || this.stcPart(name)) {
                this.warn(lineIndex, `"${name}" declared twice`);
                return true;
            }
            // Conflict: a PIN already uses a bit on this port.
            const conflict = cfg.pins.find((p) => p.port === portNum);
            if (conflict) {
                this.warn(lineIndex, `P${port} is already used one bit at a time, by "${conflict.name}" (P${conflict.port}.${conflict.bit}); a PORT writes all eight at once and would clobber it`);
                return true;
            }
            // Two PORTs on the same physical port.
            if (cfg.ports.some((p) => p.port === portNum)) {
                this.warn(lineIndex, `P${port} is already declared as "${cfg.ports.find((p) => p.port === portNum).name}"`);
                return true;
            }
            cfg.ports.push({
                name,
                port: portNum,
                direction: direction.toLowerCase(),
                activeLow: /^low$/i.test(active || '')
            });
            return true;
        }
        // PART <name> = 74HC595 data P<p>.<b> clock P<p>.<b> latch P<p>.<b> [ACTIVE LOW|HIGH]
        if ((m = trimmed.match(/^PART\s+([A-Za-z_]\w*)\s*=\s*74HC595\s+data\s+P([0-4])\.([0-7])\s+clock\s+P([0-4])\.([0-7])\s+latch\s+P([0-4])\.([0-7])(?:\s+ACTIVE\s+(LOW|HIGH))?$/i))) {
            const [, name, dp, db, cp, cb, lp, lb, active] = m;
            const cfg = this.stcConfig();
            if (this.stcPin(name) || this.stcPort(name) || this.stcPart(name)) {
                this.warn(lineIndex, `"${name}" declared twice`);
                return true;
            }
            const claims = [[Number(dp), Number(db)], [Number(cp), Number(cb)], [Number(lp), Number(lb)]];
            const claimSet = new Set(claims.map(([p, b]) => `${p}.${b}`));
            if (claimSet.size !== 3) {
                this.warn(lineIndex, `"${name}" names the same pin twice; data, clock and latch must be three different pins`);
                return true;
            }
            // Check conflicts with existing PINs, PORTs, PARTs.
            for (const [p, b] of claims) {
                const pinConflict = cfg.pins.find((pin) => pin.port === p && pin.bit === b);
                if (pinConflict) {
                    this.warn(lineIndex, `P${p}.${b} is already declared as "${pinConflict.name}"; a PART claims its pins`);
                    return true;
                }
                const portConflict = cfg.ports.find((w) => w.port === p);
                if (portConflict) {
                    this.warn(lineIndex, `P${p}.${b} is inside the whole port "${portConflict.name}", which would clobber it`);
                    return true;
                }
                for (const prev of cfg.parts) {
                    if (prev.claims.some(([pp, pb]) => pp === p && pb === b)) {
                        this.warn(lineIndex, `P${p}.${b} is already claimed by "${prev.name}"`);
                        return true;
                    }
                }
            }
            cfg.parts.push({
                name,
                type: '74hc595',
                claims,
                data: { port: Number(dp), bit: Number(db) },
                clock: { port: Number(cp), bit: Number(cb) },
                latch: { port: Number(lp), bit: Number(lb) },
                activeLow: /^low$/i.test(active || '')
            });
            return true;
        }
        // TABLE <name> = <value>, <value>, ... — constant lookup table in code space.
        // Values are bytes (0–255), separated by commas. Supports hex (0x3F) and
        // binary (0b00111111) literals. The table rides in project.stc.tables and
        // the C emitter puts it in __code flash.
        if ((m = trimmed.match(/^TABLE\s+([A-Za-z_]\w*)\s*=\s*(.+)$/i))) {
            const [, name, body] = m;
            const cfg = this.stcConfig();
            if (this.stcTable(name)) {
                this.warn(lineIndex, `Table "${name}" declared twice`);
                return true;
            }
            const values = [];
            for (let item of body.split(',')) {
                item = item.trim();
                if (!item) continue;
                let n;
                if (/^0b[01]+$/i.test(item)) n = parseInt(item.slice(2), 2);
                else n = Number(item.startsWith('0x') || item.startsWith('0X') ? item : item);
                if (!Number.isFinite(n) || n !== Math.floor(n)) {
                    this.warn(lineIndex, `"${item}" is not a constant; a TABLE holds numbers only`);
                    return true;
                }
                if (n < 0 || n > 255) {
                    this.warn(lineIndex, `${n} is outside 0–255; a TABLE holds bytes`);
                    return true;
                }
                values.push(n);
            }
            if (!values.length) {
                this.warn(lineIndex, `Table "${name}" is empty`);
                return true;
            }
            cfg.tables.push({ name, values });
            return true;
        }
        // LEDCUBE <size> — a multiplexed LED cube, <size>x<size>x<size>.
        // The voxel map (select, bit) → (x, y, z) is hardware-dependent and
        // currently unknown (see stc/src/20-ledcube/README.md). The blocks
        // work on the logical grid; the mapping table translates at emit time.
        if ((m = trimmed.match(/^LEDCUBE\s+(\d+)$/i))) {
            const size = Number(m[1]);
            if (size < 2 || size > 8) {
                this.warn(lineIndex, `LEDCUBE size must be 2–8, got ${size}`);
                return true;
            }
            const cfg = this.stcConfig();
            if (cfg.ledcube) {
                this.warn(lineIndex, 'LEDCUBE declared twice');
                return true;
            }
            // selects = size * (bicolour ? 2 : 1), bits = size * size.
            // For the 4x4x4: 8 selects, 8 data bits per select (only lower 4x4
            // used unless bi-colour doubles the select range).
            cfg.ledcube = { size, selects: size * 2, bits: 8 };
            return true;
        }
        return false;
    }

    // Parse a boolean condition expression into a block id.
    parseCondition(conditionStr, context) {
        let s = this.stripOuterParens((conditionStr || '').trim());
        const push = (op, inputs = {}, fields = {}) => this.pushBlock(context, op, inputs, fields);

        // not / or / and (loosest binding first)
        if (/^not\s+/i.test(s)) {
            const child = this.parseCondition(s.replace(/^not\s+/i, ''), context);
            return push('operator_not', { OPERAND: [2, child] });
        }
        let sp;
        if ((sp = this.splitBinary(s, [' or '], { ci: true }))) {
            return push('operator_or', {
                OPERAND1: [2, this.parseCondition(sp.left, context)],
                OPERAND2: [2, this.parseCondition(sp.right, context)]
            });
        }
        if ((sp = this.splitBinary(s, [' and '], { ci: true }))) {
            return push('operator_and', {
                OPERAND1: [2, this.parseCondition(sp.left, context)],
                OPERAND2: [2, this.parseCondition(sp.right, context)]
            });
        }

        // Planète Maths distinctive boolean (extension `planetemaths`).
        let mm;
        if ((mm = s.match(/^(.+?)\s+is multiple of\s+(.+)$/i))) {
            return push('planetemaths_multiple', { NUM1: this.parseValue(mm[1], context), NUM2: this.parseValue(mm[2], context) });
        }
        // Arrays & Vectors boolean: array "NAME" contains VALUE
        if ((mm = s.match(/^array\s+"([^"]*)"\s+contains\s+(.+)$/i))) {
            return push('arrays_contains', { NAME: [1, [10, mm[1]]], VALUE: this.parseValue(mm[2], context) });
        }

        // Comparisons. Scratch 3.0 has no native <= / >=, so build them from not().
        if ((sp = this.splitBinary(s, ['<=']))) {
            const gt = push('operator_gt', { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            return push('operator_not', { OPERAND: [2, gt] });
        }
        if ((sp = this.splitBinary(s, ['>=']))) {
            const lt = push('operator_lt', { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            return push('operator_not', { OPERAND: [2, lt] });
        }
        for (const [sym, op] of [['<', 'operator_lt'], ['>', 'operator_gt'], ['=', 'operator_equals']]) {
            if ((sp = this.splitBinary(s, [sym]))) {
                return push(op, { OPERAND1: this.parseValue(sp.left, context), OPERAND2: this.parseValue(sp.right, context) });
            }
        }

        // Predicates
        let m;
        // A bare `read <pin>` used as a condition is the pin's level (active-low aware).
        if ((m = s.match(/^read\s+([A-Za-z_]\w*)$/i)) && this.stcPin(m[1])) {
            return push('stc12_read', {}, { PIN: [this.stcPin(m[1]).name, null] });
        }
        if ((m = s.match(/^read\s+([A-Za-z_]\w*)$/i)) && this.stcPort(m[1])) {
            return push('stc12_readport', {}, { PORT: [this.stcPort(m[1]).name, null] });
        }
        // Device predicates (boolean reporters)
        // Device predicate: "<name> pressed?" — but NOT "key X pressed?" which is Scratch's own.
        if ((m = s.match(/^"([^"]+)"\s+pressed\??$/i))) {
            return push('devices_pressed', { BUTTON: this.parseValue(`"${m[1]}"`, context) });
        }
        if ((m = s.match(/^(.+?)\s+above\s+(.+)$/i))) {
            return push('devices_above', { SENSOR: this.parseValue(m[1], context), THRESHOLD: this.parseValue(m[2], context) });
        }
        if ((m = s.match(/^(.+?)\s+closer than\s+(.+)$/i))) {
            return push('devices_closer', { SENSOR: this.parseValue(m[1], context), DISTANCE: this.parseValue(m[2], context) });
        }
        if ((m = s.match(/^motion detected on\s+(.+)$/i))) {
            return push('devices_motion', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^(.+?)\s+tilted\??$/i))) {
            return push('devices_tilted', { SENSOR: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^(.+?)\s+energised\??$/i)) || (m = s.match(/^(.+?)\s+energized\??$/i))) {
            return push('devices_energised', { DEVICE: this.parseValue(m[1], context) });
        }
        if ((m = s.match(/^touching color\s+(.+)$/i))) {
            const color = this.parseValue(m[1].trim(), context);
            return push('sensing_touchingcolor', { COLOR: color });
        }
        if ((m = s.match(/^touching\s+(.+)$/i))) {
            let name = m[1].trim();
            if (/^edge$/i.test(name)) name = '_edge_';
            else if (/^mouse(-pointer)?$/i.test(name)) name = '_mouse_';
            return push('sensing_touchingobject', {
                TOUCHINGOBJECTMENU: this.menuInput(context, 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', name)
            });
        }
        if ((m = s.match(/^key\s+(.+?)\s+pressed\??$/i))) {
            return push('sensing_keypressed', {
                KEY_OPTION: this.menuInput(context, 'sensing_keyoptions', 'KEY_OPTION', this.normalizeKey(m[1]))
            });
        }
        if (/^mouse down\??$/i.test(s)) {
            return push('sensing_mousedown');
        }
        if ((sp = this.splitBinary(s, [' contains '], { ci: true }))) {
            const left = sp.left.trim();
            if (this.listExists(left, context.target)) {
                const list = this.getOrCreateList(left, context.target);
                return push('data_listcontainsitem', { ITEM: this.parseValue(sp.right, context) }, { LIST: [list.name, list.id] });
            }
            return push('operator_contains', {
                STRING1: this.parseValue(sp.left, context),
                STRING2: this.parseValue(sp.right, context)
            });
        }

        // A boolean custom-block parameter used directly as a condition.
        if (this.currentProcArgs && this.currentProcArgs.get(s)?.type === 'b') {
            return push('argument_reporter_boolean', {}, { VALUE: [s, null] });
        }

        // Default: treat as a boolean-ish value compared to true.
        return push('operator_equals', {
            OPERAND1: this.parseValue(s, context),
            OPERAND2: [1, [10, 'true']]
        });
    }

    unquote(s) {
        s = s.trim();
        if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
        return s;
    }

    // Parse `DEFINE [FAST] <signature>:` into {proccode, argNames, argTypes, warp, regexParts}.
    parseSignature(headerLine) {
        let sig = headerLine.replace(/^DEFINE\s+/i, '').replace(/:\s*$/, '').trim();
        let warp = false;
        if (/^FAST\s+/i.test(sig)) { warp = true; sig = sig.replace(/^FAST\s+/i, ''); }

        const tokens = sig.match(/\([^)]*\)|<[^>]*>|[^\s]+/g) || [];
        const procParts = [];
        const template = []; // per proccode word: { lit } or { arg: true }
        const argNames = [];
        const argTypes = [];
        for (const tok of tokens) {
            if (tok.startsWith('(') || tok.startsWith('<')) {
                const type = tok.startsWith('<') ? 'b' : 's';
                argNames.push(tok.slice(1, -1).trim());
                argTypes.push(type);
                procParts.push(type === 'b' ? '%b' : '%s');
                template.push({ arg: true });
            } else {
                procParts.push(tok);
                template.push({ lit: tok });
            }
        }
        return { proccode: procParts.join(' '), argNames, argTypes, warp, template };
    }

    // Split a line into top-level tokens: parenthesized groups and quoted strings
    // count as a single token, so custom-block args like `(pr + 1)` stay intact.
    tokenizeTop(s) {
        const tokens = [];
        let i = 0;
        s = s.trim();
        while (i < s.length) {
            if (s[i] === ' ') { i++; continue; }
            if (s[i] === '(') {
                let depth = 0, j = i;
                for (; j < s.length; j++) {
                    if (s[j] === '(') depth++;
                    else if (s[j] === ')') { depth--; if (depth === 0) { j++; break; } }
                }
                tokens.push(s.slice(i, j)); i = j; continue;
            }
            if (s[i] === '"') {
                let j = i + 1;
                while (j < s.length && s[j] !== '"') j++;
                j++; tokens.push(s.slice(i, j)); i = j; continue;
            }
            let j = i;
            while (j < s.length && s[j] !== ' ' && s[j] !== '(' && s[j] !== '"') j++;
            tokens.push(s.slice(i, j)); i = j;
        }
        return tokens;
    }

    // First-pass registration so calls resolve even before the DEFINE appears.
    registerProcedure(headerLine) {
        const sig = this.parseSignature(headerLine);
        if (this.procedures.some(p => p.proccode === sig.proccode)) return;
        this.procedures.push({
            proccode: sig.proccode,
            argIds: sig.argNames.map(() => this.generateId()),
            argNames: sig.argNames,
            argTypes: sig.argTypes,
            warp: sig.warp,
            template: sig.template
        });
        // Longest templates first so a more specific signature wins call matching.
        this.procedures.sort((a, b) => b.template.length - a.template.length);
    }

    // Build the definition blocks. Returns { block, extraBlocks, args } where `args`
    // maps param names to their type so the body emits argument reporters.
    parseDefine(headerLine, target) {
        const context = { target, extraBlocks: {}, parentId: null };
        const sig = this.parseSignature(headerLine);
        const proc = this.procedures.find(p => p.proccode === sig.proccode);
        const argIds = proc.argIds;
        const argDefaults = sig.argTypes.map(t => (t === 'b' ? 'false' : ''));
        const args = new Map();
        sig.argNames.forEach((name, i) => args.set(name, { type: sig.argTypes[i] }));

        const defId = this.generateId();
        const protoId = this.generateId();
        const protoInputs = {};
        sig.argNames.forEach((name, i) => {
            const repId = this.generateId();
            context.extraBlocks[repId] = {
                opcode: sig.argTypes[i] === 'b' ? 'argument_reporter_boolean' : 'argument_reporter_string_number',
                next: null, parent: protoId, inputs: {}, fields: { VALUE: [name, null] },
                shadow: true, topLevel: false
            };
            protoInputs[argIds[i]] = [1, repId];
        });
        context.extraBlocks[protoId] = {
            opcode: 'procedures_prototype',
            next: null, parent: defId, inputs: protoInputs, fields: {},
            shadow: true, topLevel: false,
            mutation: {
                tagName: 'mutation', children: [], proccode: sig.proccode,
                argumentids: JSON.stringify(argIds),
                argumentnames: JSON.stringify(sig.argNames),
                argumentdefaults: JSON.stringify(argDefaults),
                warp: String(sig.warp)
            }
        };
        const block = {
            [defId]: {
                opcode: 'procedures_definition',
                next: null, parent: null, inputs: { custom_block: [1, protoId] }, fields: {},
                shadow: false, topLevel: true
            }
        };
        return { block, extraBlocks: context.extraBlocks, args };
    }

    // Try to resolve a line as a call to a registered custom block, matching the
    // call's top-level tokens against the procedure's template token-for-token.
    tryProcedureCall(line, target) {
        const tokens = this.tokenizeTop(line);
        for (const proc of this.procedures) {
            if (proc.template.length !== tokens.length) continue;
            const rawArgs = [];
            let ok = true;
            for (let i = 0; i < proc.template.length; i++) {
                const t = proc.template[i];
                if (t.lit) { if (tokens[i] !== t.lit) { ok = false; break; } }
                else rawArgs.push(tokens[i]);
            }
            if (!ok) continue;

            const context = { target, extraBlocks: {}, parentId: null };
            const { id, block } = this.createBlock('procedures_call');
            context.parentId = id;
            const inputs = {};
            proc.argIds.forEach((argId, i) => {
                inputs[argId] = proc.argTypes[i] === 'b'
                    ? [2, this.parseCondition(rawArgs[i], context)]
                    : this.parseValue(rawArgs[i], context);
            });
            block[id].inputs = inputs;
            block[id].mutation = {
                tagName: 'mutation', children: [], proccode: proc.proccode,
                argumentids: JSON.stringify(proc.argIds), warp: String(proc.warp)
            };
            return { block, extraBlocks: context.extraBlocks };
        }
        return null;
    }

    parseCommand(line, target) {
        // Event hats reach here with their trailing ':' — strip it so the hat
        // patterns can anchor cleanly. Remember that it WAS a hat: an unrecognised
        // one must be refused rather than falling through to statement parsing,
        // which silently swallowed the whole script (see the guard below).
        let wasHat = false;
        if (/^when\b/i.test(line)) {
            wasHat = /:\s*$/.test(line);
            line = line.replace(/\s*:\s*$/, '');
        }
        const context = { target, extraBlocks: {}, parentId: null };
        let match;

        // Create a stack command block and make it the parent for any reporter/menu
        // blocks parsed into its inputs.
        const cmd = (opcode, opts = {}) => {
            const { id, block } = this.createBlock(opcode, opts);
            context.parentId = id;
            return { id, block };
        };
        const ret = (block) => ({ block, extraBlocks: context.extraBlocks });
        const ext = (n) => { if (!this.project.extensions.includes(n)) this.project.extensions.push(n); };
        const val = (s) => this.parseValue(s, context);

        // ---- Event hats (routed here from the main loop) ---------------------------
        if (/^when I start as a clone$/i.test(line)) {
            return { block: this.createBlock('control_start_as_clone', { topLevel: true }).block, extraBlocks: {} };
        }
        if ((match = line.match(/^when I receive\s+(.+)$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = this.createBlock('event_whenbroadcastreceived', { topLevel: true });
            block[id].fields.BROADCAST_OPTION = [bc.name, bc.id];
            return { block, extraBlocks: {} };
        }
        if (/^when (this )?sprite clicked$/i.test(line)) {
            return { block: this.createBlock('event_whenthisspriteclicked', { topLevel: true }).block, extraBlocks: {} };
        }
        if ((match = line.match(/^when\s+(.+?)\s+key\s+pressed$/i))) {
            const { id, block } = this.createBlock('event_whenkeypressed', { topLevel: true });
            block[id].fields.KEY_OPTION = [this.normalizeKey(match[1]), null];
            return { block, extraBlocks: {} };
        }
        // `flag clicked`, `started` and `powered on` are one hat under three names.
        // stc-compiler's stc_pseudocode.py accepts all three and CANONICALISES to
        // `WHEN started:`, so refusing that spelling made this side unable to read
        // the other's own output — the scripts vanished and an empty main() compiled
        // clean. Both implementations now accept all three; each keeps its own
        // canonical spelling on the way out.
        if (line.includes('flag clicked') || /^when\s+started$/i.test(line)
            || /^when\s+powered\s+on$/i.test(line)) {
            return { block: this.createBlock('event_whenflagclicked', { topLevel: true }).block, extraBlocks: {} };
        }
        // Device sensor hats: threshold-based and binary event blocks.
        // Quoted sensor name avoids collision with Scratch's "when X key pressed".
        if ((match = line.match(/^when\s+"([^"]+)"\s+above\s+(.+)$/i))) {
            const { id, block } = this.createBlock('devices_whenabove', { topLevel: true });
            block[id].inputs.SENSOR = [1, [10, match[1]]];
            block[id].inputs.THRESHOLD = val(match[2]);
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^when\s+"([^"]+)"\s+closer than\s+(.+)$/i))) {
            const { id, block } = this.createBlock('devices_whencloser', { topLevel: true });
            block[id].inputs.SENSOR = [1, [10, match[1]]];
            block[id].inputs.DISTANCE = val(match[2]);
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^when motion on\s+"([^"]+)"$/i))) {
            const { id, block } = this.createBlock('devices_whenmotion', { topLevel: true });
            block[id].inputs.SENSOR = [1, [10, match[1]]];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^when\s+"([^"]+)"\s+tilted$/i))) {
            const { id, block } = this.createBlock('devices_whentilted', { topLevel: true });
            block[id].inputs.SENSOR = [1, [10, match[1]]];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^when IR received on\s+"([^"]+)"$/i))) {
            const { id, block } = this.createBlock('devices_whenirreceived', { topLevel: true });
            block[id].inputs.SENSOR = [1, [10, match[1]]];
            return { block, extraBlocks: {} };
        }
        // STC12 event hat: `when <pin> pressed` / `when <pin> released` for INPUT pins.
        if ((match = line.match(/^when\s+([A-Za-z_]\w*)\s+(pressed|released)$/i)) && this.stcPin(match[1])) {
            const pin = this.stcPin(match[1]);
            if (pin.direction === 'input') {
                const { id, block } = this.createBlock('stc12_whenpin', { topLevel: true });
                block[id].fields.PIN = [pin.name, null];
                block[id].fields.EDGE = [match[2].toLowerCase(), null];
                return { block, extraBlocks: {} };
            }
            // An OUTPUT/ANALOG/PWM/TONE pin has no edge to react to. Build the block
            // anyway so the script body is kept, but generateC will refuse it.
            this.warn(null, `"${pin.name}" is ${pin.direction.toUpperCase()}, not INPUT; a "when ${pin.name} ${match[2].toLowerCase()}" hat has no edge to react to`);
            const { id, block } = this.createBlock('stc12_whenpin', { topLevel: true });
            block[id].fields.PIN = [pin.name, null];
            block[id].fields.EDGE = [match[2].toLowerCase(), null];
            return { block, extraBlocks: {} };
        }

        // Nothing above matched a line that arrived as `WHEN ...:`. Falling through
        // to statement parsing is what made an unknown hat silently drop its entire
        // script, so say so instead.
        if (wasHat) {
            throw new ParseError(`Unknown event hat "${line}". Known hats: WHEN flag clicked / `
                + `started / powered on, WHEN <key> key pressed, WHEN sprite clicked, `
                + `WHEN I receive "<message>", WHEN I start as a clone.`);
        }

        // ---- STC12 / 8051 pin commands --------------------------------------------
        // Guarded on the name really being a declared PIN, so these never shadow
        // `turn right 15 degrees`, `set score to 0`, or a custom block called `toggle`.
        const stcSet = (pin, state) => {
            const { id, block } = this.createBlock('stc12_setpin');
            block[id].fields.PIN = [pin.name, null];
            block[id].fields.STATE = [state, null];
            return { block, extraBlocks: {} };
        };
        if ((match = line.match(/^turn\s+(on|off)\s+([A-Za-z_]\w*)$/i)) && this.stcPin(match[2])) {
            return stcSet(this.stcPin(match[2]), match[1].toLowerCase());
        }
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+(high|low)$/i)) && this.stcPin(match[1])) {
            return stcSet(this.stcPin(match[1]), match[2].toLowerCase());
        }
        // `set <pin> to <n> percent` — PWM duty cycle. Must match BEFORE the generic
        // `set <pin> to <expr>` (writepin) below.
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+to\s+(.+?)\s*(?:percent|%)$/i)) && this.stcPin(match[1])) {
            const pin = this.stcPin(match[1]);
            if (pin.direction !== 'pwm') {
                this.warn(null, `"${pin.name}" is a ${pin.direction.toUpperCase()} pin; only a PWM pin takes a percentage`);
            }
            const { id, block } = cmd('stc12_setpwm');
            block[id].fields.PIN = [pin.name, null];
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        // `set <pin> to <n> hz` — tone frequency. Must match BEFORE the generic writepin.
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+to\s+(.+?)\s*(?:hz|hertz)$/i)) && this.stcPin(match[1])) {
            const pin = this.stcPin(match[1]);
            if (pin.direction !== 'tone') {
                this.warn(null, `"${pin.name}" is a ${pin.direction.toUpperCase()} pin; only a TONE pin takes a frequency`);
            }
            const { id, block } = cmd('stc12_settone');
            block[id].fields.PIN = [pin.name, null];
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        // `set <pin> to <expr>` writes a computed LEVEL. Distinct from `turn on/off`, which
        // are states and respect ACTIVE LOW; a level is a level, exactly like `set high`.
        // Placed before the generic variable assignment (and before motion's `set x to`) so a
        // declared pin always wins, consistent with the other pin statements.
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+to\s+(.+)$/i)) && this.stcPin(match[1])) {
            const { id, block } = cmd('stc12_writepin');
            block[id].fields.PIN = [this.stcPin(match[1]).name, null];
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^toggle\s+([A-Za-z_]\w*)$/i)) && this.stcPin(match[1])) {
            const { id, block } = this.createBlock('stc12_toggle');
            block[id].fields.PIN = [this.stcPin(match[1]).name, null];
            return { block, extraBlocks: {} };
        }
        // ---- STC12 / 8051 PORT and PART commands ------------------------------------
        // `set <port> to <n>` — writes the whole 8-bit port at once.
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+to\s+(.+)$/i)) && this.stcPort(match[1])) {
            const port = this.stcPort(match[1]);
            const { id, block } = cmd('stc12_setport');
            block[id].fields.PORT = [port.name, null];
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        // `set <part> to <n>` — shifts a byte out to a 74HC595.
        if ((match = line.match(/^set\s+([A-Za-z_]\w*)\s+to\s+(.+)$/i)) && this.stcPart(match[1])) {
            const part = this.stcPart(match[1]);
            const { id, block } = cmd('stc12_setpart');
            block[id].fields.PART = [part.name, null];
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        // ---- STC12 / 8051 print (program-wide, no declaration needed) ---------------
        if ((match = line.match(/^print\s+"([^"]*)"\s*$/i))) {
            const { id, block } = cmd('stc12_print');
            block[id].inputs.VALUE = [1, [10, match[1]]];
            block[id].fields.MODE = ['text', null];
            return ret(block);
        }
        if ((match = line.match(/^print\s+(.+)$/i))) {
            const { id, block } = cmd('stc12_print');
            block[id].inputs.VALUE = val(match[1]);
            block[id].fields.MODE = ['number', null];
            return ret(block);
        }
        // ---- Circuit extension commands (boundary B) --------------------------------
        if ((match = line.match(/^set control\s+(.+?)\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('circuit_setcontrol');
            block[id].inputs.CONTROL = val(match[1]);
            block[id].inputs.VALUE = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^turn power\s+(on|off)$/i))) {
            const { id, block } = cmd('circuit_setpower');
            block[id].fields.STATE = [match[1].toLowerCase(), null];
            return ret(block);
        }
        // ---- LED cube commands (guarded on a LEDCUBE declaration) --------------------
        if (this.project && this.project.stc && this.project.stc.ledcube) {
            if ((match = line.match(/^set voxel\s+(.+?)\s+(.+?)\s+(.+?)\s+to\s+(.+)$/i))) {
                const { id, block } = cmd('ledcube_setvoxel');
                block[id].inputs.X = val(match[1]); block[id].inputs.Y = val(match[2]);
                block[id].inputs.Z = val(match[3]); block[id].inputs.COLOUR = val(match[4]);
                return ret(block);
            }
            if ((match = line.match(/^clear voxel\s+(.+?)\s+(.+?)\s+(.+)$/i))) {
                const { id, block } = cmd('ledcube_clearvoxel');
                block[id].inputs.X = val(match[1]); block[id].inputs.Y = val(match[2]);
                block[id].inputs.Z = val(match[3]);
                return ret(block);
            }
            if ((match = line.match(/^fill layer\s+(.+?)\s+with\s+(.+)$/i))) {
                const { id, block } = cmd('ledcube_filllayer');
                block[id].inputs.LAYER = val(match[1]); block[id].inputs.COLOUR = val(match[2]);
                return ret(block);
            }
            if (/^clear cube$/i.test(line)) {
                const { block } = cmd('ledcube_clear');
                return ret(block);
            }
            // Alternation built from the shared table, so adding a direction
            // there makes the dialect accept it. Spelling the six words out
            // here was a third copy — the parser would have gone on rejecting
            // a direction the emitter and reader both understood.
            if ((match = line.match(
                new RegExp(`^shift cube\\s+(${CUBE_DIRECTIONS.join('|')})$`, 'i')))) {
                const { id, block } = cmd('ledcube_shift');
                block[id].fields.DIR = [match[1].toLowerCase(), null];
                return ret(block);
            }
            if ((match = line.match(/^hold frame(?:\s+for)?\s+(.+?)\s*(?:ms|milliseconds?)$/i))) {
                const { id, block } = cmd('ledcube_hold');
                block[id].inputs.DURATION = val(match[1]);
                return ret(block);
            }
            if ((match = line.match(/^fill column\s+(.+?)\s+(.+?)\s+with\s+(.+)$/i))) {
                const { id, block } = cmd('ledcube_fillcolumn');
                block[id].inputs.X = val(match[1]); block[id].inputs.Y = val(match[2]);
                block[id].inputs.COLOUR = val(match[3]);
                return ret(block);
            }
            if ((match = line.match(/^fill wall\s+(.+?)\s+with\s+(.+)$/i))) {
                const { id, block } = cmd('ledcube_fillwall');
                block[id].inputs.Z = val(match[1]); block[id].inputs.COLOUR = val(match[2]);
                return ret(block);
            }
            if (/^invert cube$/i.test(line)) {
                const { block } = cmd('ledcube_invert');
                return ret(block);
            }
        }

        // ---- Device convenience blocks (seven-segment, RGB LED, servo, motor, relay) ----
        // Higher-level vocabulary over the pin/port primitives. A learner says
        // "show digit 5" not "set port to font[5]".
        if ((match = line.match(/^show digit\s+(.+?)\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_showdigit');
            block[id].inputs.DIGIT = val(match[1]);
            block[id].inputs.DISPLAY = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^set\s+(.+?)\s+colour to R\s+(.+?)\s+G\s+(.+?)\s+B\s+(.+)$/i))) {
            const { id, block } = cmd('devices_setrgb');
            block[id].inputs.LED = val(match[1]);
            block[id].inputs.R = val(match[2]);
            block[id].inputs.G = val(match[3]);
            block[id].inputs.B = val(match[4]);
            return ret(block);
        }
        if ((match = line.match(/^set\s+(.+?)\s+angle to\s+(.+)$/i))) {
            const { id, block } = cmd('devices_setservo');
            block[id].inputs.SERVO = val(match[1]);
            block[id].inputs.ANGLE = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^set\s+(.+?)\s+speed to\s+(.+)$/i))) {
            const { id, block } = cmd('devices_setmotor');
            block[id].inputs.MOTOR = val(match[1]);
            block[id].inputs.SPEED = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^set relay\s+(.+?)\s+(on|off)$/i))) {
            const { id, block } = cmd('devices_setrelay');
            block[id].inputs.RELAY = val(match[1]);
            block[id].fields.STATE = [match[2].toLowerCase(), null];
            return ret(block);
        }
        if ((match = line.match(/^set\s+(.+?)\s+direction\s+(forward|reverse|brake|coast)$/i))) {
            const { id, block } = cmd('devices_setdirection');
            block[id].inputs.MOTOR = val(match[1]);
            block[id].fields.DIR = [match[2].toLowerCase(), null];
            return ret(block);
        }
        if ((match = line.match(/^activate\s+(.+)$/i))) {
            const { id, block } = cmd('devices_activate');
            block[id].inputs.DEVICE = val(match[1]);
            return ret(block);
        }
        if ((match = line.match(/^deactivate\s+(.+)$/i))) {
            const { id, block } = cmd('devices_deactivate');
            block[id].inputs.DEVICE = val(match[1]);
            return ret(block);
        }
        if ((match = line.match(/^read temperature from\s+(.+)$/i))) {
            // Reporter — handled in parseReporter, not here
        }
        if ((match = line.match(/^read light from\s+(.+)$/i))) {
            // Reporter — handled in parseReporter, not here
        }
        // ---- char_lcd blocks ----
        if ((match = line.match(/^lcd print\s+"([^"]*)"\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_lcdprint');
            block[id].inputs.TEXT = [1, [10, match[1]]];
            block[id].inputs.DISPLAY = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^lcd print\s+(.+?)\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_lcdprint');
            block[id].inputs.TEXT = val(match[1]);
            block[id].inputs.DISPLAY = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^lcd set cursor\s+(.+?)\s+(.+?)\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_lcdcursor');
            block[id].inputs.ROW = val(match[1]);
            block[id].inputs.COL = val(match[2]);
            block[id].inputs.DISPLAY = val(match[3]);
            return ret(block);
        }
        if ((match = line.match(/^lcd clear\s+(.+)$/i))) {
            const { id, block } = cmd('devices_lcdclear');
            block[id].inputs.DISPLAY = val(match[1]);
            return ret(block);
        }
        // ---- led_matrix blocks ----
        if ((match = line.match(/^set pixel\s+(.+?)\s+(.+?)\s+to\s+(.+?)\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_setpixel');
            block[id].inputs.X = val(match[1]);
            block[id].inputs.Y = val(match[2]);
            block[id].inputs.BRIGHTNESS = val(match[3]);
            block[id].inputs.MATRIX = val(match[4]);
            return ret(block);
        }
        if ((match = line.match(/^clear matrix\s+(.+)$/i))) {
            const { id, block } = cmd('devices_clearmatrix');
            block[id].inputs.MATRIX = val(match[1]);
            return ret(block);
        }
        // ---- neopixel blocks ----
        if ((match = line.match(/^set neopixel\s+(.+?)\s+to R\s+(.+?)\s+G\s+(.+?)\s+B\s+(.+?)\s+on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_setneopixel');
            block[id].inputs.INDEX = val(match[1]);
            block[id].inputs.R = val(match[2]);
            block[id].inputs.G = val(match[3]);
            block[id].inputs.B = val(match[4]);
            block[id].inputs.STRIP = val(match[5]);
            return ret(block);
        }
        if ((match = line.match(/^clear neopixels on\s+(.+)$/i))) {
            const { id, block } = cmd('devices_clearneopixels');
            block[id].inputs.STRIP = val(match[1]);
            return ret(block);
        }

        // ---- Arrays & Vectors extension commands (anchored on `array "NAME"`; 0-based) ----
        // syncExtensions() auto-declares the `arrays` extension from these opcodes.
        const aName = (n) => [1, [10, n]];
        if ((match = line.match(/^new array\s+"([^"]*)"\s*=\s*range\s+(.+?)\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('arrays_createRange');
            block[id].inputs.NAME = aName(match[1]); block[id].inputs.START = val(match[2]); block[id].inputs.END = val(match[3]);
            return ret(block);
        }
        if ((match = line.match(/^new 2D array\s+"([^"]*)"\s*=\s*(.+)$/i))) {
            const { id, block } = cmd('arrays_create2D');
            block[id].inputs.NAME = aName(match[1]); block[id].inputs.JSON = [1, [10, match[2].trim()]];
            return ret(block);
        }
        if ((match = line.match(/^new array\s+"([^"]*)"\s*=\s*(.+)$/i))) {
            const { id, block } = cmd('arrays_create1D');
            block[id].inputs.NAME = aName(match[1]); block[id].inputs.JSON = [1, [10, match[2].trim()]];
            return ret(block);
        }
        if ((match = line.match(/^new array\s+"([^"]*)"$/i))) {
            const { id, block } = cmd('arrays_createEmpty'); block[id].inputs.NAME = aName(match[1]); return ret(block);
        }
        if ((match = line.match(/^push\s+(.+?)\s+to array\s+"([^"]*)"$/i))) {
            const { id, block } = cmd('arrays_push'); block[id].inputs.NAME = aName(match[2]); block[id].inputs.VALUE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set item\s+row\s+(.+?)\s+col\s+(.+?)\s+of array\s+"([^"]*)"\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('arrays_set2D');
            block[id].inputs.NAME = aName(match[3]); block[id].inputs.ROW = val(match[1]); block[id].inputs.COL = val(match[2]); block[id].inputs.VALUE = val(match[4]);
            return ret(block);
        }
        if ((match = line.match(/^set item\s+(.+?)\s+of array\s+"([^"]*)"\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('arrays_set'); block[id].inputs.NAME = aName(match[2]); block[id].inputs.INDEX = val(match[1]); block[id].inputs.VALUE = val(match[3]); return ret(block);
        }
        if ((match = line.match(/^insert\s+(.+?)\s+at\s+(.+?)\s+of array\s+"([^"]*)"$/i))) {
            const { id, block } = cmd('arrays_insert'); block[id].inputs.NAME = aName(match[3]); block[id].inputs.INDEX = val(match[2]); block[id].inputs.VALUE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^remove item\s+(.+?)\s+of array\s+"([^"]*)"$/i))) {
            const { id, block } = cmd('arrays_remove'); block[id].inputs.NAME = aName(match[2]); block[id].inputs.INDEX = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^delete array\s+"([^"]*)"$/i))) {
            const { id, block } = cmd('arrays_delete'); block[id].inputs.NAME = aName(match[1]); return ret(block);
        }

        // ---- Motion ----------------------------------------------------------------
        if ((match = line.match(/^move\s+(.+)\s+steps?$/i))) {
            const { id, block } = cmd('motion_movesteps'); block[id].inputs.STEPS = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^turn\s+(left|right)\s+(.+)\s+degrees?$/i))) {
            const { id, block } = cmd(match[1].toLowerCase() === 'left' ? 'motion_turnleft' : 'motion_turnright');
            block[id].inputs.DEGREES = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^turn\s+(.+)\s+degrees?$/i))) {
            const { id, block } = cmd('motion_turnright'); block[id].inputs.DEGREES = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^go to x:\s*(.+?)\s+y:\s*(.+)$/i))) {
            const { id, block } = cmd('motion_gotoxy');
            block[id].inputs.X = val(match[1]); block[id].inputs.Y = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^glide\s+(.+?)\s+secs?\s+to x:\s*(.+?)\s+y:\s*(.+)$/i))) {
            const { id, block } = cmd('motion_glidesecstoxy');
            block[id].inputs.SECS = val(match[1]); block[id].inputs.X = val(match[2]); block[id].inputs.Y = val(match[3]);
            return ret(block);
        }
        if ((match = line.match(/^glide\s+(.+?)\s+secs?\s+to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_glideto');
            block[id].inputs.SECS = val(match[1]);
            block[id].inputs.TO = this.menuInput(context, 'motion_glideto_menu', 'TO', this.spriteMenuValue(match[2]));
            return ret(block);
        }
        if ((match = line.match(/^go to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_goto');
            block[id].inputs.TO = this.menuInput(context, 'motion_goto_menu', 'TO', this.spriteMenuValue(match[1]));
            return ret(block);
        }
        if ((match = line.match(/^change x by\s+(.+)$/i))) {
            const { id, block } = cmd('motion_changexby'); block[id].inputs.DX = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change y by\s+(.+)$/i))) {
            const { id, block } = cmd('motion_changeyby'); block[id].inputs.DY = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set x to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_setx'); block[id].inputs.X = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set y to\s+(.+)$/i))) {
            const { id, block } = cmd('motion_sety'); block[id].inputs.Y = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^point in direction\s+(.+)$/i))) {
            const { id, block } = cmd('motion_pointindirection'); block[id].inputs.DIRECTION = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^point towards\s+(.+)$/i))) {
            const { id, block } = cmd('motion_pointtowards');
            block[id].inputs.TOWARDS = this.menuInput(context, 'motion_pointtowards_menu', 'TOWARDS', this.spriteMenuValue(match[1]));
            return ret(block);
        }
        if (/^if on edge,?\s*bounce$/i.test(line)) {
            return { block: this.createBlock('motion_ifonedgebounce').block, extraBlocks: {} };
        }
        if ((match = line.match(/^set rotation style\s+(.+)$/i))) {
            const { id, block } = cmd('motion_setrotationstyle');
            block[id].fields.STYLE = [match[1].trim(), null]; return ret(block);
        }

        // ---- Looks -----------------------------------------------------------------
        if ((match = line.match(/^say\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const { id, block } = cmd(match[2] ? 'looks_sayforsecs' : 'looks_say');
            block[id].inputs.MESSAGE = val(match[1]);
            if (match[2]) block[id].inputs.SECS = val(match[2]);
            return ret(block);
        }
        if ((match = line.match(/^think\s+(.+?)(?:\s+for\s+(.+)\s+seconds?)?$/i))) {
            const { id, block } = cmd(match[2] ? 'looks_thinkforsecs' : 'looks_think');
            block[id].inputs.MESSAGE = val(match[1]);
            if (match[2]) block[id].inputs.SECS = val(match[2]);
            return ret(block);
        }
        if (line.toLowerCase() === 'show') return { block: this.createBlock('looks_show').block, extraBlocks: {} };
        if (line.toLowerCase() === 'hide') return { block: this.createBlock('looks_hide').block, extraBlocks: {} };
        if ((match = line.match(/^switch costume to\s+(.+)$/i))) {
            const arg = match[1].trim();
            const { id, block } = cmd('looks_switchcostumeto');
            // A parenthesised argument is a reporter expression (e.g. ("t" join v));
            // anything else is a literal costume NAME carried in a costume menu shadow
            // (a bare word must not become a variable reference).
            if (arg.startsWith('(')) {
                const rep = val(arg);
                const menu = this.menuInput(context, 'looks_costume', 'COSTUME', '');
                block[id].inputs.COSTUME = (rep[0] === 3) ? [3, rep[1], menu[1]] : rep;
            } else {
                block[id].inputs.COSTUME = this.menuInput(context, 'looks_costume', 'COSTUME', this.unquote(arg));
            }
            return ret(block);
        }
        if (line.toLowerCase() === 'next costume') return { block: this.createBlock('looks_nextcostume').block, extraBlocks: {} };
        if ((match = line.match(/^switch backdrop to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_switchbackdropto');
            block[id].inputs.BACKDROP = this.menuInput(context, 'looks_backdrops', 'BACKDROP', this.unquote(match[1]));
            return ret(block);
        }
        if (line.toLowerCase() === 'next backdrop') return { block: this.createBlock('looks_nextbackdrop').block, extraBlocks: {} };
        if ((match = line.match(/^change size by\s+(.+)$/i))) {
            const { id, block } = cmd('looks_changesizeby'); block[id].inputs.CHANGE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set size to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_setsizeto'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change\s+(color|fisheye|whirl|pixelate|mosaic|brightness|ghost)\s+effect by\s+(.+)$/i))) {
            const { id, block } = cmd('looks_changeeffectby');
            block[id].fields.EFFECT = [match[1].toUpperCase(), null]; block[id].inputs.CHANGE = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^set\s+(color|fisheye|whirl|pixelate|mosaic|brightness|ghost)\s+effect to\s+(.+)$/i))) {
            const { id, block } = cmd('looks_seteffectto');
            block[id].fields.EFFECT = [match[1].toUpperCase(), null]; block[id].inputs.VALUE = val(match[2]); return ret(block);
        }
        if (/^clear graphic effects$/i.test(line)) return { block: this.createBlock('looks_cleargraphiceffects').block, extraBlocks: {} };
        if (/^go to front$/i.test(line)) {
            const { id, block } = this.createBlock('looks_gotofrontback'); block[id].fields.FRONT_BACK = ['front', null];
            return { block, extraBlocks: {} };
        }
        if (/^go to back$/i.test(line)) {
            const { id, block } = this.createBlock('looks_gotofrontback'); block[id].fields.FRONT_BACK = ['back', null];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^go (forward|backward|back)\s+(.+?)\s+layers?$/i))) {
            const { id, block } = cmd('looks_goforwardbackwardlayers');
            block[id].fields.FORWARD_BACKWARD = [match[1].toLowerCase() === 'forward' ? 'forward' : 'backward', null];
            block[id].inputs.NUM = val(match[2]); return ret(block);
        }

        // ---- Sound -----------------------------------------------------------------
        if ((match = line.match(/^play sound\s+(.+)\s+until done$/i))) {
            const { id, block } = cmd('sound_playuntildone'); block[id].inputs.SOUND_MENU = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^play sound\s+(.+)$/i))) {
            const { id, block } = cmd('sound_play'); block[id].inputs.SOUND_MENU = val(match[1]); return ret(block);
        }
        if (line.toLowerCase() === 'stop all sounds') return { block: this.createBlock('sound_stopallsounds').block, extraBlocks: {} };
        if ((match = line.match(/^change volume by\s+(.+)$/i))) {
            const { id, block } = cmd('sound_changevolumeby'); block[id].inputs.VOLUME = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set volume to\s+(.+)$/i))) {
            const { id, block } = cmd('sound_setvolumeto'); block[id].inputs.VOLUME = val(match[1]); return ret(block);
        }

        // ---- Pen -------------------------------------------------------------------
        if (line.toLowerCase() === 'clear') { ext('pen'); return { block: this.createBlock('pen_clear').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'stamp') { ext('pen'); return { block: this.createBlock('pen_stamp').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'pen down') { ext('pen'); return { block: this.createBlock('pen_penDown').block, extraBlocks: {} }; }
        if (line.toLowerCase() === 'pen up') { ext('pen'); return { block: this.createBlock('pen_penUp').block, extraBlocks: {} }; }
        if ((match = line.match(/^set pen color to\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_setPenColorToColor'); block[id].inputs.COLOR = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change pen (color|saturation|brightness|transparency) by\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_changePenColorParamBy');
            block[id].inputs.COLOR_PARAM = this.menuInput(context, 'pen_menu_colorParam', 'colorParam', match[1].toLowerCase());
            block[id].inputs.VALUE = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^set pen (color|saturation|brightness|transparency) to\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_setPenColorParamTo');
            block[id].inputs.COLOR_PARAM = this.menuInput(context, 'pen_menu_colorParam', 'colorParam', match[1].toLowerCase());
            block[id].inputs.VALUE = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^change pen size by\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_changePenSizeBy'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set pen size to\s+(.+)$/i))) {
            ext('pen'); const { id, block } = cmd('pen_setPenSizeTo'); block[id].inputs.SIZE = val(match[1]); return ret(block);
        }

        // ---- Sensing ---------------------------------------------------------------
        if ((match = line.match(/^ask\s+(.+?)\s+and wait$/i))) {
            const { id, block } = cmd('sensing_askandwait'); block[id].inputs.QUESTION = val(match[1]); return ret(block);
        }
        if (line.toLowerCase() === 'reset timer') return { block: this.createBlock('sensing_resettimer').block, extraBlocks: {} };
        if ((match = line.match(/^set drag mode\s+(draggable|not draggable)$/i))) {
            const { id, block } = this.createBlock('sensing_setdragmode');
            block[id].fields.DRAG_MODE = [match[1].toLowerCase(), null];
            return { block, extraBlocks: {} };
        }

        // ---- Music (extension) -----------------------------------------------------
        if ((match = line.match(/^play note\s+(.+?)\s+for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_playNoteForBeats');
            block[id].inputs.NOTE = val(match[1]); block[id].inputs.BEATS = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^play drum\s+(.+?)\s+for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_playDrumForBeats');
            block[id].inputs.DRUM = this.menuInput(context, 'music_menu_DRUM', 'DRUM', match[1].trim());
            block[id].inputs.BEATS = val(match[2]); return ret(block);
        }
        if ((match = line.match(/^rest for\s+(.+)\s+beats?$/i))) {
            ext('music'); const { id, block } = cmd('music_restForBeats'); block[id].inputs.BEATS = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^set tempo to\s+(.+)$/i))) {
            ext('music'); const { id, block } = cmd('music_setTempo'); block[id].inputs.TEMPO = val(match[1]); return ret(block);
        }
        if ((match = line.match(/^change tempo by\s+(.+)$/i))) {
            ext('music'); const { id, block } = cmd('music_changeTempo'); block[id].inputs.TEMPO = val(match[1]); return ret(block);
        }

        // ---- Lists (before the generic variable set/change) ------------------------
        if ((match = line.match(/^add\s+(.+?)\s+to\s+(.+)$/i)) && this.isListTarget(match[2], target)) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_addtolist');
            block[id].inputs.ITEM = val(match[1]); block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^delete all of\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            const { id, block } = this.createBlock('data_deletealloflist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^delete\s+(.+?)\s+of\s+(.+)$/i)) && this.isListTarget(match[2], target)) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_deleteoflist');
            block[id].inputs.INDEX = val(match[1]); block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^insert\s+(.+?)\s+at\s+(.+?)\s+of\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[3].trim(), target);
            const { id, block } = cmd('data_insertatlist');
            block[id].inputs.ITEM = val(match[1]); block[id].inputs.INDEX = val(match[2]);
            block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^replace item\s+(.+?)\s+of\s+(.+?)\s+with\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[2].trim(), target);
            const { id, block } = cmd('data_replaceitemoflist');
            block[id].inputs.INDEX = val(match[1]); block[id].inputs.ITEM = val(match[3]);
            block[id].fields.LIST = [list.name, list.id]; return ret(block);
        }
        if ((match = line.match(/^show list\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            this.setMonitorVisible(list.id, true);
            const { id, block } = this.createBlock('data_showlist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^hide list\s+(.+)$/i))) {
            const list = this.getOrCreateList(match[1].trim(), target);
            this.setMonitorVisible(list.id, false);
            const { id, block } = this.createBlock('data_hidelist'); block[id].fields.LIST = [list.name, list.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^show variable\s+(.+)$/i))) {
            const v = this.getOrCreateVariable(match[1].trim(), target);
            this.setMonitorVisible(v.id, true);
            const { id, block } = this.createBlock('data_showvariable'); block[id].fields.VARIABLE = [v.name, v.id];
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^hide variable\s+(.+)$/i))) {
            const v = this.getOrCreateVariable(match[1].trim(), target);
            this.setMonitorVisible(v.id, false);
            const { id, block } = this.createBlock('data_hidevariable'); block[id].fields.VARIABLE = [v.name, v.id];
            return { block, extraBlocks: {} };
        }

        // ---- Control ---------------------------------------------------------------
        if ((match = line.match(/^wait\s+(.+?)\s+(seconds?|secs?|s|ms|milliseconds?)$/i))) {
            const { id, block } = cmd('control_wait');
            const unit = match[2].toLowerCase();
            // Scratch stores duration in seconds; convert ms.
            if (unit === 'ms' || unit.startsWith('millisecond')) {
                const raw = match[1].trim();
                const n = Number(raw);
                block[id].inputs.DURATION = Number.isFinite(n) ? val(String(n / 1000)) : val(`${raw} / 1000`);
            } else {
                block[id].inputs.DURATION = val(match[1]);
            }
            return ret(block);
        }
        if ((match = line.match(/^wait until\s+(.+)$/i))) {
            const { id, block } = cmd('control_wait_until');
            block[id].inputs.CONDITION = [2, this.parseCondition(match[1], context)]; return ret(block);
        }
        if (line.toLowerCase() === 'stop all') {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['all', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'false' };
            return { block, extraBlocks: {} };
        }
        if (/^stop this script$/i.test(line)) {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['this script', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'false' };
            return { block, extraBlocks: {} };
        }
        if (/^stop other scripts in sprite$/i.test(line)) {
            const { id, block } = this.createBlock('control_stop'); block[id].fields.STOP_OPTION = ['other scripts in sprite', null];
            block[id].mutation = { tagName: 'mutation', children: [], hasnext: 'true' };
            return { block, extraBlocks: {} };
        }
        if ((match = line.match(/^create clone of\s+(.+)$/i))) {
            const { id, block } = cmd('control_create_clone_of');
            block[id].inputs.CLONE_OPTION = this.menuInput(context, 'control_create_clone_of_menu', 'CLONE_OPTION', this.cloneMenuValue(match[1]));
            return ret(block);
        }
        if (/^delete this clone$/i.test(line)) {
            return { block: this.createBlock('control_delete_this_clone').block, extraBlocks: {} };
        }

        // ---- Broadcasts ------------------------------------------------------------
        if ((match = line.match(/^broadcast\s+(.+?)\s+and wait$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = cmd('event_broadcastandwait');
            block[id].inputs.BROADCAST_INPUT = [1, [11, bc.name, bc.id]]; return ret(block);
        }
        if ((match = line.match(/^broadcast\s+(.+)$/i))) {
            const bc = this.getOrCreateBroadcast(this.unquote(match[1]));
            const { id, block } = cmd('event_broadcast');
            block[id].inputs.BROADCAST_INPUT = [1, [11, bc.name, bc.id]]; return ret(block);
        }

        // ---- Custom block calls (before the generic variable fallback) -------------
        if (this.procedures.length) {
            const call = this.tryProcedureCall(line, target);
            if (call) return call;
        }

        // ---- Generic variable set / change (LAST so specific commands win) ---------
        if ((match = line.match(/^set\s+(.+?)\s+to\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = cmd('data_setvariableto');
            block[id].inputs.VALUE = val(match[2]); block[id].fields.VARIABLE = [variable.name, variable.id]; return ret(block);
        }
        if ((match = line.match(/^change\s+(.+?)\s+by\s+(.+)$/i))) {
            const variable = this.getOrCreateVariable(match[1].trim(), target);
            const { id, block } = cmd('data_changevariableby');
            block[id].inputs.VALUE = val(match[2]); block[id].fields.VARIABLE = [variable.name, variable.id]; return ret(block);
        }

        throw new ParseError(`Unknown command: "${line}"`);
    }

    // Menu value helpers ------------------------------------------------------------
    spriteMenuValue(name) {
        name = this.unquote(name).trim();
        if (/^mouse(-pointer)?$/i.test(name)) return '_mouse_';
        if (/^random( position)?$/i.test(name)) return '_random_';
        return name;
    }
    cloneMenuValue(name) {
        name = this.unquote(name).trim();
        if (/^(myself|me|this sprite)$/i.test(name)) return '_myself_';
        return name;
    }
    // Only treat `add/delete X of Y` as a list op when Y is plausibly a list.
    isListTarget(name, target) {
        name = name.trim();
        return this.listExists(name, target) ||
            this.declaredGlobalLists.has(name) ||
            this.declaredLocalLists.has(`${target.name}:${name}`);
    }

    // Generate an audible 16-bit PCM mono WAV sine tone (with short fades to avoid clicks).
    // 22.05 kHz keeps a beep perfectly clear while roughly halving the file size.
    makeToneWav(freq, durationSec, rate = 22050) {
        const sampleCount = Math.max(1, Math.floor(rate * durationSec));
        const dataSize = sampleCount * 2;
        const buf = new ArrayBuffer(44 + dataSize);
        const dv = new DataView(buf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF'); dv.setUint32(4, 36 + dataSize, true); writeStr(8, 'WAVE');
        writeStr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
        writeStr(36, 'data'); dv.setUint32(40, dataSize, true);
        const fade = Math.min(Math.floor(sampleCount / 8), 400);
        for (let i = 0; i < sampleCount; i++) {
            let amp = 0.35;
            if (i < fade) amp *= i / fade;
            else if (i > sampleCount - fade) amp *= (sampleCount - i) / fade;
            const s = Math.sin((2 * Math.PI * freq * i) / rate) * amp;
            dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true);
        }
        return { data: new Uint8Array(buf), sampleCount, rate };
    }

    // Register a generated tone as a sound asset and return its sound descriptor.
    registerSound(name, freq, durationSec) {
        const { data, sampleCount, rate } = this.makeToneWav(freq, durationSec);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'wav', data, filename: `${assetId}.wav`, metadata: {} });
        return { assetId, name, dataFormat: 'wav', rate, sampleCount, md5ext: `${assetId}.wav` };
    }

    // Build a distinct costume SVG. `variant` slightly squishes the shape so cycling
    // through a sprite's costumes reads as a simple animation.
    buildCostume(spriteName, color, variant, costumeName) {
        const letter = (spriteName.trim()[0] || 'S').toUpperCase().replace(/[<>&"]/g, '');
        const ry = 36 - (variant % 3) * 6; // bob up/down across frames
        const cy = 40 + (variant % 3) * 3;
        const assetId = this.generateAssetId();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="40" cy="${cy}" rx="36" ry="${ry}" fill="${color}" stroke="#000000" stroke-width="3"/><text x="40" y="${cy + 13}" font-size="40" text-anchor="middle" fill="#ffffff" font-family="Helvetica, Arial, sans-serif">${letter}</text></svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: 80, height: 80 } });
        return { assetId, name: costumeName, md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: 40, rotationCenterY: 40 };
    }

    // Build a "tile" costume: a rounded square (optionally filled) with centered
    // text — digits, letters, symbols. This is what lets grid games render real
    // numbers/marks (2048, minesweeper, tic-tac-toe) instead of recoloured blobs.
    buildTileCostume(text, bg, fg, costumeName) {
        const size = 80;
        const assetId = this.generateAssetId();
        const esc = String(text).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', '\'': '&#39;' }[c]));
        const n = esc.replace(/&[a-z#0-9]+;/g, 'x').length;
        const fontSize = n >= 4 ? 24 : n === 3 ? 32 : n === 2 ? 40 : 48;
        const y = 40 + fontSize * 0.34;
        const bgRect = (bg && bg !== 'none') ?
            `<rect x="3" y="3" width="74" height="74" rx="10" fill="${bg}" stroke="#00000033" stroke-width="2"/>` : '';
        const label = esc ? `<text x="40" y="${y}" font-size="${fontSize}" text-anchor="middle" fill="${fg}" font-family="Helvetica, Arial, sans-serif" font-weight="bold">${esc}</text>` : '';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgRect}${label}</svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: size, height: size } });
        return { assetId, name: costumeName, md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: size / 2, rotationCenterY: size / 2 };
    }

    // Split a COSTUME spec into tokens, keeping "quoted strings" as single tokens.
    tokenizeCostumeSpec(s) {
        const out = [];
        const re = /"([^"]*)"|(\S+)/g;
        let m;
        while ((m = re.exec(s)) !== null) out.push(m[1] !== undefined ? `"${m[1]}"` : m[2]);
        return out;
    }

    // Build a solid-colour backdrop SVG.
    buildBackdrop(color, name) {
        const assetId = this.generateAssetId();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect width="480" height="360" fill="${color}"/></svg>`;
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: 480, height: 360 } });
        return { assetId, name, md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: 240, rotationCenterY: 180 };
    }

    // Build a plain geometric costume at true size. Kinds: rect/square/circle/ellipse/
    // triangle, or `polygon` with an arbitrary list of x,y points (custom SVG art).
    buildShapeCostume(color, kind, dims) {
        const s = 2;
        let w, h, shape;
        if (kind === 'polygon') {
            const pts = [];
            for (let i = 0; i + 1 < dims.length; i += 2) pts.push([dims[i], dims[i + 1]]);
            while (pts.length < 3) pts.push([0, 0]);
            const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
            const minX = Math.min(...xs), minY = Math.min(...ys);
            w = Math.max(...xs) - minX || 40;
            h = Math.max(...ys) - minY || 40;
            const pointsStr = pts.map((p) => `${p[0] - minX + s},${p[1] - minY + s}`).join(' ');
            const W0 = w + 2 * s, H0 = h + 2 * s;
            shape = `<polygon points="${pointsStr}" fill="${color}" stroke="#000000" stroke-width="${s}" stroke-linejoin="round"/>`;
            const svg0 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}">${shape}</svg>`;
            const assetId0 = this.generateAssetId();
            this.assets.set(assetId0, { type: 'svg', data: svg0, filename: `${assetId0}.svg`, metadata: { width: W0, height: H0 } });
            return { assetId: assetId0, name: 'costume1', md5ext: `${assetId0}.svg`, dataFormat: 'svg', rotationCenterX: W0 / 2, rotationCenterY: H0 / 2 };
        }
        if (kind === 'rect' || kind === 'ellipse') { w = dims[0] || 40; h = dims[1] || dims[0] || 40; }
        else { w = dims[0] || 40; h = w; } // square / circle / triangle
        const W = w + 2 * s, H = h + 2 * s;
        if (kind === 'circle') shape = `<circle cx="${W / 2}" cy="${H / 2}" r="${w / 2}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else if (kind === 'ellipse') shape = `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${w / 2}" ry="${h / 2}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else if (kind === 'triangle') shape = `<polygon points="${W / 2},${s} ${W - s},${H - s} ${s},${H - s}" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        else shape = `<rect x="${s}" y="${s}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="#000000" stroke-width="${s}"/>`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shape}</svg>`;
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svg, filename: `${assetId}.svg`, metadata: { width: W, height: H } });
        return { assetId, name: 'costume1', md5ext: `${assetId}.svg`, dataFormat: 'svg', rotationCenterX: W / 2, rotationCenterY: H / 2 };
    }

    // SHAPE <kind> <dims...> [#hex]: replace a sprite's first costume with a real shape.
    setShape(target, spec, lineIndex) {
        if (target.isStage) { this.warn(lineIndex, 'SHAPE has no effect on the Stage (use BACKDROP)'); return; }
        const tokens = spec.split(/\s+/).filter(Boolean);
        const kind = (tokens[0] || '').toLowerCase();
        if (!['rect', 'square', 'circle', 'ellipse', 'triangle', 'polygon'].includes(kind)) {
            this.warn(lineIndex, `Unknown SHAPE "${tokens[0]}" (use rect/square/circle/ellipse/triangle/polygon)`);
            return;
        }
        const hex = tokens.find((t) => /^#[0-9a-fA-F]{6}$/.test(t));
        const dims = tokens.slice(1).filter((t) => /^\d+(\.\d+)?$/.test(t)).map(Number);
        const color = hex ? hex.toLowerCase() : (this.spriteColors.get(target.name) || '#4C97FF');
        const old = target.costumes[0];
        if (old && old.assetId) this.assets.delete(old.assetId);
        target.costumes[0] = this.buildShapeCostume(color, kind, dims.length ? dims : [40]);
        target.costumes[0]._shapeSpec = spec.trim();   // remember directive for lossless round-trip
    }

    // Add an extra costume/backdrop to a target (used by COSTUME / BACKDROP declarations).
    // Supported specs (sprites):
    //   COSTUME <name>                         legacy letter-in-a-circle frame
    //   COSTUME <name> tile "<txt>" <bg> [fg]  rounded square with centered text
    //   COSTUME <name> label "<txt>" [fg]      transparent centered text
    //   COSTUME <name> <shape> <dims..> [#hex] a real geometric costume (square/circle/…)
    addCostume(target, spec) {
        if (target.isStage) {
            const tks = this.tokenizeCostumeSpec(spec);
            const name = this.unquote(tks[0] || 'backdrop');
            const hex = tks.find((t) => /^#[0-9a-fA-F]{6}$/.test(t));
            const palette = ['#576065', '#4a6fa5', '#8a5a83', '#3d7068', '#a5794a'];
            const color = hex || palette[(target.costumes.length - 1) % palette.length];
            const bd = this.buildBackdrop(color, name);
            bd._spec = spec.trim();
            target.costumes.push(bd);
            return;
        }
        const tokens = this.tokenizeCostumeSpec(spec);
        const name = this.unquote(tokens[0] || `costume${target.costumes.length + 1}`);
        const kind = (tokens[1] || '').toLowerCase();
        let costume;
        if (kind === 'tile' || kind === 'label') {
            const text = this.unquote(tokens[2] || '');
            const colors = tokens.slice(3).filter((t) => /^#[0-9a-fA-F]{6}$/.test(t));
            const bg = kind === 'tile' ? (colors[0] || '#cccccc') : 'none';
            const fg = kind === 'tile' ? (colors[1] || '#222222') : (colors[0] || '#222222');
            costume = this.buildTileCostume(text, bg, fg, name);
        } else if (['rect', 'square', 'circle', 'ellipse', 'triangle', 'polygon'].includes(kind)) {
            const hex = tokens.find((t) => /^#[0-9a-fA-F]{6}$/.test(t));
            const dims = tokens.slice(2).filter((t) => /^\d+(\.\d+)?$/.test(t)).map(Number);
            const color = hex ? hex.toLowerCase() : (this.spriteColors.get(target.name) || '#4C97FF');
            costume = this.buildShapeCostume(color, kind, dims.length ? dims : [40]);
            costume.name = name;
        } else {
            const color = this.spriteColors.get(target.name) || '#4C97FF';
            costume = this.buildCostume(target.name, color, target.costumes.length, name);
        }
        costume._spec = spec.trim();   // remember directive for lossless round-trip
        target.costumes.push(costume);
    }

    createStage() {
        return {
            isStage: true,
            name: "Stage",
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [{
                assetId: "cd21514d0531fdffb22204e0ec5ed84a",
                name: "backdrop1",
                md5ext: "cd21514d0531fdffb22204e0ec5ed84a.svg",
                dataFormat: "svg",
                rotationCenterX: 240,
                rotationCenterY: 180
            }],
            sounds: [this.registerSound('Pop', 800, 0.12)],
            volume: 100,
            layerOrder: 0,
            tempo: 60,
            videoTransparency: 50,
            videoState: "on",
            textToSpeechLanguage: null
        };
    }

    // Build a distinct colored first costume so sprites don't all render identically.
    createSpriteCostume(name) {
        const palette = ['#4C97FF', '#FF6680', '#59C059', '#FFAB19', '#9966FF', '#FF8C1A', '#0FBD8C', '#DB6E00'];
        const color = palette[this.spriteColorIndex++ % palette.length];
        this.spriteColors.set(name, color);
        return this.buildCostume(name, color, 0, 'costume1');
    }

    createSprite(name) {
        return {
            isStage: false,
            name,
            variables: {},
            lists: {},
            broadcasts: {},
            blocks: {},
            comments: {},
            currentCostume: 0,
            costumes: [this.createSpriteCostume(name)],
            sounds: [this.registerSound('Meow', 320, 0.25)],
            volume: 100,
            layerOrder: 1,
            visible: true,
            x: 0,
            y: 0,
            size: 100,
            direction: 90,
            draggable: false,
            rotationStyle: "all around"
        };
    }

    parse(pseudocode) {
        this.reset();
        if (!pseudocode.trim()) {
            throw new ParseError("Pseudocode is empty");
        }

        // Normalise line endings and expand leading tabs so tab- or CRLF-indented files
        // parse the same as space-indented ones.
        const lines = pseudocode.replace(/\r\n?/g, '\n').split('\n').map((raw) => {
            const line = this.stripComment(raw);
            const lead = line.match(/^[ \t]*/)[0].replace(/\t/g, '  ');
            return lead + line.slice(line.match(/^[ \t]*/)[0].length);
        });
        const getIndent = (s) => s.match(/^\s*/)[0].length;
        // Indentation of the next non-blank line after `idx` (or -1 if none).
        const nextIndent = (idx) => {
            for (let j = idx + 1; j < lines.length; j++) {
                if (lines[j].trim()) return getIndent(lines[j]);
            }
            return -1;
        };
        // Child-block indent: the actual indent of the following line when it is deeper
        // than the block header, so any consistent indent step (2, 4, tab…) works.
        const childIndent = (idx, headerIndent) => {
            const ni = nextIndent(idx);
            return ni > headerIndent ? ni : headerIndent + 2;
        };

        const stage = this.createStage();
        this.project.targets.push(stage);
        let currentTarget = stage;

        const parseStructure = (startIndex, indentLevel, target) => {
            let i = startIndex;
            let firstBlockId = null;
            let lastBlockId = null;
            const allBlocks = {};

            const linkBlock = (newBlockData) => {
                if (!newBlockData || !newBlockData.block) return;
                const newId = Object.keys(newBlockData.block)[0];
                Object.assign(allBlocks, newBlockData.extraBlocks || {}, newBlockData.block);

                if (!firstBlockId) firstBlockId = newId;
                if (lastBlockId) {
                    allBlocks[lastBlockId].next = newId;
                    allBlocks[newId].parent = lastBlockId;
                }
                lastBlockId = newId;
                this.attachPendingComment(target, allBlocks[newId], newId);
            };

            while (i < lines.length) {
                const line = lines[i];
                if (!line.trim()) {
                    i++;
                    continue;
                }

                // A `# comment` line buffers onto the next block created (see linkBlock).
                if (line.trim().startsWith('#')) {
                    const text = line.trim().replace(/^#+\s?/, '');
                    this._pendingComment = this._pendingComment ? `${this._pendingComment}\n${text}` : text;
                    i++;
                    continue;
                }

                const currentIndent = getIndent(line);
                if (currentIndent < indentLevel) break;
                if (currentIndent > indentLevel) {
                    this.warn(i, `Skipping line with unexpected indentation: "${line.trim()}"`);
                    i++;
                    continue;
                }

                const trimmed = line.trim();

                if (trimmed.endsWith(':')) {
                    let newBlockData;
                    const context = { target, extraBlocks: {}, parentId: null };
                    // A comment written above `IF …:` belongs to the IF. The body is
                    // parsed before the control block is linked, so without setting
                    // the pending comment aside here the body's first statement
                    // swallows it — and the decompiler then writes it one level in,
                    // which is not what was written and does not survive a round trip.
                    const ownComment = this._pendingComment;
                    this._pendingComment = '';

                    if (trimmed.startsWith('FOREVER')) {
                        newBlockData = {
                            block: this.createBlock('control_forever').block,
                            extraBlocks: {}
                        };
                    } else if (/^REPEAT\s+UNTIL\b/i.test(trimmed)) {
                        const m = trimmed.match(/^REPEAT\s+UNTIL\s+(.+):$/i);
                        if (!m) {
                            this.warn(i, `Malformed REPEAT UNTIL (expected "REPEAT UNTIL <condition>:"): "${trimmed}"`);
                            this._pendingComment = ownComment; i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat_until');
                        context.parentId = id;
                        block[id].inputs.CONDITION = [2, this.parseCondition(m[1], context)];
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('REPEAT')) {
                        const m = trimmed.match(/REPEAT\s+(.+?):/i);
                        if (!m) {
                            this.warn(i, `Malformed REPEAT (expected "REPEAT <count>:"): "${trimmed}"`);
                            this._pendingComment = ownComment; i++; continue;
                        }
                        const { id, block } = this.createBlock('control_repeat');
                        context.parentId = id;
                        block[id].inputs.TIMES = this.parseValue(m[1], context);
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('IF')) {
                        const m = trimmed.match(/IF\s+(.+?)\s+THEN:/i);
                        if (!m) {
                            this.warn(i, `Malformed IF (expected "IF <condition> THEN:"): "${trimmed}"`);
                            this._pendingComment = ownComment; i++; continue;
                        }
                        const { id, block } = this.createBlock('control_if');
                        context.parentId = id;
                        const condId = this.parseCondition(m[1], context);
                        block[id].inputs.CONDITION = [2, condId];
                        newBlockData = { block, extraBlocks: context.extraBlocks };
                    } else if (trimmed.startsWith('ELSE')) {
                        // Find the parent IF block to convert to IF_ELSE
                        this._pendingComment = ownComment;
                        if (lastBlockId && allBlocks[lastBlockId] && allBlocks[lastBlockId].opcode === 'control_if') {
                            allBlocks[lastBlockId].opcode = 'control_if_else';
                            const childResult = parseStructure(i + 1, childIndent(i, currentIndent), target);
                            if (childResult.firstBlockId) {
                                allBlocks[lastBlockId].inputs.SUBSTACK2 = [2, childResult.firstBlockId];
                                childResult.blocks[childResult.firstBlockId].parent = lastBlockId;
                                Object.assign(allBlocks, childResult.blocks);
                            }
                            i = childResult.endIndex;
                            continue;
                        } else {
                            this.warn(i, 'ELSE block without matching IF block');
                        }
                    }

                    if (newBlockData) {
                        const childResult = parseStructure(i + 1, childIndent(i, currentIndent), target);
                        const blockId = Object.keys(newBlockData.block)[0];
                        
                        if (childResult.firstBlockId) {
                            newBlockData.block[blockId].inputs.SUBSTACK = [2, childResult.firstBlockId];
                            childResult.blocks[childResult.firstBlockId].parent = blockId;
                            Object.assign(newBlockData.extraBlocks, childResult.blocks);
                        }
                        
                        this._pendingComment = ownComment;   // …and hand it to the block it was written for
                        linkBlock(newBlockData);
                        i = childResult.endIndex;
                        continue;
                    }
                } else {
                    try {
                        linkBlock(this.parseCommand(trimmed, target));
                    } catch (error) {
                        if (error.isSB3Error) {
                            this.warn(i, error.message);
                        } else {
                            throw error;
                        }
                    }
                }
                i++;
            }

            return { blocks: allBlocks, firstBlockId, endIndex: i };
        };

        // First pass: collect sprite names and register all custom-block signatures so
        // forward references (sensing_of a later sprite, calling a later DEFINE) resolve.
        for (const l of lines) {
            const t = l.trim();
            const sm = t.match(/^SPRITE\s+(.+?):/i);
            if (sm) this.targetNames.add(sm[1].trim());
            if (/^DEFINE\b/i.test(t)) this.registerProcedure(t);
        }

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) { i++; continue; }
            // A `# comment` before a hat (or sprite) buffers onto the next block created.
            if (trimmed.startsWith('#')) {
                const text = trimmed.replace(/^#+\s?/, '');
                this._pendingComment = this._pendingComment ? `${this._pendingComment}\n${text}` : text;
                i++;
                continue;
            }

            // Explicit scope declarations
            let decl;
            if ((decl = trimmed.match(/^(GLOBAL|LOCAL)\s+LIST\s+(.+)$/i))) {
                const name = decl[2].trim();
                if (decl[1].toUpperCase() === 'GLOBAL') this.declaredGlobalLists.add(name);
                else this.declaredLocalLists.add(`${currentTarget.name}:${name}`);
                this.getOrCreateList(name, currentTarget);
                i++; continue;
            }
            if ((decl = trimmed.match(/^LIST\s+(.+)$/i))) {
                const name = decl[1].trim();
                if (currentTarget.isStage) this.declaredGlobalLists.add(name);
                else this.declaredLocalLists.add(`${currentTarget.name}:${name}`);
                this.getOrCreateList(name, currentTarget);
                i++; continue;
            }
            if ((decl = trimmed.match(/^(GLOBAL|LOCAL)\s+(.+)$/i))) {
                const name = decl[2].trim();
                if (decl[1].toUpperCase() === 'GLOBAL') this.declaredGlobals.add(name);
                else this.declaredLocals.add(`${currentTarget.name}:${name}`);
                this.getOrCreateVariable(name, currentTarget);
                i++; continue;
            }

            // STC12 / 8051 target declarations (DEVICE / CLOCK / PIN / PORT / PART). Inert
            // for every other target; generateC() is the only consumer.
            if (/^(DEVICE|CLOCK|PIN|PORT|PART|TABLE|LEDCUBE)\b/i.test(trimmed) && this.parseStcDeclaration(trimmed, i)) {
                i++; continue;
            }

            // Asset declarations: shape, extra costumes (animation frames), backdrops, sounds.
            if ((decl = trimmed.match(/^SHAPE\s+(.+)$/i))) {
                this.setShape(currentTarget, decl[1].trim(), i);
                i++; continue;
            }
            if ((decl = trimmed.match(/^COSTUME\s+(.+)$/i))) {
                this.addCostume(currentTarget, decl[1].trim());
                i++; continue;
            }
            if ((decl = trimmed.match(/^BACKDROP\s+(.+)$/i))) {
                this.addCostume(stage, decl[1].trim());
                i++; continue;
            }
            if ((decl = trimmed.match(/^SOUND\s+(.+?)(?:\s+(\d+))?$/i))) {
                const freq = decl[2] ? Number(decl[2]) : 440;
                currentTarget.sounds.push(this.registerSound(this.unquote(decl[1].trim()), freq, 0.3));
                i++; continue;
            }

            if (trimmed.startsWith('SPRITE') || trimmed.startsWith('STAGE')) {
                if (trimmed.startsWith('SPRITE')) {
                    const m = trimmed.match(/SPRITE\s+(.+?):/i);
                    if (!m) {
                        this.warn(i, `Malformed SPRITE header (expected "SPRITE <name>:"): "${trimmed}"`);
                        i++; continue;
                    }
                    const spriteName = m[1].trim();
                    if (this.project.targets.some((t) => !t.isStage && t.name === spriteName)) {
                        this.warn(i, `Duplicate sprite name "${spriteName}" — sprite names must be unique`);
                    }
                    currentTarget = this.createSprite(spriteName);
                    this.project.targets.push(currentTarget);
                } else {
                    currentTarget = stage;
                }
                i++;
            } else if (trimmed.startsWith('WHEN')) {
                try {
                    const eventData = this.parseCommand(trimmed, currentTarget);
                    const eventId = Object.keys(eventData.block)[0];
                    
                    eventData.block[eventId].topLevel = true;
                    eventData.block[eventId].x = 50 + (this.scriptCount % 3) * 350;
                    eventData.block[eventId].y = 50 + Math.floor(this.scriptCount / 3) * 300;
                    this.scriptCount++;
                    this.attachPendingComment(currentTarget, eventData.block[eventId], eventId);
                    
                    const nextLineIndent = (i + 1 < lines.length) ? getIndent(lines[i + 1]) : 0;
                    const result = parseStructure(i + 1, nextLineIndent, currentTarget);
                    
                    if (result.firstBlockId) {
                        eventData.block[eventId].next = result.firstBlockId;
                        result.blocks[result.firstBlockId].parent = eventId;
                    }

                    Object.assign(currentTarget.blocks, eventData.block, eventData.extraBlocks || {}, result.blocks);
                    i = result.endIndex;
                } catch (error) {
                    if (error.isSB3Error) {
                        this.warn(i, `Error in "${trimmed}": ${error.message}`);
                        i++;
                    } else {
                        throw error;
                    }
                }
            } else if (trimmed.startsWith('DEFINE')) {
                try {
                    const defData = this.parseDefine(trimmed, currentTarget);
                    const defId = Object.keys(defData.block)[0];
                    defData.block[defId].x = 50 + (this.scriptCount % 3) * 350;
                    defData.block[defId].y = 50 + Math.floor(this.scriptCount / 3) * 300;
                    this.scriptCount++;

                    this.currentProcArgs = defData.args;
                    const nextLineIndent = (i + 1 < lines.length) ? getIndent(lines[i + 1]) : 0;
                    const result = parseStructure(i + 1, nextLineIndent, currentTarget);

                    if (result.firstBlockId) {
                        defData.block[defId].next = result.firstBlockId;
                        result.blocks[result.firstBlockId].parent = defId;
                    }

                    Object.assign(currentTarget.blocks, defData.block, defData.extraBlocks || {}, result.blocks);
                    this.currentProcArgs = null;
                    i = result.endIndex;
                } catch (error) {
                    this.currentProcArgs = null;
                    if (error.isSB3Error) {
                        this.warn(i, `Error in DEFINE "${trimmed}": ${error.message}`);
                        i++;
                    } else {
                        throw error;
                    }
                }
            } else {
                this.warn(i, `Ignoring line not associated with a script: "${trimmed}"`);
                i++;
            }
        }

        this.validateReferences();
        this.syncExtensions();
        for (const t of this.project.targets) this.layoutScripts(t);
        SB3Creator.writeStcComment(this.project);
        return this.project;
    }

    // ===== STC persistence: survive the sb3 serializer ==============================
    //
    // scratch-vm's sb3 serializer emits only targets/monitors/extensions/meta and
    // drops every other top-level key — so `project.stc` dies on the first save from
    // a running VM, and a reopened project loses every pin declaration. Stage
    // comments, however, round-trip through every sb3 serializer and every editor.
    // So the declarations ride in BOTH places: the top-level `stc` key (canonical,
    // read by the hosted compiler and everything in this repo) and a Stage comment
    // carrying the same JSON behind a magic marker (the survivor). readStc() prefers
    // the key and falls back to the comment; the comment is regenerated on every
    // parse, so the two cannot drift within this library's own flows.

    /** Marker that identifies the persistence comment. */
    static STC_MAGIC = '_stcconfig_';

    /** Stable comment id, so rewrites replace rather than accumulate. */
    static STC_COMMENT_ID = 'stcconfig';

    /**
     * Write (or rewrite) the Stage comment mirroring project.stc.
     * No-op when the project has no stc block or no stage.
     * @param {object} project - sb3-shaped project JSON
     */
    static writeStcComment(project) {
        if (!project || !project.stc || !Array.isArray(project.targets)) return;
        const stage = project.targets.find(t => t.isStage);
        if (!stage) return;
        if (!stage.comments) stage.comments = {};
        stage.comments[SB3Creator.STC_COMMENT_ID] = {
            blockId: null,
            x: 0, y: 0, width: 320, height: 140, minimized: true,
            text: 'BrickWright hardware declarations — regenerated on save, do not edit.\n'
                + SB3Creator.STC_MAGIC + JSON.stringify(project.stc)
        };
    }

    /**
     * Recover the stc block from a project: the top-level key when present,
     * else the Stage persistence comment. Returns null when neither exists or
     * the comment is corrupt — never a fabricated default.
     * @param {object} project - sb3-shaped project JSON
     * @returns {object | null}
     */
    static readStc(project) {
        if (!project) return null;
        if (project.stc) return project.stc;
        const stage = Array.isArray(project.targets) ? project.targets.find(t => t.isStage) : null;
        if (!stage || !stage.comments) return null;
        for (const c of Object.values(stage.comments)) {
            const text = c && typeof c.text === 'string' ? c.text : '';
            const at = text.indexOf(SB3Creator.STC_MAGIC);
            if (at === -1) continue;
            try {
                return JSON.parse(text.slice(at + SB3Creator.STC_MAGIC.length));
            } catch {
                return null; // corrupt comment: absent beats invented
            }
        }
        return null;
    }

    // Lay a target's top-level scripts out so they don't overlap in the editor. The parse-time
    // grid uses fixed 350×300 cells, so tall scripts (a big `DEFINE`) collide with the next row.
    // This masonry pass measures each script (block count → height) and drops it into whichever
    // column currently ends highest, giving a compact, collision-free arrangement.
    layoutScripts(target) {
        const blocks = target.blocks || {};
        const tops = Object.entries(blocks).filter(([, b]) => b.topLevel && !b.shadow);
        if (!tops.length) return;
        const MARGIN = 40, GAP = 48, COL_W = 600, ROW_H = 48;
        const nCols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(tops.length))));
        const colY = new Array(nCols).fill(MARGIN);
        // Estimate a script's pixel height from the number of blocks it contains (incl. nested).
        const heightOf = (hatId) => {
            let count = 0;
            const walk = (id) => {
                while (id && blocks[id]) {
                    count++;
                    const inp = blocks[id].inputs || {};
                    for (const k of ['SUBSTACK', 'SUBSTACK2']) if (Array.isArray(inp[k])) walk(inp[k][1]);
                    id = blocks[id].next;
                }
            };
            walk(blocks[hatId].next);
            return ROW_H * (count + 1) + 24;   // hat + stacked blocks + padding
        };
        for (const [id, b] of tops) {
            let col = 0;
            for (let k = 1; k < nCols; k++) if (colY[k] < colY[col]) col = k;
            b.x = MARGIN + col * COL_W;
            b.y = colY[col];
            colY[col] += heightOf(id) + GAP;
        }
    }

    // Warn about menu blocks (touching, clone of, ... of, point/go towards) that name a
    // sprite which doesn't exist — usually a typo that would silently do nothing.
    validateReferences() {
        const MENUS = {
            sensing_touchingobjectmenu: ['TOUCHINGOBJECTMENU', ['_edge_', '_mouse_']],
            control_create_clone_of_menu: ['CLONE_OPTION', ['_myself_']],
            sensing_of_object_menu: ['OBJECT', ['_stage_']],
            motion_pointtowards_menu: ['TOWARDS', ['_mouse_', '_random_']],
            motion_goto_menu: ['TO', ['_mouse_', '_random_']],
            motion_glideto_menu: ['TO', ['_mouse_', '_random_']],
            sensing_distancetomenu: ['DISTANCETOMENU', ['_mouse_']],
        };
        const known = new Set([...this.targetNames].map((n) => n.toLowerCase()));
        const seen = new Set();
        // Every sound name defined anywhere (a sprite may reference by shared name).
        const allSounds = new Set();
        for (const t of this.project.targets) for (const s of t.sounds || []) allSounds.add(s.name);

        // Literal string value of an input like COSTUME / SOUND_MENU (else null).
        const literal = (input) => (Array.isArray(input) && input[0] === 1 && Array.isArray(input[1]) && input[1][0] === 10 ? input[1][1] : null);

        for (const target of this.project.targets) {
            const costumeNames = new Set((target.costumes || []).map((c) => c.name));
            for (const block of Object.values(target.blocks || {})) {
                const menu = MENUS[block.opcode];
                if (menu) {
                    const [field, allowed] = menu;
                    const value = block.fields?.[field]?.[0];
                    if (typeof value === 'string' && !allowed.includes(value) && !known.has(value.toLowerCase()) && !seen.has(value)) {
                        seen.add(value);
                        this.warnings.push(`References unknown sprite "${value}" (not a defined sprite)`);
                    }
                }
                if (block.opcode === 'looks_switchcostumeto') {
                    const inp = block.inputs?.COSTUME;
                    // Read the name from the costume menu shadow; reporter forms
                    // ([3, reporterId, shadowId]) are dynamic, so skip them.
                    let name = literal(inp);
                    if (name === null && Array.isArray(inp) && inp[0] === 1) {
                        const shadow = target.blocks[inp[1]];
                        name = shadow && shadow.fields?.COSTUME ? shadow.fields.COSTUME[0] : null;
                    }
                    if (name && !/^\d+$/.test(name) && !costumeNames.has(name) && !seen.has('c:' + name)) {
                        seen.add('c:' + name);
                        this.warnings.push(`Switches to unknown costume "${name}" (declare it with COSTUME ${name})`);
                    }
                }
                if (block.opcode === 'sound_play' || block.opcode === 'sound_playuntildone') {
                    const name = literal(block.inputs?.SOUND_MENU);
                    if (name && !allSounds.has(name) && !seen.has('s:' + name)) {
                        seen.add('s:' + name);
                        this.warnings.push(`Plays unknown sound "${name}" (declare it with SOUND ${name})`);
                    }
                }
            }
        }
    }

    async generateSB3() {
        if (!this.project) {
            throw new ValidationError('No project to generate');
        }

        // Auto-declare the extensions the blocks actually use (and their URLs) so the
        // VM loads them — covers blocks that arrived via any path (compile / injected).
        this.syncExtensions();

        const zip = new JSZip();
        zip.file('project.json', JSON.stringify(this.project));

        // The Stage's default backdrop is the one fixed asset id (a soft gradient).
        // Everything else — sprite costumes, extra costumes/backdrops, and the generated
        // tone sounds — is produced on the fly and lives in `this.assets`.
        const stageAsset = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0,0,480,360"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" /><stop offset="100%" style="stop-color:#98FB98;stop-opacity:1" /></linearGradient></defs><rect width="480" height="360" fill="url(#bg)"/></svg>`;
        zip.file('cd21514d0531fdffb22204e0ec5ed84a.svg', stageAsset);

        for (const assetData of this.assets.values()) {
            zip.file(assetData.filename, assetData.data);
        }

        this.generatedSB3 = await zip.generateAsync({ type: 'blob' });
        return this.generatedSB3;
    }

    validate() {
        this.errors = [];
        
        // Check for sprites without costumes
        for (const target of this.project.targets) {
            if (!target.costumes || target.costumes.length === 0) {
                this.errors.push(`${target.name} has no costumes`);
            }
        }

        // Check for scripts
        const scriptsFound = this.project.targets.reduce((acc, t) => 
            acc + Object.values(t.blocks || {}).filter(b => b.topLevel).length, 0
        );

        if (scriptsFound === 0 && this.errors.length === 0) {
            this.warnings.push("No scripts found. Scripts must start with 'WHEN'.");
        }

        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            parsingWarnings: this.warnings,
            scriptsFound,
            variablesCreated: this.variables.size,
            targets: this.project.targets.length
        };
    }

    // Deep referential-integrity check of the generated project graph.
    // Returns an array of human-readable problems (empty === healthy).
    checkIntegrity(project = this.project) {
        const issues = [];
        const allVarIds = new Set();
        const allListIds = new Set();
        const broadcastIds = new Set();
        for (const t of project.targets) {
            for (const id of Object.keys(t.variables || {})) allVarIds.add(id);
            for (const id of Object.keys(t.lists || {})) allListIds.add(id);
            if (t.isStage) for (const id of Object.keys(t.broadcasts || {})) broadcastIds.add(id);
        }

        for (const t of project.targets) {
            const blocks = t.blocks || {};
            const ids = new Set(Object.keys(blocks));
            const where = (bid) => `${t.isStage ? 'Stage' : t.name}/${bid}`;

            const checkInput = (bid, key, input) => {
                if (!Array.isArray(input)) return;
                const shadowType = input[0];
                const check = (ref, kind) => {
                    if (typeof ref === 'string') {
                        if (!ids.has(ref)) issues.push(`${where(bid)} input ${key} references missing ${kind} block ${ref}`);
                    } else if (Array.isArray(ref)) {
                        if (ref[0] === 12 && !allVarIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared variable ${ref[1]}`);
                        if (ref[0] === 13 && !allListIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared list ${ref[1]}`);
                        if (ref[0] === 11 && !broadcastIds.has(ref[2])) issues.push(`${where(bid)} input ${key} references undeclared broadcast ${ref[1]}`);
                    }
                };
                if (shadowType === 2 || shadowType === 3) check(input[1], 'block'); // boolean/obscured value
                if (shadowType === 1) check(input[1], 'shadow'); // shadow primitive or menu id
                if (shadowType === 3 && input[2] !== undefined) check(input[2], 'shadow');
            };

            for (const [bid, b] of Object.entries(blocks)) {
                if (b.next && !ids.has(b.next)) issues.push(`${where(bid)} .next points to missing block ${b.next}`);
                if (b.parent && !ids.has(b.parent)) issues.push(`${where(bid)} .parent points to missing block ${b.parent}`);
                for (const [key, input] of Object.entries(b.inputs || {})) checkInput(bid, key, input);
                for (const [fname, fval] of Object.entries(b.fields || {})) {
                    if (fname === 'VARIABLE' && Array.isArray(fval) && !allVarIds.has(fval[1])) issues.push(`${where(bid)} field VARIABLE references undeclared variable ${fval[0]}`);
                    if (fname === 'LIST' && Array.isArray(fval) && !allListIds.has(fval[1])) issues.push(`${where(bid)} field LIST references undeclared list ${fval[0]}`);
                    if (fname === 'BROADCAST_OPTION' && Array.isArray(fval) && !broadcastIds.has(fval[1])) issues.push(`${where(bid)} field BROADCAST_OPTION references undeclared broadcast ${fval[0]}`);
                }
            }

            // Every referenced costume/sound asset must be present in the project.
            for (const c of t.costumes || []) {
                if (!c.assetId || !c.md5ext) issues.push(`${where('costume')} ${c.name} missing asset id`);
            }
        }
        return issues;
    }

    // Add method to handle SVG uploads
    async addSVGAsset(file, name, targetIndex = 1) {
        if (!file.type.includes('svg')) {
            throw new AssetError('File must be an SVG');
        }

        const svgText = await file.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (!svgElement) {
            throw new AssetError('Invalid SVG file');
        }

        // Extract dimensions
        const width = parseFloat(svgElement.getAttribute('width')) || 240;
        const height = parseFloat(svgElement.getAttribute('height')) || 180;
        
        const assetId = this.generateAssetId();
        const filename = `${assetId}.svg`;
        
        // Store asset data
        this.assets.set(assetId, {
            type: 'svg',
            data: svgText,
            filename,
            metadata: { width, height }
        });

        // Create costume object
        const costume = {
            assetId,
            name,
            md5ext: filename,
            dataFormat: 'svg',
            rotationCenterX: width / 2,
            rotationCenterY: height / 2
        };

        // Add to target
        if (this.project.targets[targetIndex]) {
            this.project.targets[targetIndex].costumes.push(costume);
        }

        return { assetId, costume };
    }

    // Read width/height from raw SVG text (attributes first, then viewBox), no DOM.
    svgDimensions(svgText) {
        const wm = svgText.match(/\bwidth\s*=\s*"([\d.]+)/i);
        const hm = svgText.match(/\bheight\s*=\s*"([\d.]+)/i);
        let w = wm ? parseFloat(wm[1]) : 0;
        let h = hm ? parseFloat(hm[1]) : 0;
        if (!w || !h) {
            const vb = svgText.match(/viewBox\s*=\s*"\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
            if (vb) { w = w || parseFloat(vb[1]); h = h || parseFloat(vb[2]); }
        }
        return { width: w || 80, height: h || 80 };
    }

    // Bake a user-supplied SVG in as a named sprite's costume (replacing costume 1).
    // Returns true if the sprite exists. Used by the app's SVG-upload feature.
    applyCustomSVG(spriteName, svgText) {
        const target = this.project.targets.find(t => !t.isStage && t.name === spriteName);
        if (!target) return false;
        const { width, height } = this.svgDimensions(svgText);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svgText, filename: `${assetId}.svg`, metadata: { width, height } });
        const old = target.costumes[0];
        if (old && old.assetId) this.assets.delete(old.assetId);
        target.costumes[0] = {
            assetId, name: 'costume1', md5ext: `${assetId}.svg`, dataFormat: 'svg',
            rotationCenterX: width / 2, rotationCenterY: height / 2
        };
        return true;
    }

    // ===== Decompiler: project blocks -> pseudocode (inverse of the parser) =========

    // Decompile a whole project back into pseudocode.
    decompile(project = this.project) {
        const out = [];
        const stage = project.targets.find(t => t.isStage);
        // STC12 / 8051 device declarations first — they are read before any script.
        // A project that lived through scratch-vm's serializer has lost the
        // top-level key; recover it from the Stage persistence comment.
        if (!project.stc) {
            const recovered = SB3Creator.readStc(project);
            if (recovered) project.stc = recovered;
        }
        if (project.stc) {
            const cfg = project.stc;
            out.push(`DEVICE ${String(cfg.device || 'stc12c5a60s2').toUpperCase()}`);
            out.push(`CLOCK ${cfg.clock || 11059200}`);
            for (const p of cfg.pins || []) {
                out.push(`PIN ${p.name} = ${p.where || `P${p.port}.${p.bit}`} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
            }
            for (const p of cfg.ports || []) {
                out.push(`PORT ${p.name} = P${p.port} ${p.direction.toUpperCase()}${p.activeLow ? ' ACTIVE LOW' : ''}`);
            }
            for (const p of cfg.parts || []) {
                out.push(`PART ${p.name} = 74HC595 data P${p.data.port}.${p.data.bit} clock P${p.clock.port}.${p.clock.bit} latch P${p.latch.port}.${p.latch.bit}${p.activeLow ? ' ACTIVE LOW' : ''}`);
            }
            for (const t of cfg.tables || []) {
                const vals = t.values.map((v) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`);
                out.push(`TABLE ${t.name} = ${vals.join(', ')}`);
            }
            if (cfg.ledcube) out.push(`LEDCUBE ${cfg.ledcube.size}`);
            out.push('');
        }
        for (const v of Object.values(stage.variables || {})) out.push(`GLOBAL ${v[0]}`);
        for (const l of Object.values(stage.lists || {})) out.push(`GLOBAL LIST ${l[0]}`);
        for (const bd of (stage.costumes || []).slice(1)) out.push(`BACKDROP ${bd._spec || bd.name}`);
        for (const snd of (stage.sounds || []).slice(1)) out.push(`SOUND ${snd.name}`);
        if (out.length) out.push('');

        for (const t of project.targets) {
            const scripts = this.decompileTargetScripts(t);
            if (t.isStage) {
                if (scripts.length) {
                    out.push('STAGE:');
                    out.push(...scripts.map(l => (l ? `  ${l}` : l)));
                    out.push('');
                }
            } else {
                out.push(`SPRITE ${t.name}:`);
                if (t.costumes && t.costumes[0] && t.costumes[0]._shapeSpec) out.push(`  SHAPE ${t.costumes[0]._shapeSpec}`);
                for (const v of Object.values(t.variables || {})) out.push(`  LOCAL ${v[0]}`);
                for (const l of Object.values(t.lists || {})) out.push(`  LOCAL LIST ${l[0]}`);
                for (const cos of (t.costumes || []).slice(1)) out.push(`  COSTUME ${cos._spec || cos.name}`);
                for (const snd of (t.sounds || []).slice(1)) out.push(`  SOUND ${snd.name}`);
                out.push(...scripts.map(l => (l ? `  ${l}` : l)));
                out.push('');
            }
        }
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    decompileTargetScripts(target) {
        const blocks = target.blocks || {};
        const lines = [];
        // Reverse-map blockId -> comment text so blocks can re-emit their `# comment`.
        this._blockComments = {};
        for (const c of Object.values(target.comments || {})) if (c && c.blockId) this._blockComments[c.blockId] = c.text;
        const tops = Object.entries(blocks).filter(([, b]) => b.topLevel && !b.shadow);
        for (const [id, b] of tops) {
            const hat = this.decompileHat(b, blocks);
            if (hat === null) continue;
            lines.push(...this.commentLines(id, 0));
            lines.push(hat);
            lines.push(...this.decompileStackFrom(b.next, blocks, 1));
            lines.push('');
        }
        return lines;
    }

    // `# comment` lines (indented to `level`) for a block that carries a comment.
    commentLines(blockId, level) {
        const text = this._blockComments && this._blockComments[blockId];
        if (!text) return [];
        return String(text).split('\n').map(l => `${'  '.repeat(level)}# ${l}`);
    }

    decompileStackFrom(firstId, blocks, level) {
        const lines = [];
        let id = firstId;
        while (id && blocks[id]) {
            lines.push(...this.commentLines(id, level));
            lines.push(...this.decompileStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return lines;
    }

    // Decompile a value input -> pseudocode expression. Compound reporters are wrapped
    // in parens so the result is always a single top-level token.
    dval(input, blocks) {
        if (!Array.isArray(input)) return '';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a] = inner;
            if (type === 10) return `"${a}"`;       // string
            if (type === 11) return `"${a}"`;       // broadcast
            // number (4), color (9), variable (12), list (13) — emit the raw value
            return String(a);
        }
        // block reference (a reporter)
        return `(${this.drep(blocks[inner], blocks)})`;
    }

    // Decompile a reporter block (without outer parens).
    drep(b, blocks) {
        if (!b) return '';
        const v = (k) => this.dval(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'operator_add': return `${v('NUM1')} + ${v('NUM2')}`;
            case 'operator_subtract': return `${v('NUM1')} - ${v('NUM2')}`;
            case 'operator_multiply': return `${v('NUM1')} * ${v('NUM2')}`;
            case 'operator_divide': return `${v('NUM1')} / ${v('NUM2')}`;
            case 'operator_mod': return `${v('NUM1')} mod ${v('NUM2')}`;
            case 'bitops_and': return `${v('NUM1')} bitand ${v('NUM2')}`;
            case 'bitops_or': return `${v('NUM1')} bitor ${v('NUM2')}`;
            case 'bitops_xor': return `${v('NUM1')} bitxor ${v('NUM2')}`;
            case 'bitops_shl': return `${v('NUM1')} shiftleft ${v('NUM2')}`;
            case 'bitops_shr': return `${v('NUM1')} shiftright ${v('NUM2')}`;
            case 'bitops_not': return `bitnot ${v('NUM')}`;
            case 'operator_random': return `pick random ${v('FROM')} to ${v('TO')}`;
            case 'operator_round': return `round ${v('NUM')}`;
            case 'operator_mathop': return `${f('OPERATOR')} of ${v('NUM')}`;
            case 'operator_join': return `${v('STRING1')} join ${v('STRING2')}`;
            case 'operator_letter_of': return `letter ${v('LETTER')} of ${v('STRING')}`;
            case 'operator_length': return `length of ${v('STRING')}`;
            case 'operator_contains': return `${v('STRING1')} contains ${v('STRING2')}`;
            case 'data_itemoflist': return `item ${v('INDEX')} of ${f('LIST')}`;
            case 'data_itemnumoflist': return `item # of ${v('ITEM')} in ${f('LIST')}`;
            case 'data_lengthoflist': return `length of ${f('LIST')}`;
            case 'data_listcontainsitem': return `${f('LIST')} contains ${v('ITEM')}`;
            case 'motion_xposition': return 'x position';
            case 'motion_yposition': return 'y position';
            case 'motion_direction': return 'direction';
            case 'looks_size': return 'size';
            case 'looks_costumenumbername': return `costume ${f('NUMBER_NAME')}`;
            case 'looks_backdropnumbername': return `backdrop ${f('NUMBER_NAME')}`;
            case 'sound_volume': return 'volume';
            case 'sensing_answer': return 'answer';
            case 'sensing_timer': return 'timer';
            case 'sensing_mousex': return 'mouse x';
            case 'sensing_mousey': return 'mouse y';
            case 'sensing_loudness': return 'loudness';
            case 'sensing_username': return 'username';
            case 'sensing_dayssince2000': return 'days since 2000';
            case 'sensing_distanceto': return `distance to ${this.dmenu(b.inputs.DISTANCETOMENU, blocks, 'DISTANCETOMENU')}`;
            case 'sensing_current': return f('CURRENTMENU') === 'DAYOFWEEK' ? 'day of week' : `current ${f('CURRENTMENU').toLowerCase()}`;
            case 'sensing_of': return `${this.dprop(f('PROPERTY'))} of ${this.dmenu(b.inputs.OBJECT, blocks, 'OBJECT')}`;
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return f('VALUE');
            // Planète Maths reporters. Ops with a standard equivalent decompile to
            // standard pseudocode (execution-preserved); the distinctive ones get their
            // own readable phrase that parses back to the extension block.
            case 'planetemaths_add': return `${v('NUM1')} + ${v('NUM2')}`;
            case 'planetemaths_substract': return `${v('NUM1')} - ${v('NUM2')}`;
            case 'planetemaths_multiply': return `${v('NUM1')} * ${v('NUM2')}`;
            case 'planetemaths_divide': return `${v('NUM1')} / ${v('NUM2')}`;
            case 'planetemaths_oppose': return `0 - ${v('NUM1')}`;
            case 'planetemaths_inverse': return `1 / ${v('NUM1')}`;
            case 'planetemaths_pourcent': return `${v('NUM1')} / 100`;
            case 'planetemaths_join': return `${v('STRING1')} join ${v('STRING2')}`;
            case 'planetemaths_letterOf': return `letter ${v('LETTER')} of ${v('STRING')}`;
            case 'planetemaths_length': return `length of ${v('STRING')}`;
            case 'planetemaths_random': return `pick random ${v('NUM1')} to ${v('NUM2')}`;
            case 'planetemaths_pow': return `${v('NUM1')} to the power of ${v('NUM2')}`;
            case 'planetemaths_factorial': return `factorial of ${v('NUM1')}`;
            case 'planetemaths_sommechiffres': return `sum of digits of ${v('NUM1')}`;
            case 'planetemaths_min': return `min of ${v('NUM1')} and ${v('NUM2')}`;
            case 'planetemaths_max': return `max of ${v('NUM1')} and ${v('NUM2')}`;
            case 'planetemaths_nombre_pi': return 'pi';
            case 'planetemaths_nombre_e': return 'euler';
            // Arrays & Vectors reporters (v('NAME') yields the quoted name).
            case 'arrays_get': return `item ${v('INDEX')} of array ${v('NAME')}`;
            case 'arrays_pop': return `pop from array ${v('NAME')}`;
            case 'arrays_length': return `length of array ${v('NAME')}`;
            case 'arrays_sum': return `sum of array ${v('NAME')}`;
            case 'arrays_mean': return `mean of array ${v('NAME')}`;
            case 'arrays_min': return `smallest of array ${v('NAME')}`;
            case 'arrays_max': return `largest of array ${v('NAME')}`;
            case 'arrays_indexOf': return `index of ${v('VALUE')} in array ${v('NAME')}`;
            case 'arrays_reverse': return `reverse of array ${v('NAME')}`;
            case 'arrays_flatten': return `flatten of array ${v('NAME')}`;
            case 'arrays_sort': return `sort of array ${v('NAME')} ${f('ORDER') || 'ascending'}`;
            case 'arrays_slice': return `slice of array ${v('NAME')} from ${v('START')} to ${v('END')}`;
            case 'arrays_toJSON': case 'arrays_toString': return `array ${v('NAME')} as text`;
            case 'arrays_get2D': return `item row ${v('ROW')} col ${v('COL')} of array ${v('NAME')}`;
            case 'arrays_transpose': return `transpose of array ${v('NAME')}`;
            case 'arrays_reshape': return `reshape array ${v('NAME')} to ${this.dval(b.inputs.SHAPE, blocks).replace(/^"|"$/g, '')}`;
            case 'arrays_map': return `map ${this.dval(b.inputs.FUNC, blocks)} over array ${v('NAME')}`;
            case 'arrays_filter': return `filter array ${v('NAME')} by ${this.dval(b.inputs.FUNC, blocks)}`;
            case 'arrays_reduce': return `reduce array ${v('NAME')} with ${this.dval(b.inputs.FUNC, blocks)} from ${v('INIT')}`;
            // STC12 / 8051 pin read (digital level or ADC value).
            case 'stc12_read': return `read ${f('PIN')}`;
            case 'stc12_readport': return `read ${f('PORT')}`;
            case 'stc12_tableindex': return `${f('TABLE')}[${v('INDEX')}]`;
            case 'ledcube_readvoxel': return `voxel ${v('X')} ${v('Y')} ${v('Z')}`;
            // Device reporters
            case 'devices_temperature': return `temperature from ${v('SENSOR')}`;
            case 'devices_light': return `light from ${v('SENSOR')}`;
            case 'devices_servoangle': return `angle of ${v('SERVO')}`;
            case 'devices_distance': return `distance from ${v('SENSOR')}`;
            case 'devices_motorspeed': return `speed of ${v('MOTOR')}`;
            case 'devices_motordirection': return `direction of ${v('MOTOR')}`;
            case 'devices_devicestate': return `state of ${v('DEVICE')}`;
            case 'devices_flex': return `flex of ${v('SENSOR')}`;
            case 'devices_force': return `force on ${v('SENSOR')}`;
            case 'devices_ircode': return `ir code from ${v('SENSOR')}`;
            // circuit extension reporters
            case 'circuit_nodevoltage': return `voltage at ${v('NET')}`;
            case 'circuit_branchcurrent': return `current through ${v('PART')}`;
            case 'circuit_resistance': return `resistance between ${v('A')} and ${v('B')}`;
            case 'circuit_ledbrightness': return `brightness of ${v('PART')}`;
            case 'circuit_buzzertone': return `tone of ${v('PART')}`;
            default: return b.opcode;
        }
    }

    dprop(p) { return p === 'costume #' ? 'costume number' : p === 'backdrop #' ? 'backdrop number' : p; }

    // Decompile a boolean input/block -> condition text.
    dcond(ref, blocks) {
        const b = typeof ref === 'string' ? blocks[ref] : blocks[ref];
        if (!b) return '';
        const v = (k) => this.dval(b.inputs[k], blocks);
        const c = (k) => this.dcond(b.inputs[k][1], blocks);
        switch (b.opcode) {
            case 'operator_gt': return `${v('OPERAND1')} > ${v('OPERAND2')}`;
            case 'operator_lt': return `${v('OPERAND1')} < ${v('OPERAND2')}`;
            case 'operator_equals': return `${v('OPERAND1')} = ${v('OPERAND2')}`;
            case 'operator_and': return `(${c('OPERAND1')}) and (${c('OPERAND2')})`;
            case 'operator_or': return `(${c('OPERAND1')}) or (${c('OPERAND2')})`;
            case 'operator_not': return `not (${c('OPERAND')})`;
            case 'operator_contains': return `${v('STRING1')} contains ${v('STRING2')}`;
            case 'data_listcontainsitem': return `${b.fields.LIST[0]} contains ${v('ITEM')}`;
            case 'sensing_touchingobject': return `touching ${this.dmenu(b.inputs.TOUCHINGOBJECTMENU, blocks, 'TOUCHINGOBJECTMENU')}`;
            case 'sensing_touchingcolor': return `touching color ${v('COLOR')}`;
            case 'sensing_keypressed': return `key ${this.dmenu(b.inputs.KEY_OPTION, blocks, 'KEY_OPTION')} pressed?`;
            case 'sensing_mousedown': return 'mouse down?';
            case 'argument_reporter_boolean': return b.fields.VALUE[0];
            // Planète Maths booleans (semantics from the implementation: gt = NUM1 < NUM2).
            case 'planetemaths_gt': return `${v('NUM1')} < ${v('NUM2')}`;
            case 'planetemaths_gte': return `${v('NUM1')} <= ${v('NUM2')}`;
            case 'planetemaths_lt': return `${v('NUM1')} > ${v('NUM2')}`;
            case 'planetemaths_lte': return `${v('NUM1')} >= ${v('NUM2')}`;
            case 'planetemaths_equals': return `${v('NUM1')} = ${v('NUM2')}`;
            case 'planetemaths_and': return `(${c('OPERAND1')}) and (${c('OPERAND2')})`;
            case 'planetemaths_or': return `(${c('OPERAND1')}) or (${c('OPERAND2')})`;
            case 'planetemaths_not': return `not (${c('OPERAND1')})`;
            case 'planetemaths_contains': return `${v('STRING1')} contains ${v('STRING2')}`;
            case 'planetemaths_multiple': return `${v('NUM1')} is multiple of ${v('NUM2')}`;
            case 'arrays_contains': return `array ${v('NAME')} contains ${v('VALUE')}`;
            // Device predicates
            case 'devices_pressed': return `${v('BUTTON')} pressed?`;
            case 'devices_above': return `${v('SENSOR')} above ${v('THRESHOLD')}`;
            case 'devices_closer': return `${v('SENSOR')} closer than ${v('DISTANCE')}`;
            case 'devices_motion': return `motion detected on ${v('SENSOR')}`;
            case 'devices_tilted': return `${v('SENSOR')} tilted?`;
            case 'devices_energised': return `${v('DEVICE')} energised?`;
            default: return this.drep(b, blocks);
        }
    }

    // Read a dropdown menu shadow's value and map internal names back to pseudocode.
    dmenu(input, blocks, field) {
        if (!Array.isArray(input)) return '';
        const shadow = blocks[input[1]];
        const val = shadow && shadow.fields && shadow.fields[field] ? shadow.fields[field][0] : '';
        const map = { _edge_: 'edge', _mouse_: 'mouse-pointer', _myself_: 'myself', _random_: 'random position', _stage_: 'Stage' };
        return map[val] || val;
    }

    decompileHat(b, blocks) {
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const v = (k) => this.dval(b.inputs[k], blocks);
        switch (b.opcode) {
            case 'event_whenflagclicked': return 'WHEN flag clicked:';
            case 'event_whenkeypressed': return `WHEN ${f('KEY_OPTION')} key pressed:`;
            case 'event_whenthisspriteclicked': return 'WHEN sprite clicked:';
            case 'event_whenbroadcastreceived': return `WHEN I receive "${f('BROADCAST_OPTION')}":`;
            case 'control_start_as_clone': return 'WHEN I start as a clone:';
            case 'stc12_whenpin': return `WHEN ${f('PIN')} ${f('EDGE')}:`;
            case 'devices_whenabove': return `WHEN ${v('SENSOR')} above ${v('THRESHOLD')}:`;
            case 'devices_whencloser': return `WHEN ${v('SENSOR')} closer than ${v('DISTANCE')}:`;
            case 'devices_whenmotion': return `WHEN motion on ${v('SENSOR')}:`;
            case 'devices_whentilted': return `WHEN ${v('SENSOR')} tilted:`;
            case 'devices_whenirreceived': return `WHEN IR received on ${v('SENSOR')}:`;
            case 'procedures_definition': {
                const proto = blocks[b.inputs.custom_block[1]];
                const m = proto.mutation;
                const names = JSON.parse(m.argumentnames || '[]');
                let ai = 0;
                const sig = m.proccode.replace(/%[sb]/g, (tok) => {
                    const nm = names[ai++];
                    return tok === '%b' ? `<${nm}>` : `(${nm})`;
                });
                return `DEFINE ${m.warp === 'true' ? 'FAST ' : ''}${sig}:`;
            }
            default: return null;
        }
    }

    // Decompile a stack block (and any nested substacks) into pseudocode lines.
    decompileStackBlock(b, blocks, level) {
        const pad = '  '.repeat(level);
        const v = (k) => this.dval(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const sub = (k, lvl) => (b.inputs[k] ? this.decompileStackFrom(b.inputs[k][1], blocks, lvl) : []);
        const line = (txt) => [pad + txt];

        switch (b.opcode) {
            // ---- control structures ----
            case 'control_forever': return [pad + 'FOREVER:', ...sub('SUBSTACK', level + 1)];
            case 'control_repeat': return [pad + `REPEAT ${v('TIMES')}:`, ...sub('SUBSTACK', level + 1)];
            case 'control_repeat_until': return [pad + `REPEAT UNTIL ${this.dcond(b.inputs.CONDITION[1], blocks)}:`, ...sub('SUBSTACK', level + 1)];
            case 'control_if': return [pad + `IF ${this.dcond(b.inputs.CONDITION[1], blocks)} THEN:`, ...sub('SUBSTACK', level + 1)];
            case 'control_if_else': return [
                pad + `IF ${this.dcond(b.inputs.CONDITION[1], blocks)} THEN:`, ...sub('SUBSTACK', level + 1),
                pad + 'ELSE:', ...sub('SUBSTACK2', level + 1)
            ];
            case 'control_wait': return line(`wait ${v('DURATION')} seconds`);
            case 'control_wait_until': return line(`wait until ${this.dcond(b.inputs.CONDITION[1], blocks)}`);
            case 'control_stop': return line(f('STOP_OPTION') === 'all' ? 'stop all' : f('STOP_OPTION') === 'this script' ? 'stop this script' : 'stop other scripts in sprite');
            case 'control_create_clone_of': return line(`create clone of ${this.dmenu(b.inputs.CLONE_OPTION, blocks, 'CLONE_OPTION')}`);
            case 'control_delete_this_clone': return line('delete this clone');
            // ---- motion ----
            case 'motion_movesteps': return line(`move ${v('STEPS')} steps`);
            case 'motion_turnright': return line(`turn right ${v('DEGREES')} degrees`);
            case 'motion_turnleft': return line(`turn left ${v('DEGREES')} degrees`);
            case 'motion_gotoxy': return line(`go to x: ${v('X')} y: ${v('Y')}`);
            case 'motion_glidesecstoxy': return line(`glide ${v('SECS')} secs to x: ${v('X')} y: ${v('Y')}`);
            case 'motion_glideto': return line(`glide ${v('SECS')} secs to ${this.dmenu(b.inputs.TO, blocks, 'TO')}`);
            case 'motion_goto': return line(`go to ${this.dmenu(b.inputs.TO, blocks, 'TO')}`);
            case 'motion_changexby': return line(`change x by ${v('DX')}`);
            case 'motion_changeyby': return line(`change y by ${v('DY')}`);
            case 'motion_setx': return line(`set x to ${v('X')}`);
            case 'motion_sety': return line(`set y to ${v('Y')}`);
            case 'motion_pointindirection': return line(`point in direction ${v('DIRECTION')}`);
            case 'motion_pointtowards': return line(`point towards ${this.dmenu(b.inputs.TOWARDS, blocks, 'TOWARDS')}`);
            case 'motion_ifonedgebounce': return line('if on edge bounce');
            case 'motion_setrotationstyle': return line(`set rotation style ${f('STYLE')}`);
            // ---- looks ----
            case 'looks_sayforsecs': return line(`say ${v('MESSAGE')} for ${v('SECS')} seconds`);
            case 'looks_say': return line(`say ${v('MESSAGE')}`);
            case 'looks_thinkforsecs': return line(`think ${v('MESSAGE')} for ${v('SECS')} seconds`);
            case 'looks_think': return line(`think ${v('MESSAGE')}`);
            case 'looks_show': return line('show');
            case 'looks_hide': return line('hide');
            case 'looks_switchcostumeto': {
                const inp = b.inputs.COSTUME;
                if (Array.isArray(inp) && inp[0] === 3) return line(`switch costume to (${this.drep(blocks[inp[1]], blocks)})`);
                return line(`switch costume to ${this.dmenu(inp, blocks, 'COSTUME')}`);
            }
            case 'looks_nextcostume': return line('next costume');
            case 'looks_switchbackdropto': return line(`switch backdrop to ${this.dmenu(b.inputs.BACKDROP, blocks, 'BACKDROP')}`);
            case 'looks_nextbackdrop': return line('next backdrop');
            case 'looks_changesizeby': return line(`change size by ${v('CHANGE')}`);
            case 'looks_setsizeto': return line(`set size to ${v('SIZE')}`);
            case 'looks_changeeffectby': return line(`change ${f('EFFECT').toLowerCase()} effect by ${v('CHANGE')}`);
            case 'looks_seteffectto': return line(`set ${f('EFFECT').toLowerCase()} effect to ${v('VALUE')}`);
            case 'looks_cleargraphiceffects': return line('clear graphic effects');
            case 'looks_gotofrontback': return line(f('FRONT_BACK') === 'back' ? 'go to back' : 'go to front');
            case 'looks_goforwardbackwardlayers': return line(`go ${f('FORWARD_BACKWARD')} ${v('NUM')} layers`);
            // ---- sound / pen / sensing / music ----
            case 'sound_playuntildone': return line(`play sound ${v('SOUND_MENU')} until done`);
            case 'sound_play': return line(`play sound ${v('SOUND_MENU')}`);
            case 'sound_stopallsounds': return line('stop all sounds');
            case 'sound_changevolumeby': return line(`change volume by ${v('VOLUME')}`);
            case 'sound_setvolumeto': return line(`set volume to ${v('VOLUME')}`);
            case 'pen_clear': return line('clear');
            case 'pen_stamp': return line('stamp');
            case 'pen_penDown': return line('pen down');
            case 'pen_penUp': return line('pen up');
            case 'pen_setPenColorToColor': return line(`set pen color to ${v('COLOR')}`);
            case 'pen_changePenColorParamBy': return line(`change pen ${this.dmenu(b.inputs.COLOR_PARAM, blocks, 'colorParam')} by ${v('VALUE')}`);
            case 'pen_setPenColorParamTo': return line(`set pen ${this.dmenu(b.inputs.COLOR_PARAM, blocks, 'colorParam')} to ${v('VALUE')}`);
            case 'pen_changePenSizeBy': return line(`change pen size by ${v('SIZE')}`);
            case 'pen_setPenSizeTo': return line(`set pen size to ${v('SIZE')}`);
            case 'sensing_askandwait': return line(`ask ${v('QUESTION')} and wait`);
            case 'sensing_resettimer': return line('reset timer');
            case 'sensing_setdragmode': return line(`set drag mode ${f('DRAG_MODE')}`);
            case 'music_playNoteForBeats': return line(`play note ${v('NOTE')} for ${v('BEATS')} beats`);
            case 'music_playDrumForBeats': return line(`play drum ${this.dmenu(b.inputs.DRUM, blocks, 'DRUM')} for ${v('BEATS')} beats`);
            case 'music_restForBeats': return line(`rest for ${v('BEATS')} beats`);
            case 'music_setTempo': return line(`set tempo to ${v('TEMPO')}`);
            case 'music_changeTempo': return line(`change tempo by ${v('TEMPO')}`);
            // ---- data ----
            case 'data_setvariableto': return line(`set ${f('VARIABLE')} to ${v('VALUE')}`);
            case 'data_changevariableby': return line(`change ${f('VARIABLE')} by ${v('VALUE')}`);
            case 'data_addtolist': return line(`add ${v('ITEM')} to ${f('LIST')}`);
            case 'data_deleteoflist': return line(`delete ${v('INDEX')} of ${f('LIST')}`);
            case 'data_deletealloflist': return line(`delete all of ${f('LIST')}`);
            case 'data_insertatlist': return line(`insert ${v('ITEM')} at ${v('INDEX')} of ${f('LIST')}`);
            case 'data_replaceitemoflist': return line(`replace item ${v('INDEX')} of ${f('LIST')} with ${v('ITEM')}`);
            // Arrays & Vectors commands (v('NAME') yields the quoted name).
            case 'arrays_create1D': return line(`new array ${v('NAME')} = ${this.dval(b.inputs.JSON, blocks).replace(/^"|"$/g, '')}`);
            case 'arrays_create2D': return line(`new 2D array ${v('NAME')} = ${this.dval(b.inputs.JSON, blocks).replace(/^"|"$/g, '')}`);
            case 'arrays_set2D': return line(`set item row ${v('ROW')} col ${v('COL')} of array ${v('NAME')} to ${v('VALUE')}`);
            case 'arrays_createEmpty': return line(`new array ${v('NAME')}`);
            case 'arrays_createRange': return line(`new array ${v('NAME')} = range ${v('START')} to ${v('END')}`);
            case 'arrays_push': return line(`push ${v('VALUE')} to array ${v('NAME')}`);
            case 'arrays_set': return line(`set item ${v('INDEX')} of array ${v('NAME')} to ${v('VALUE')}`);
            case 'arrays_insert': return line(`insert ${v('VALUE')} at ${v('INDEX')} of array ${v('NAME')}`);
            case 'arrays_remove': return line(`remove item ${v('INDEX')} of array ${v('NAME')}`);
            case 'arrays_delete': return line(`delete array ${v('NAME')}`);
            // ---- STC12 / 8051 pins ----
            case 'stc12_setpin': {
                const state = f('STATE');
                return line(state === 'on' || state === 'off' ? `turn ${state} ${f('PIN')}` : `set ${f('PIN')} ${state}`);
            }
            case 'stc12_writepin': return line(`set ${f('PIN')} to ${v('VALUE')}`);
            case 'stc12_toggle': return line(`toggle ${f('PIN')}`);
            case 'stc12_setpwm': return line(`set ${f('PIN')} to ${v('VALUE')} percent`);
            case 'stc12_settone': return line(`set ${f('PIN')} to ${v('VALUE')} hz`);
            case 'stc12_setport': return line(`set ${f('PORT')} to ${v('VALUE')}`);
            case 'stc12_setpart': return line(`set ${f('PART')} to ${v('VALUE')}`);
            case 'stc12_print': {
                const mode = f('MODE');
                if (mode === 'text') return line(`print "${this.dval(b.inputs.VALUE, blocks).replace(/^"|"$/g, '')}"`);
                return line(`print ${v('VALUE')}`);
            }
            // circuit extension commands
            case 'circuit_setcontrol': return line(`set control ${v('CONTROL')} to ${v('VALUE')}`);
            case 'circuit_setpower': return line(`turn power ${f('STATE')}`);
            // Device convenience blocks
            case 'devices_showdigit': return line(`show digit ${v('DIGIT')} on ${v('DISPLAY')}`);
            case 'devices_setrgb': return line(`set ${v('LED')} colour to R ${v('R')} G ${v('G')} B ${v('B')}`);
            case 'devices_setservo': return line(`set ${v('SERVO')} angle to ${v('ANGLE')}`);
            case 'devices_setmotor': return line(`set ${v('MOTOR')} speed to ${v('SPEED')}`);
            case 'devices_setrelay': return line(`set relay ${v('RELAY')} ${f('STATE')}`);
            case 'devices_setdirection': return line(`set ${v('MOTOR')} direction ${f('DIR')}`);
            case 'devices_activate': return line(`activate ${v('DEVICE')}`);
            case 'devices_deactivate': return line(`deactivate ${v('DEVICE')}`);
            case 'devices_lcdprint': return line(`lcd print ${v('TEXT')} on ${v('DISPLAY')}`);
            case 'devices_lcdcursor': return line(`lcd set cursor ${v('ROW')} ${v('COL')} on ${v('DISPLAY')}`);
            case 'devices_lcdclear': return line(`lcd clear ${v('DISPLAY')}`);
            case 'devices_setpixel': return line(`set pixel ${v('X')} ${v('Y')} to ${v('BRIGHTNESS')} on ${v('MATRIX')}`);
            case 'devices_clearmatrix': return line(`clear matrix ${v('MATRIX')}`);
            case 'devices_setneopixel': return line(`set neopixel ${v('INDEX')} to R ${v('R')} G ${v('G')} B ${v('B')} on ${v('STRIP')}`);
            case 'devices_clearneopixels': return line(`clear neopixels on ${v('STRIP')}`);
            // LED cube commands
            case 'ledcube_setvoxel': return line(`set voxel ${v('X')} ${v('Y')} ${v('Z')} to ${v('COLOUR')}`);
            case 'ledcube_clearvoxel': return line(`clear voxel ${v('X')} ${v('Y')} ${v('Z')}`);
            case 'ledcube_filllayer': return line(`fill layer ${v('LAYER')} with ${v('COLOUR')}`);
            case 'ledcube_clear': return line('clear cube');
            case 'ledcube_shift': return line(`shift cube ${f('DIR')}`);
            case 'ledcube_hold': return line(`hold frame for ${v('DURATION')} ms`);
            case 'ledcube_fillcolumn': return line(`fill column ${v('X')} ${v('Y')} with ${v('COLOUR')}`);
            case 'ledcube_fillwall': return line(`fill wall ${v('Z')} with ${v('COLOUR')}`);
            case 'ledcube_invert': return line('invert cube');
            case 'data_showlist': return line(`show list ${f('LIST')}`);
            case 'data_hidelist': return line(`hide list ${f('LIST')}`);
            case 'data_showvariable': return line(`show variable ${f('VARIABLE')}`);
            case 'data_hidevariable': return line(`hide variable ${f('VARIABLE')}`);
            // ---- broadcasts ----
            case 'event_broadcast': return line(`broadcast ${this.dbroadcast(b.inputs.BROADCAST_INPUT)}`);
            case 'event_broadcastandwait': return line(`broadcast ${this.dbroadcast(b.inputs.BROADCAST_INPUT)} and wait`);
            // ---- custom block calls ----
            case 'procedures_call': {
                const m = b.mutation;
                const argIds = JSON.parse(m.argumentids || '[]');
                let ai = 0;
                const text = m.proccode.replace(/%[sb]/g, (tok) => {
                    const input = b.inputs[argIds[ai++]];
                    if (tok === '%b') return `(${this.dcond(input[1], blocks)})`;
                    return this.dval(input, blocks);
                });
                return line(text);
            }
            default: return line(`# unsupported: ${b.opcode}`);
        }
    }

    dbroadcast(input) {
        if (Array.isArray(input) && Array.isArray(input[1]) && input[1][0] === 11) return `"${input[1][1]}"`;
        return '"message1"';
    }

    // ---- Python code generation (blocks -> readable Python 3) --------------------
    // Phase 1 of multi-target codegen (see PLAN §22): the algorithmic subset
    // (variables, math, loops, if/else, lists, say->print, ask->input) emits
    // runnable Python; sprite/graphics blocks are emitted as `# ...` comments.
    isHat(op) {
        return ['event_whenflagclicked', 'event_whenkeypressed', 'event_whenthisspriteclicked',
            'event_whenbroadcastreceived', 'control_start_as_clone', 'procedures_definition',
            'stc12_whenpin',
            'devices_whenabove', 'devices_whencloser', 'devices_whenmotion',
            'devices_whentilted', 'devices_whenirreceived'].includes(op);
    }

    pyName(name) {
        if (!this._pyNames) this._pyNames = new Map();
        if (this._pyNames.has(name)) return this._pyNames.get(name);
        const id = sanitizeIdent(name);
        const used = new Set(this._pyNames.values());
        let final = id, n = 2;
        while (used.has(final)) final = id + '_' + n++;
        this._pyNames.set(name, final);
        return final;
    }

    pyProcName(proccode) {
        return this.pyName('do_' + proccode.replace(/%[sb]/g, '').trim());
    }

    pyStr(s) { return JSON.stringify(String(s)); }

    pyVal(input, blocks) {
        if (!Array.isArray(input)) return 'None';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a] = inner;
            if (type === 10 || type === 11) {
                return /^-?\d+(\.\d+)?$/.test(String(a)) ? String(a) : this.pyStr(a);
            }
            if (type === 12 || type === 13) return this.varRef(a);
            return /^-?\d+(\.\d+)?$/.test(String(a)) ? String(a) : this.pyStr(a);
        }
        return this.pyRep(blocks[inner], blocks);
    }

    pyMathop(op, x) {
        const need = ['floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'e ^', '10 ^'];
        if (need.includes(op)) this._pyUses.math = true;
        const m = {
            abs: `abs(${x})`, floor: `math.floor(${x})`, ceiling: `math.ceil(${x})`, sqrt: `math.sqrt(${x})`,
            sin: `math.sin(math.radians(${x}))`, cos: `math.cos(math.radians(${x}))`, tan: `math.tan(math.radians(${x}))`,
            ln: `math.log(${x})`, log: `math.log10(${x})`, 'e ^': `math.exp(${x})`, '10 ^': `(10 ** (${x}))`
        };
        return m[op] || `abs(${x})`;
    }

    pyRep(b, blocks) {
        if (!b) return 'None';
        const v = (k) => this.pyVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'operator_add': return `(${v('NUM1')} + ${v('NUM2')})`;
            case 'operator_subtract': return `(${v('NUM1')} - ${v('NUM2')})`;
            case 'operator_multiply': return `(${v('NUM1')} * ${v('NUM2')})`;
            case 'operator_divide': return `(${v('NUM1')} / ${v('NUM2')})`;
            case 'operator_mod': return `(${v('NUM1')} % ${v('NUM2')})`;
            case 'bitops_and': return `(int(${v('NUM1')}) & int(${v('NUM2')}))`;
            case 'bitops_or': return `(int(${v('NUM1')}) | int(${v('NUM2')}))`;
            case 'bitops_xor': return `(int(${v('NUM1')}) ^ int(${v('NUM2')}))`;
            case 'bitops_shl': return `(int(${v('NUM1')}) << int(${v('NUM2')}))`;
            case 'bitops_shr': return `(int(${v('NUM1')}) >> int(${v('NUM2')}))`;
            case 'bitops_not': return `(~int(${v('NUM')}))`;
            case 'operator_random': this._pyUses.random = true; return `random.randint(${v('FROM')}, ${v('TO')})`;
            case 'operator_round': return `round(${v('NUM')})`;
            case 'operator_mathop': return this.pyMathop(f('OPERATOR'), v('NUM'));
            case 'operator_join': return `(str(${v('STRING1')}) + str(${v('STRING2')}))`;
            case 'operator_letter_of': return `str(${v('STRING')})[int(${v('LETTER')}) - 1]`;
            case 'operator_length': return `len(str(${v('STRING')}))`;
            case 'operator_contains': return `(str(${v('STRING2')}) in str(${v('STRING1')}))`;
            case 'data_itemoflist': return `${this.varRef(f('LIST'))}[int(${v('INDEX')}) - 1]`;
            case 'data_lengthoflist': return `len(${this.varRef(f('LIST'))})`;
            case 'data_listcontainsitem': return `(${v('ITEM')} in ${this.varRef(f('LIST'))})`;
            case 'sensing_answer': this._pyUses.answer = true; return 'answer';
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return this.pyName(f('VALUE'));
            // Planète Maths extension (id `planetemaths`) — pure math, maps 1:1.
            case 'planetemaths_add': return `(${v('NUM1')} + ${v('NUM2')})`;
            case 'planetemaths_substract': return `(${v('NUM1')} - ${v('NUM2')})`;
            case 'planetemaths_multiply': return `(${v('NUM1')} * ${v('NUM2')})`;
            case 'planetemaths_divide': return `(${v('NUM1')} / ${v('NUM2')})`;
            case 'planetemaths_pow': return `(${v('NUM1')} ** ${v('NUM2')})`;
            case 'planetemaths_oppose': return `(0 - ${v('NUM1')})`;
            case 'planetemaths_inverse': return `(1 / ${v('NUM1')})`;
            case 'planetemaths_pourcent': return `(${v('NUM1')} / 100)`;
            case 'planetemaths_nombre_pi': this._pyUses.math = true; return 'math.pi';
            case 'planetemaths_nombre_e': this._pyUses.math = true; return 'math.e';
            case 'planetemaths_factorial': this._pyUses.math = true; return `math.factorial(int(${v('NUM1')}))`;
            case 'planetemaths_min': return `min(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_max': return `max(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_random': this._pyUses.random = true; return `random.randint(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_join': return `(str(${v('STRING1')}) + str(${v('STRING2')}))`;
            case 'planetemaths_letterOf': return `str(${v('STRING')})[int(${v('LETTER')}) - 1]`;
            case 'planetemaths_length': return `len(str(${v('STRING')}))`;
            case 'planetemaths_sommechiffres': this._pyUses.sumdigits = true; return `_sumdigits(${v('NUM1')})`;
            // Arrays & Vectors reporters (0-based; `_arrays` registry).
            // Scratch-runtime reporters (x position, mouse x, timer, …) -> scratch.<method>().
            default: {
                const ac = this.arraysCall(b, blocks, this.pyVal);
                if (ac) return ac.call;
                const sc = this.scratchCall(b, blocks, this.pyVal);
                if (sc) return sc.call;
                const rc = this.runtimeCall(b, blocks, v);   // pluggable runtime/hardware extensions
                if (rc) return rc.call;
                return 'None';
            }
        }
    }

    pyCond(ref, blocks) {
        const b = blocks[ref];
        if (!b) return 'False';
        const v = (k) => this.pyVal(b.inputs[k], blocks);
        const c = (k) => this.pyCond(b.inputs[k][1], blocks);
        switch (b.opcode) {
            case 'operator_gt': return `(${v('OPERAND1')} > ${v('OPERAND2')})`;
            case 'operator_lt': return `(${v('OPERAND1')} < ${v('OPERAND2')})`;
            case 'operator_equals': this._pyUses.eq = true; return `_eq(${v('OPERAND1')}, ${v('OPERAND2')})`;
            case 'operator_and': return `(${c('OPERAND1')} and ${c('OPERAND2')})`;
            case 'operator_or': return `(${c('OPERAND1')} or ${c('OPERAND2')})`;
            case 'operator_not': return `(not ${c('OPERAND')})`;
            case 'operator_contains': return `(str(${v('STRING2')}) in str(${v('STRING1')}))`;
            case 'data_listcontainsitem': return `(${v('ITEM')} in ${this.varRef(b.fields.LIST[0])})`;
            case 'argument_reporter_boolean': return this.pyName(b.fields.VALUE[0]);
            // Planète Maths booleans — semantics from the implementation (opcode names
            // are internal misnomers: `gt` computes compare<0, i.e. NUM1 < NUM2).
            case 'planetemaths_gt': return `(${v('NUM1')} < ${v('NUM2')})`;
            case 'planetemaths_gte': return `(${v('NUM1')} <= ${v('NUM2')})`;
            case 'planetemaths_lt': return `(${v('NUM1')} > ${v('NUM2')})`;
            case 'planetemaths_lte': return `(${v('NUM1')} >= ${v('NUM2')})`;
            case 'planetemaths_equals': this._pyUses.eq = true; return `_eq(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_and': return `(${c('OPERAND1')} and ${c('OPERAND2')})`;
            case 'planetemaths_or': return `(${c('OPERAND1')} or ${c('OPERAND2')})`;
            case 'planetemaths_not': return `(not ${c('OPERAND1')})`;
            case 'planetemaths_contains': return `(str(${v('STRING2')}) in str(${v('STRING1')}))`;
            case 'planetemaths_multiple': this._pyUses.multiple = true; return `_multiple(${v('NUM1')}, ${v('NUM2')})`;
            // Scratch-runtime predicates (touching, key pressed?, mouse down?) -> scratch.<method>().
            default: {
                const ac = this.arraysCall(b, blocks, this.pyVal);
                if (ac) return ac.call;
                const sc = this.scratchCall(b, blocks, this.pyVal);
                if (sc) return sc.call;
                const rc = this.runtimeCall(b, blocks, v);
                if (rc) return rc.call;
                return 'False';
            }
        }
    }

    // Project-wide blockId -> comment text map for codegen. Block ids are unique
    // across targets, so one merged map is safe.
    _buildCodeComments(targets) {
        this._codeComments = {};
        for (const t of targets || []) {
            for (const c of Object.values(t.comments || {})) {
                if (c && c.blockId) this._codeComments[c.blockId] = c.text;
            }
        }
    }

    // `#` / `//` comment lines (indented to `pad`) for a block carrying a Scratch
    // block comment, so a native comment survives blocks -> Python/JS. Mirrors the
    // decompiler's commentLines(); reads the project-wide _codeComments map built
    // in generatePython/generateJavaScript.
    codeCommentLines(blockId, pad, marker) {
        if (this._emitComments === false) return [];
        const text = this._codeComments && this._codeComments[blockId];
        if (!text) return [];
        return String(text).split('\n').map((l) => `${pad}${marker} ${l}`);
    }

    pyStackFrom(firstId, blocks, level) {
        const lines = [];
        let id = firstId;
        const pad = '    '.repeat(level);
        while (id && blocks[id]) {
            lines.push(...this.codeCommentLines(id, pad, '#'));
            lines.push(...this.pyStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return lines;
    }

    pyStackBlock(b, blocks, level) {
        const pad = '    '.repeat(level);
        const v = (k) => this.pyVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        // A Python block needs a real statement; a body of only `# comments`
        // (sprite ops we don't run) still needs a `pass`.
        const body = (k) => {
            const s = b.inputs[k] ? this.pyStackFrom(b.inputs[k][1], blocks, level + 1) : [];
            const real = s.some((l) => { const t = l.trim(); return t && !t.startsWith('#'); });
            return real ? s : [...s, pad + '    pass'];
        };
        const line = (t) => [pad + t];
        switch (b.opcode) {
            case 'control_forever': return [pad + 'while True:', ...body('SUBSTACK')];
            case 'control_repeat': return [pad + `for _ in range(int(${v('TIMES')})):`, ...body('SUBSTACK')];
            case 'control_repeat_until': return [pad + `while not (${this.pyCond(b.inputs.CONDITION[1], blocks)}):`, ...body('SUBSTACK')];
            case 'control_if': return [pad + `if ${this.pyCond(b.inputs.CONDITION[1], blocks)}:`, ...body('SUBSTACK')];
            case 'control_if_else': return [pad + `if ${this.pyCond(b.inputs.CONDITION[1], blocks)}:`, ...body('SUBSTACK'), pad + 'else:', ...body('SUBSTACK2')];
            case 'control_wait': this._pyUses.time = true; return line(`time.sleep(${v('DURATION')})`);
            case 'control_wait_until': return [pad + `while not (${this.pyCond(b.inputs.CONDITION[1], blocks)}):`, pad + '    pass'];
            // 'this script' -> return (halts the Python function); 'all'/'other' -> scratch.stop().
            case 'control_stop': return f('STOP_OPTION') === 'this script' ? line('return') : line(this.scratchCall(b, blocks, this.pyVal).call);
            case 'sensing_askandwait': this._pyUses.answer = true; return line(`answer = input(str(${v('QUESTION')}) + " ")`);
            case 'data_setvariableto': return line(`${this.varRef(f('VARIABLE'))} = ${v('VALUE')}`);
            case 'data_changevariableby': return line(`${this.varRef(f('VARIABLE'))} += ${v('VALUE')}`);
            case 'data_addtolist': return line(`${this.varRef(f('LIST'))}.append(${v('ITEM')})`);
            case 'data_deleteoflist': return line(`del ${this.varRef(f('LIST'))}[int(${v('INDEX')}) - 1]`);
            case 'data_deletealloflist': return line(`${this.varRef(f('LIST'))}.clear()`);
            case 'data_insertatlist': return line(`${this.varRef(f('LIST'))}.insert(int(${v('INDEX')}) - 1, ${v('ITEM')})`);
            case 'data_replaceitemoflist': return line(`${this.varRef(f('LIST'))}[int(${v('INDEX')}) - 1] = ${v('ITEM')}`);
            // Arrays & Vectors extension (id `arrays`) — a named-array registry (`_arrays`),
            // 0-based indexing (matches the extension). Command blocks:
            case 'procedures_call': {
                const m = b.mutation;
                const argIds = JSON.parse(m.argumentids || '[]');
                let ai = 0; const args = [];
                m.proccode.replace(/%[sb]/g, (tok) => {
                    const input = b.inputs[argIds[ai++]];
                    args.push(tok === '%b' ? this.pyCond(input[1], blocks) : this.pyVal(input, blocks));
                    return '';
                });
                const fn = this.pyName(this._curPrefix + this.pyProcRaw(m.proccode));
                return line(`${this._async ? 'await ' : ''}${fn}(${args.join(', ')})`);
            }
            default: {
                const ac = this.arraysCall(b, blocks, this.pyVal);
                if (ac) return line(ac.call);
                const sc = this.scratchCall(b, blocks, this.pyVal);   // motion/looks/sensing/pen/… -> scratch.<method>()
                if (sc) return line(sc.call);
                const rc = this.runtimeCall(b, blocks, v);   // pluggable runtime/hardware commands
                if (rc) return line(rc.call);
                const ps = (this.decompileStackBlock(b, blocks, 0)[0] || b.opcode).trim();
                return line(`# ${ps}`);
            }
        }
    }

    pyAssigned(firstId, blocks, acc) {
        let id = firstId;
        while (id && blocks[id]) {
            const b = blocks[id];
            if (b.opcode === 'data_setvariableto' || b.opcode === 'data_changevariableby') acc.add(b.fields.VARIABLE[0]);
            if (b.opcode === 'sensing_askandwait') acc.add('\u0000answer');
            for (const k of ['SUBSTACK', 'SUBSTACK2']) if (b.inputs[k]) this.pyAssigned(b.inputs[k][1], blocks, acc);
            id = b.next;
        }
        return acc;
    }

    pyHatName(b) {
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'event_whenflagclicked': return 'when_flag_clicked';
            case 'event_whenkeypressed': return this.pyName('when_' + f('KEY_OPTION') + '_key');
            case 'event_whenthisspriteclicked': return 'when_clicked';
            case 'event_whenbroadcastreceived': return this.pyName('on_' + f('BROADCAST_OPTION'));
            case 'control_start_as_clone': return 'when_clone_starts';
            default: return this.pyName('handler');
        }
    }

    pyFunc(header, firstId, blocks, argNames) {
        if (this._async) header = 'async ' + header;   // await runtime/hardware calls
        const assigned = this.pyAssigned(firstId, blocks, new Set());
        const globals = [];
        for (const a of assigned) {
            if (a === '\u0000answer') { globals.push('answer'); this._pyUses.answer = true; }
            else { const nm = this.varRef(a); if (!argNames.includes(nm)) globals.push(nm); }
        }
        const bodyLines = this.pyStackFrom(firstId, blocks, 1);
        const out = [header];
        if (globals.length) out.push('    global ' + [...new Set(globals)].join(', '));
        out.push(...bodyLines);
        // Ensure a real statement (a `global` line counts; a body of only comments does not).
        const hasStmt = globals.length > 0 || bodyLines.some((l) => { const t = l.trim(); return t && !t.startsWith('#'); });
        if (!hasStmt) out.push('    pass');
        return out.join('\n');
    }

    // ---- scratch-runtime shim helpers (shared by Python + JS codegen) -----------
    // Prefix-aware variable/list reference: sprite-local names are prefixed `s<idx>_`
    // (so same-named locals in different sprites stay distinct in the flat module);
    // globals (Stage) and anything else use their plain sanitized name.
    varRef(name) {
        if (this._curLocals && this._curLocals.has(name)) return this._curPrefix + this.pyName(name);
        return this.pyName(name);
    }

    scratchCall(b, blocks, valFn) { return this.runtimeObjCall(b, blocks, valFn, OP_TO_SCRATCH, 'scratch'); }
    arraysCall(b, blocks, valFn) {
        if (!OP_TO_ARRAYS[b.opcode]) return null;
        if (this._pyUses) { this._pyUses.arrays = true; this._pyUses.json = true; }
        if (this._jsUses) this._jsUses.arrays = true;
        return this.runtimeObjCall(b, blocks, valFn, OP_TO_ARRAYS, '_arrays');
    }

    // Build an `<obj>.<method>(args)` call for a block from a reversible-op table, or null.
    // `valFn` is pyVal or jsVal (value inputs); menu/field args become string literals,
    // broadcasts pass through quoted. Used for both `scratch` and the `_arrays` registry.
    runtimeObjCall(b, blocks, valFn, table, obj) {
        const e = table[b.opcode];
        if (!e) return null;
        const args = e.gen.map((g) => {
            if (g.v) return valFn.call(this, b.inputs[g.v], blocks);
            // A menu input can be obscured by a reporter (e.g. `switch costume to (join …)`);
            // then emit the expression, otherwise the dropdown value as a string literal.
            if (g.m) {
                const inp = b.inputs[g.m];
                if (Array.isArray(inp) && inp[0] === 3) return valFn.call(this, inp, blocks);
                return this.pyStr(this.dmenu(inp, blocks, g.field || g.m));
            }
            if (g.f) return this.pyStr(b.fields[g.f] ? b.fields[g.f][0] : '');
            if (g.bc) return this.dbroadcast(b.inputs[g.bc]);
            return 'None';
        });
        return { kind: e.kind || 'command', call: `${obj}.${e.m}(${args.join(', ')})` };
    }

    // A guaranteed-unique sanitized identifier (unlike pyName, which memoizes by input, so
    // two same-named hats — e.g. a sprite with two `when flag clicked` — would collide).
    pyFreshName(base) {
        let id = String(base).replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'f';
        if (/^[0-9]/.test(id)) id = 'v_' + id;
        const used = new Set(this._pyNames.values());
        let final = id, n = 2;
        while (used.has(final)) final = id + '_' + n++;
        this._pyNames.set(Symbol(base), final);   // reserve the value (Symbol key never matches a name lookup)
        return final;
    }

    // Custom-block base name (unprefixed) and hat base name — used with the sprite prefix.
    pyProcRaw(proccode) { return 'do_' + String(proccode).replace(/%[sb]/g, '').trim(); }
    pyHatBase(b) {
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'event_whenflagclicked': return 'when_flag_clicked';
            case 'event_whenkeypressed': return 'when_' + f('KEY_OPTION') + '_key';
            case 'event_whenthisspriteclicked': return 'when_clicked';
            case 'event_whenbroadcastreceived': return 'on_' + f('BROADCAST_OPTION');
            case 'control_start_as_clone': return 'when_clone_starts';
            default: return 'handler';
        }
    }

    // DEVICE / CLOCK / PIN as reversible marker calls. Without these the Python
    // and JavaScript targets emitted the pin-driver shim and the setPin() calls
    // but nothing that says what the pins ARE, so a hardware project came back
    // from either of them with `_stc12` as a variable and no pins at all.
    stcStructMarkers(project) {
        const stc = project && project.stc;
        if (!stc || !stc.pins || !stc.pins.length) return [];
        const q = (v) => this.pyStr(v);
        const lines = [`scratch.device(${q(stc.device)}, ${stc.clock})`];
        for (const pin of stc.pins) {
            lines.push(`scratch.pin(${q(pin.name)}, ${q(`P${pin.port}.${pin.bit}`)}, `
                + `${q(pin.direction)}, ${pin.activeLow ? 1 : 0})`);
        }
        return lines;
    }

    // The pseudocode structure markers for one target: scratch.sprite/stage + local + costume.
    // `quote` = this.pyStr (JSON strings work in both Python and JS).
    scratchStructMarkers(t) {
        const q = (s) => this.pyStr(s);
        const lines = [];
        if (t.isStage) lines.push('scratch.stage()');
        else {
            const shape = t.costumes && t.costumes[0] && t.costumes[0]._shapeSpec;
            lines.push(shape ? `scratch.sprite(${q(t.name)}, ${q(shape)})` : `scratch.sprite(${q(t.name)})`);
        }
        for (const v of Object.values(t.variables || {})) if (!t.isStage) lines.push(`scratch.local(${q(v[0])})`);
        for (const l of Object.values(t.lists || {})) if (!t.isStage) lines.push(`scratch.local_list(${q(l[0])})`);
        for (const cos of (t.costumes || []).slice(1)) lines.push(`scratch.costume(${q(cos._spec || cos.name)})`);
        for (const snd of (t.sounds || []).slice(1)) lines.push(`scratch.sound(${q(snd.name)})`);
        return lines;
    }

    generatePython(project = this.project, opts = {}) {
        this._driverPins = (project.stc && project.stc.pins) || null;
        this._pyNames = new Map();
        this._pyUses = { random: false, math: false, time: false, eq: false, answer: false, arrays: false, json: false, sumdigits: false };
        this._runtimesUsed = new Set();
        this._async = !!(opts && opts.async);
        this._events = !!(opts && opts.events);
        this._emitComments = !(opts && opts.comments === false); // default: include block comments as #/// lines
        const targets = project.targets || [];
        this._buildCodeComments(targets);
        const stage = targets.find((t) => t.isStage);
        // Stage variables are globals; sprite variables are locals (prefixed per sprite).
        const gScalars = stage ? Object.values(stage.variables || {}).map((v) => v[0]) : [];
        const gLists = stage ? Object.values(stage.lists || {}).map((l) => l[0]) : [];
        for (const n of gScalars) this.pyName(n);
        for (const n of gLists) this.pyName(n);

        // Sections in emission order (Stage only if it has scripts). The section's POSITION
        // is its sprite index for prefixing — matching how the parser counts markers back.
        const sections = targets.filter((t) => !t.isStage || Object.values(t.blocks || {}).some((b) => b.topLevel));

        const stateDecls = [];       // module-level `name = 0/[]` (globals + all locals)
        const bodyBlocks = [];       // [{markers, defs}] in emission order
        const flagCalls = [], eventRegs = [];
        for (const n of gScalars) stateDecls.push(`${this.pyName(n)} = 0`);
        for (const n of gLists) stateDecls.push(`${this.pyName(n)} = []`);

        sections.forEach((t, idx) => {
            const pfx = spritePrefix(idx);
            const localScalars = t.isStage ? [] : Object.values(t.variables || {}).map((v) => v[0]);
            const localLists = t.isStage ? [] : Object.values(t.lists || {}).map((l) => l[0]);
            this._curPrefix = pfx;
            this._curLocals = new Set([...localScalars, ...localLists]);
            for (const n of localScalars) stateDecls.push(`${pfx}${this.pyName(n)} = 0`);
            for (const n of localLists) stateDecls.push(`${pfx}${this.pyName(n)} = []`);

            const defs = [];
            const blocks = t.blocks || {};
            for (const b of Object.values(blocks)) {
                if (!b.topLevel) continue;
                const rop = this.runtimeOp(b.opcode);
                if (rop && rop.kind === 'hat') {
                    if (this._events) {
                        this._runtimesUsed.add(b.opcode.slice(0, b.opcode.indexOf('_')));
                        const hn = this.pyFreshName(pfx + 'on_' + b.opcode.slice(b.opcode.indexOf('_') + 1));
                        defs.push(this.pyFunc(`def ${hn}():`, b.next, blocks, []));
                        eventRegs.push(`_${rop.runtime}.on(${this.pyStr(b.opcode)}, ${hn})`);
                    }
                    continue;
                }
                if (!this.isHat(b.opcode)) continue;
                if (b.opcode === 'procedures_definition') {
                    const proto = blocks[b.inputs.custom_block[1]];
                    const m = proto.mutation;
                    const argNames = JSON.parse(m.argumentnames || '[]').map((n) => this.pyName(n));
                    const fn = this.pyName(pfx + this.pyProcRaw(m.proccode));
                    // Marker preserves the exact proccode (arg positions interleave with label
                    // words) + warp flag, which the flat function name can't encode.
                    const marker = `scratch.defblock(${this.pyStr(m.proccode)}, ${m.warp === 'true' ? 1 : 0})`;
                    defs.push(marker + '\n' + this.pyFunc(`def ${fn}(${argNames.join(', ')}):`, b.next, blocks, argNames));
                } else {
                    const name = this.pyFreshName(pfx + this.pyHatBase(b));
                    const isFlag = b.opcode === 'event_whenflagclicked';
                    // A comment on the hat belongs to the script, and was being dropped.
                    const note = this.codeCommentLines(Object.keys(blocks)
                        .find((k) => blocks[k] === b), '', '#');
                    let code = this.pyFunc(`def ${name}():`, b.next, blocks, []);
                    if (note.length) code = note.join('\n') + '\n' + code;
                    if (!isFlag) code = `# ${this.decompileHat(b, blocks)}  (event handler — call it when that event happens)\n` + code;
                    defs.push(code);
                    if (isFlag) flagCalls.push(`${name}()`);
                }
            }
            bodyBlocks.push({ markers: this.scratchStructMarkers(t), defs });
        });
        this._curPrefix = ''; this._curLocals = null;

        const out = [];
        out.push('# Generated by Brickwright — blocks → Python.');
        out.push('# Scratch blocks (motion/looks/sensing/…) map to a `scratch` runtime object;');
        out.push('# sprite structure is marked by scratch.sprite()/costume() so it round-trips to blocks.');
        out.push('');
        if (this._pyUses.random) out.push('import random');
        if (this._pyUses.math) out.push('import math');
        if (this._pyUses.time) out.push('import time');
        if (this._pyUses.json) out.push('import json');
        if (this._async) out.push('import asyncio');
        if (this._pyUses.random || this._pyUses.math || this._pyUses.time || this._pyUses.json || this._async) out.push('');
        out.push(...this.scratchShimPy());
        out.push('');
        if (this._pyUses.arrays) { out.push(...this.arraysShimPy()); out.push(''); }
        if (this._pyUses.sumdigits) {
            out.push('def _sumdigits(n): return sum(int(d) for d in str(n) if d.isdigit())');
            out.push('');
        }
        if (this._pyUses.multiple) {
            out.push('def _multiple(a, b):  # `is multiple of`, kept distinct from `mod … = 0`');
            out.push('    return float(b) != 0 and float(a) % float(b) == 0');
            out.push('');
        }
        if (this._pyUses.eq) {
            out.push('def _eq(a, b):  # Scratch-style loose equality');
            out.push('    try:');
            out.push('        return float(a) == float(b)');
            out.push('    except (ValueError, TypeError):');
            out.push('        return str(a).lower() == str(b).lower()');
            out.push('');
        }
        // Pluggable driver shim(s) for any runtime/hardware extensions used.
        for (const extId of this._runtimesUsed) { out.push(...this.runtimeShim(extId, 'py', opts.driver || 'shim')); out.push(''); }
        // module state
        if (this._pyUses.answer) stateDecls.push('answer = ""');
        if (stateDecls.length) { out.push(...stateDecls); out.push(''); }
        // Hardware declarations first: they are the project's header in pseudocode too.
        const stcMarkers = this.stcStructMarkers(project);
        if (stcMarkers.length) { out.push(...stcMarkers); out.push(''); }
        // Global-name markers (carry original names so the parser un-mangles identifiers).
        for (const n of gScalars) out.push(`scratch.global_var(${this.pyStr(n)})`);
        for (const n of gLists) out.push(`scratch.global_list(${this.pyStr(n)})`);
        if (gScalars.length || gLists.length) out.push('');
        for (const { markers, defs } of bodyBlocks) {
            out.push(...markers);
            out.push('');
            for (const d of defs) { out.push(d); out.push(''); }
        }
        if (eventRegs.length || flagCalls.length) {
            out.push('# run');
            out.push(...eventRegs);
            out.push(...flagCalls.map((c) => (this._async ? `asyncio.run(${c})` : c)));
        }
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    // A tiny no-op `scratch` runtime so the generated Python runs headless. It is the swap
    // point: implement these to drive a real stage. Reporters return neutral values.
    scratchShimPy() {
        return [
            'class _Scratch:',
            '    """No-op Scratch stage shim (swap for a real renderer). Reporters return neutral values."""',
            '    def say(self, msg, *_a): print(msg)',
            '    def think(self, msg, *_a): print(msg)',
            '    def __getattr__(self, _name):',
            '        def _op(*_a, **_k): return 0',
            '        return _op',
            'scratch = _Scratch()'
        ];
    }

    // ---- JavaScript code generation (same walker, JS templates) -----------------
    // JS closures mean functions read the outer `let` state directly (no `global`),
    // and empty `{}` is valid (no `pass` needed). Runs in a browser (console/prompt).
    jsVal(input, blocks) {
        if (!Array.isArray(input)) return 'undefined';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a] = inner;
            if (type === 12 || type === 13) return this.varRef(a);
            return /^-?\d+(\.\d+)?$/.test(String(a)) ? String(a) : this.pyStr(a);
        }
        return this.jsRep(blocks[inner], blocks);
    }

    jsMathop(op, x) {
        const m = {
            abs: `Math.abs(${x})`, floor: `Math.floor(${x})`, ceiling: `Math.ceil(${x})`, sqrt: `Math.sqrt(${x})`,
            sin: `Math.sin((${x}) * Math.PI / 180)`, cos: `Math.cos((${x}) * Math.PI / 180)`, tan: `Math.tan((${x}) * Math.PI / 180)`,
            ln: `Math.log(${x})`, log: `Math.log10(${x})`, 'e ^': `Math.exp(${x})`, '10 ^': `(10 ** (${x}))`
        };
        return m[op] || `Math.abs(${x})`;
    }

    jsRep(b, blocks) {
        if (!b) return 'undefined';
        const v = (k) => this.jsVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const L = (k) => this.varRef(f(k));
        switch (b.opcode) {
            case 'operator_add': return `(${v('NUM1')} + ${v('NUM2')})`;
            case 'operator_subtract': return `(${v('NUM1')} - ${v('NUM2')})`;
            case 'operator_multiply': return `(${v('NUM1')} * ${v('NUM2')})`;
            case 'operator_divide': return `(${v('NUM1')} / ${v('NUM2')})`;
            case 'operator_mod': return `(${v('NUM1')} % ${v('NUM2')})`;
            case 'bitops_and': return `((${v('NUM1')}) & (${v('NUM2')}))`;
            case 'bitops_or': return `((${v('NUM1')}) | (${v('NUM2')}))`;
            case 'bitops_xor': return `((${v('NUM1')}) ^ (${v('NUM2')}))`;
            case 'bitops_shl': return `((${v('NUM1')}) << (${v('NUM2')}))`;
            case 'bitops_shr': return `((${v('NUM1')}) >> (${v('NUM2')}))`;
            case 'bitops_not': return `(~(${v('NUM')}))`;
            case 'operator_random': this._jsUses.rand = true; return `_rand(${v('FROM')}, ${v('TO')})`;
            case 'operator_round': return `Math.round(${v('NUM')})`;
            case 'operator_mathop': return this.jsMathop(f('OPERATOR'), v('NUM'));
            case 'operator_join': return `(String(${v('STRING1')}) + String(${v('STRING2')}))`;
            case 'operator_letter_of': return `String(${v('STRING')})[Number(${v('LETTER')}) - 1]`;
            case 'operator_length': return `String(${v('STRING')}).length`;
            case 'operator_contains': return `String(${v('STRING1')}).includes(String(${v('STRING2')}))`;
            case 'data_itemoflist': return `${L('LIST')}[Number(${v('INDEX')}) - 1]`;
            case 'data_lengthoflist': return `${L('LIST')}.length`;
            case 'data_listcontainsitem': return `${L('LIST')}.includes(${v('ITEM')})`;
            case 'sensing_answer': this._jsUses.answer = true; return 'answer';
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return this.pyName(f('VALUE'));
            // Planète Maths extension (id `planetemaths`) — source of truth:
            // github.com/CrispStrobe/extensions (extensions/CrispStrobe/planetemaths.js).
            case 'planetemaths_add': return `(${v('NUM1')} + ${v('NUM2')})`;
            case 'planetemaths_substract': return `(${v('NUM1')} - ${v('NUM2')})`;
            case 'planetemaths_multiply': return `(${v('NUM1')} * ${v('NUM2')})`;
            case 'planetemaths_divide': return `(${v('NUM1')} / ${v('NUM2')})`;
            case 'planetemaths_pow': return `Math.pow(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_oppose': return `(0 - ${v('NUM1')})`;
            case 'planetemaths_inverse': return `(1 / ${v('NUM1')})`;
            case 'planetemaths_pourcent': return `(${v('NUM1')} / 100)`;
            case 'planetemaths_nombre_pi': return 'Math.PI';
            case 'planetemaths_nombre_e': return 'Math.E';
            case 'planetemaths_factorial': this._jsUses.fact = true; return `_fact(${v('NUM1')})`;
            case 'planetemaths_min': return `Math.min(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_max': return `Math.max(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_random': this._jsUses.rand = true; return `_rand(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_join': return `(String(${v('STRING1')}) + String(${v('STRING2')}))`;
            case 'planetemaths_letterOf': return `String(${v('STRING')})[Number(${v('LETTER')}) - 1]`;
            case 'planetemaths_length': return `String(${v('STRING')}).length`;
            case 'planetemaths_sommechiffres': this._jsUses.sumdigits = true; return `_sumdigits(${v('NUM1')})`;
            // Arrays & Vectors reporters (0-based; `_arrays` registry).
            default: {
                const ac = this.arraysCall(b, blocks, this.jsVal);
                if (ac) return ac.call;
                const sc = this.scratchCall(b, blocks, this.jsVal);   // scratch-runtime reporters
                if (sc) return sc.call;
                const rc = this.runtimeCall(b, blocks, v);   // pluggable runtime/hardware extensions
                if (rc) return rc.call;
                return 'undefined';
            }
        }
    }

    jsCond(ref, blocks) {
        const b = blocks[ref];
        if (!b) return 'false';
        const v = (k) => this.jsVal(b.inputs[k], blocks);
        const c = (k) => this.jsCond(b.inputs[k][1], blocks);
        switch (b.opcode) {
            case 'operator_gt': return `(${v('OPERAND1')} > ${v('OPERAND2')})`;
            case 'operator_lt': return `(${v('OPERAND1')} < ${v('OPERAND2')})`;
            case 'operator_equals': this._jsUses.eq = true; return `_eq(${v('OPERAND1')}, ${v('OPERAND2')})`;
            case 'operator_and': return `(${c('OPERAND1')} && ${c('OPERAND2')})`;
            case 'operator_or': return `(${c('OPERAND1')} || ${c('OPERAND2')})`;
            case 'operator_not': return `(!${c('OPERAND')})`;
            case 'operator_contains': return `String(${v('STRING1')}).includes(String(${v('STRING2')}))`;
            case 'data_listcontainsitem': return `${this.varRef(b.fields.LIST[0])}.includes(${v('ITEM')})`;
            case 'argument_reporter_boolean': return this.pyName(b.fields.VALUE[0]);
            // Planète Maths booleans (semantics from the implementation, not the labels).
            case 'planetemaths_gt': return `(${v('NUM1')} < ${v('NUM2')})`;
            case 'planetemaths_gte': return `(${v('NUM1')} <= ${v('NUM2')})`;
            case 'planetemaths_lt': return `(${v('NUM1')} > ${v('NUM2')})`;
            case 'planetemaths_lte': return `(${v('NUM1')} >= ${v('NUM2')})`;
            case 'planetemaths_equals': this._jsUses.eq = true; return `_eq(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_and': return `(${c('OPERAND1')} && ${c('OPERAND2')})`;
            case 'planetemaths_or': return `(${c('OPERAND1')} || ${c('OPERAND2')})`;
            case 'planetemaths_not': return `(!${c('OPERAND1')})`;
            case 'planetemaths_contains': return `String(${v('STRING1')}).includes(String(${v('STRING2')}))`;
            case 'planetemaths_multiple': this._jsUses.multiple = true; return `_multiple(${v('NUM1')}, ${v('NUM2')})`;
            default: {
                const ac = this.arraysCall(b, blocks, this.jsVal);
                if (ac) return ac.call;
                const sc = this.scratchCall(b, blocks, this.jsVal);   // scratch-runtime predicates
                if (sc) return sc.call;
                const rc = this.runtimeCall(b, blocks, v);
                if (rc) return rc.call;
                return 'false';
            }
        }
    }

    jsStackFrom(firstId, blocks, level) {
        const lines = [];
        let id = firstId;
        const pad = '  '.repeat(level);
        while (id && blocks[id]) {
            lines.push(...this.codeCommentLines(id, pad, '//'));
            lines.push(...this.jsStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return lines;
    }

    jsStackBlock(b, blocks, level) {
        const pad = '  '.repeat(level);
        const v = (k) => this.jsVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const L = (k) => this.varRef(f(k));
        const sub = (k) => (b.inputs[k] ? this.jsStackFrom(b.inputs[k][1], blocks, level + 1) : []);
        const line = (t) => [pad + t];
        const block = (head, k) => [pad + head, ...sub(k), pad + '}'];
        const cond = () => this.jsCond(b.inputs.CONDITION[1], blocks);
        switch (b.opcode) {
            case 'control_forever': return block('while (true) {', 'SUBSTACK');
            case 'control_repeat': return block(`for (let _i${level} = 0; _i${level} < ${v('TIMES')}; _i${level}++) {`, 'SUBSTACK');
            case 'control_repeat_until': return block(`while (!(${cond()})) {`, 'SUBSTACK');
            case 'control_if': return block(`if (${cond()}) {`, 'SUBSTACK');
            case 'control_if_else': return [pad + `if (${cond()}) {`, ...sub('SUBSTACK'), pad + '} else {', ...sub('SUBSTACK2'), pad + '}'];
            case 'control_wait': return line(`scratch.wait(${v('DURATION')});`);
            case 'control_wait_until': return line(`scratch.wait_until(${cond()});`);
            case 'control_stop': return f('STOP_OPTION') === 'this script' ? line('return;') : line(this.scratchCall(b, blocks, this.jsVal).call + ';');
            case 'sensing_askandwait': this._jsUses.answer = true; return line(`answer = prompt(String(${v('QUESTION')}));`);
            case 'data_setvariableto': return line(`${this.varRef(f('VARIABLE'))} = ${v('VALUE')};`);
            case 'data_changevariableby': return line(`${this.varRef(f('VARIABLE'))} += ${v('VALUE')};`);
            case 'data_addtolist': return line(`${L('LIST')}.push(${v('ITEM')});`);
            case 'data_deleteoflist': return line(`${L('LIST')}.splice(Number(${v('INDEX')}) - 1, 1);`);
            case 'data_deletealloflist': return line(`${L('LIST')}.length = 0;`);
            case 'data_insertatlist': return line(`${L('LIST')}.splice(Number(${v('INDEX')}) - 1, 0, ${v('ITEM')});`);
            case 'data_replaceitemoflist': return line(`${L('LIST')}[Number(${v('INDEX')}) - 1] = ${v('ITEM')};`);
            // Arrays & Vectors extension (id `arrays`) — `_arrays` registry, 0-based.
            case 'procedures_call': {
                const m = b.mutation;
                const argIds = JSON.parse(m.argumentids || '[]');
                let ai = 0; const args = [];
                m.proccode.replace(/%[sb]/g, (tok) => {
                    const input = b.inputs[argIds[ai++]];
                    args.push(tok === '%b' ? this.jsCond(input[1], blocks) : this.jsVal(input, blocks));
                    return '';
                });
                const fn = this.pyName(this._curPrefix + this.pyProcRaw(m.proccode));
                return line(`${this._async ? 'await ' : ''}${fn}(${args.join(', ')});`);
            }
            default: {
                const ac = this.arraysCall(b, blocks, this.jsVal);
                if (ac) return line(ac.call + ';');
                const sc = this.scratchCall(b, blocks, this.jsVal);   // motion/looks/sensing/pen/… -> scratch.<method>()
                if (sc) return line(sc.call + ';');
                const rc = this.runtimeCall(b, blocks, v);   // pluggable runtime/hardware commands
                if (rc) return line(rc.call + ';');
                const ps = (this.decompileStackBlock(b, blocks, 0)[0] || b.opcode).trim();
                return line(`// ${ps}`);
            }
        }
    }

    generateJavaScript(project = this.project, opts = {}) {
        this._driverPins = (project.stc && project.stc.pins) || null;
        this._pyNames = new Map();
        this._jsUses = { rand: false, eq: false, answer: false, fact: false, arrays: false, sumdigits: false, multiple: false };
        this._runtimesUsed = new Set();
        this._async = !!(opts && opts.async);
        this._events = !!(opts && opts.events);
        this._emitComments = !(opts && opts.comments === false); // default: include block comments as #/// lines
        const targets = project.targets || [];
        this._buildCodeComments(targets);
        const stage = targets.find((t) => t.isStage);
        const gScalars = stage ? Object.values(stage.variables || {}).map((v) => v[0]) : [];
        const gLists = stage ? Object.values(stage.lists || {}).map((l) => l[0]) : [];
        for (const n of gScalars) this.pyName(n);
        for (const n of gLists) this.pyName(n);

        const sections = targets.filter((t) => !t.isStage || Object.values(t.blocks || {}).some((b) => b.topLevel));

        const stateDecls = [];
        const bodyBlocks = [];
        const flagCalls = [], eventRegs = [];
        for (const n of gScalars) stateDecls.push(`let ${this.pyName(n)} = 0;`);
        for (const n of gLists) stateDecls.push(`let ${this.pyName(n)} = [];`);

        sections.forEach((t, idx) => {
            const pfx = spritePrefix(idx);
            const localScalars = t.isStage ? [] : Object.values(t.variables || {}).map((v) => v[0]);
            const localLists = t.isStage ? [] : Object.values(t.lists || {}).map((l) => l[0]);
            this._curPrefix = pfx;
            this._curLocals = new Set([...localScalars, ...localLists]);
            for (const n of localScalars) stateDecls.push(`let ${pfx}${this.pyName(n)} = 0;`);
            for (const n of localLists) stateDecls.push(`let ${pfx}${this.pyName(n)} = [];`);

            const defs = [];
            const blocks = t.blocks || {};
            const af = this._async ? 'async ' : '';
            for (const b of Object.values(blocks)) {
                if (!b.topLevel) continue;
                const rop = this.runtimeOp(b.opcode);
                if (rop && rop.kind === 'hat') {
                    if (this._events) {
                        this._runtimesUsed.add(b.opcode.slice(0, b.opcode.indexOf('_')));
                        const hn = this.pyFreshName(pfx + 'on_' + b.opcode.slice(b.opcode.indexOf('_') + 1));
                        defs.push([`${af}function ${hn}() {`, ...this.jsStackFrom(b.next, blocks, 1), '}'].join('\n'));
                        eventRegs.push(`_${rop.runtime}.on(${this.pyStr(b.opcode)}, ${hn});`);
                    }
                    continue;
                }
                if (!this.isHat(b.opcode)) continue;
                if (b.opcode === 'procedures_definition') {
                    const proto = blocks[b.inputs.custom_block[1]];
                    const m = proto.mutation;
                    const argNames = JSON.parse(m.argumentnames || '[]').map((n) => this.pyName(n));
                    const fn = this.pyName(pfx + this.pyProcRaw(m.proccode));
                    const marker = `scratch.defblock(${this.pyStr(m.proccode)}, ${m.warp === 'true' ? 1 : 0});`;
                    defs.push([marker, `${af}function ${fn}(${argNames.join(', ')}) {`, ...this.jsStackFrom(b.next, blocks, 1), '}'].join('\n'));
                } else {
                    const name = this.pyFreshName(pfx + this.pyHatBase(b));
                    const isFlag = b.opcode === 'event_whenflagclicked';
                    // A comment on the hat belongs to the script, and was being dropped.
                    const note = this.codeCommentLines(Object.keys(blocks)
                        .find((k) => blocks[k] === b), '', '//');
                    let code = [...note, `${af}function ${name}() {`,
                        ...this.jsStackFrom(b.next, blocks, 1), '}'].join('\n');
                    if (!isFlag) code = `// ${this.decompileHat(b, blocks)}  (event handler — call it when that event happens)\n` + code;
                    defs.push(code);
                    if (isFlag) flagCalls.push(`${name}();`);
                }
            }
            bodyBlocks.push({ markers: this.scratchStructMarkers(t).map((l) => l + ';'), defs });
        });
        this._curPrefix = ''; this._curLocals = null;

        const out = [];
        out.push('// Generated by Brickwright — blocks → JavaScript.');
        out.push('// Scratch blocks (motion/looks/sensing/…) map to a `scratch` runtime object;');
        out.push('// sprite structure is marked by scratch.sprite()/costume() so it round-trips to blocks.');
        out.push('');
        // `is multiple of` gets its own function: `x % y === 0` is a different
        // block that means the same thing, and the way back cannot guess which.
        if (this._jsUses.multiple) out.push('function _multiple(a, b) { return Number(b) !== 0 && Number(a) % Number(b) === 0; }');
        if (this._jsUses.eq) out.push('function _eq(a, b) { const x = Number(a), y = Number(b); if (!Number.isNaN(x) && !Number.isNaN(y)) return x === y; return String(a).toLowerCase() === String(b).toLowerCase(); }');
        if (this._jsUses.rand) out.push('function _rand(a, b) { a = Number(a); b = Number(b); return Math.floor(Math.random() * (b - a + 1)) + a; }');
        if (this._jsUses.fact) out.push('function _fact(n) { n = Number(n); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }');
        if (this._jsUses.sumdigits) out.push("function _sumdigits(n) { return String(n).split('').filter(d => d >= '0' && d <= '9').reduce((s, d) => s + Number(d), 0); }");
        if (this._jsUses.eq || this._jsUses.rand || this._jsUses.fact || this._jsUses.sumdigits) out.push('');
        out.push(...this.scratchShimJs());
        out.push('');
        if (this._jsUses.arrays) { out.push(...this.arraysShimJs()); out.push(''); }
        // Pluggable driver shim(s) for any runtime/hardware extensions used.
        for (const extId of this._runtimesUsed) { out.push(...this.runtimeShim(extId, 'js', opts.driver || 'shim')); out.push(''); }
        if (this._jsUses.answer) stateDecls.push('let answer = "";');
        if (stateDecls.length) { out.push(...stateDecls); out.push(''); }
        const stcMarkers = this.stcStructMarkers(project).map((l) => l + ';');
        if (stcMarkers.length) { out.push(...stcMarkers); out.push(''); }
        for (const n of gScalars) out.push(`scratch.global_var(${this.pyStr(n)});`);
        for (const n of gLists) out.push(`scratch.global_list(${this.pyStr(n)});`);
        if (gScalars.length || gLists.length) out.push('');
        for (const { markers, defs } of bodyBlocks) {
            out.push(...markers);
            out.push('');
            for (const d of defs) { out.push(d); out.push(''); }
        }
        if (eventRegs.length || flagCalls.length) {
            out.push('// run');
            out.push(...eventRegs);
            out.push(...flagCalls.map((c) => (this._async ? `(async () => { await ${c} })();` : c)));
        }
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    // A tiny no-op `scratch` runtime so the generated JavaScript runs headless. `say`/`think`
    // log to the console (so existing behaviour tests keep working); other ops are no-ops
    // and reporters return 0. Swap for a real renderer to actually drive a stage.
    scratchShimJs() {
        return [
            'const scratch = new Proxy({', '    say: (m) => console.log(m), think: (m) => console.log(m)',
            '}, { get: (t, k) => (k in t ? t[k] : () => 0) });  // no-op stage shim; reporters -> 0'
        ];
    }

    // ---- C code generation (blocks -> C for the STC12 / 8051) --------------------
    //
    // The fifth target. It is emit-only *for now*: there is no C -> blocks front end yet,
    // so C is excluded from the two-way convergence invariant (it must not break the
    // others). Both directions ARE the intent, and two thirds of the way back already
    // exist in ../stc-compiler: `keil2sdcc.py` (POST /translate, /translate-project)
    // reads arbitrary third-party C at 546/597 on an 86-repo corpus, and `stc_disasm.py`
    // (POST /disassemble) takes an Intel HEX image back to 8051 assembly, 380/380
    // byte-exact over 349 images with reassembly as its oracle. What is missing is the
    // C -> pseudocode/blocks lift on top of them, not the ability to read C.
    //
    // `../stc-compiler/stc_pseudocode.py` is the reference implementation AND the test
    // oracle — the same AST shape, one language over. `cStackBlock` ports its `stmts_c`,
    // `cTaskBlock` its `stmts_task`, `generateC` its `emit_c`. Three decisions come from
    // there unchanged (they are settled; do not redesign them here):
    //
    //  1. **Scheduling.** Several `when green flag clicked` scripts compile to cooperative
    //     tasks: a Timer-0 ISR advances a millisecond counter and does nothing else, and
    //     each script becomes a Duff's-device state machine that yields at every wait AND
    //     at every loop back-edge — Scratch's own contract, and what stops a busy FOREVER
    //     starving the others. Deadlines are wraparound-safe 16-bit compares behind an
    //     interrupt-safe read, because a 16-bit load is not atomic on an 8051. A single
    //     script keeps straight-line emission in main().
    //  2. **Timing.** Everything hangs off Timer 0 at FOSC/12 — the one mode a 12T STC89
    //     and a 1T STC12/STC15 count identically, so one program is timing-correct on any
    //     supported part. NEVER emit a cycle-counted delay loop: on a 1T part it runs
    //     6-12x too fast, the classic drop-in-socket bug (`../stc/README.md` §8.1).
    //  3. **Active-low pins.** A quasi-bidirectional 8051 pin sinks 20 mA but sources only
    //     ~230 µA, so LEDs are wired active-low and `turn on` must write a 0.
    //
    // Numbers are 16-bit ints (Scratch's integers without the float tail). Blocks with no
    // meaning on bare metal — motion, looks, sound, lists — become /* comments */ and a
    // warning, exactly as the Python back end turns them into `#` lines.

    // A unique, valid C identifier for a Scratch name. Memoized like pyName, but with its
    // own map so C keywords and the Python/JS names never interfere.
    cName(name) {
        if (!this._cNames) this._cNames = new Map();
        if (this._cNames.has(name)) return this._cNames.get(name);
        let id = sanitizeIdent(name);
        if (SB3Creator.C_RESERVED.has(id)) id += '_';
        const used = new Set(this._cNames.values());
        let final = id, n = 2;
        while (used.has(final)) final = id + '_' + n++;
        this._cNames.set(name, final);
        return final;
    }

    // Prefix-aware variable reference (sprite locals are `s<idx>_`-prefixed, as in Python/JS).
    cRef(name) {
        if (this._curLocals && this._curLocals.has(name)) return this.cName(this._curPrefix + name);
        return this.cName(name);
    }

    // Make arbitrary text safe to drop inside a /* ... */ comment.
    cComment(text) {
        return String(text).replace(/\*\//g, '* /').replace(/\/\*/g, '/ *');
    }

    // A marker-header token that must survive the trip byte for byte — a block id.
    // cComment is the wrong tool for those: Scratch's id alphabet contains both `*`
    // and `/` (see generateId, and generateAssetId which already exists to dodge the
    // same alphabet for filenames), so roughly one id in 400 contains `*/` and would
    // close the comment the header lives in. cComment would then rewrite it to `* /`
    // and silently hand back a DIFFERENT id, which is worse than a broken comment.
    // encodeURIComponent leaves `*` alone but escapes `/`, so escape `*` too; what is
    // left has no `/`, no `*` and no whitespace, and decodeURIComponent is exact.
    cMark(text) {
        return encodeURIComponent(String(text)).replace(/\*/g, '%2A');
    }

    cWarn(message) {
        if (!this._cWarnings) this._cWarnings = [];
        if (!this._cWarnings.includes(message)) this._cWarnings.push(message);
    }

    cPin(name) {
        if (!this._cPins || name === undefined || name === null) return null;
        return this._cPins.get(String(name).toLowerCase()) || null;
    }

    // Scratch values are strings/numbers; C variables here are ints, so a literal is
    // truncated (as the oracle's `int(node.value)` does) and a non-number becomes 0.
    cNum(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return `0 /* ${this.cComment(value)} */`;
        return String(Math.trunc(n));
    }

    cInit(value) {
        const n = Number(value);
        return Number.isFinite(n) ? String(Math.trunc(n)) : '0';
    }

    cVal(input, blocks) {
        if (!Array.isArray(input)) return '0';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a] = inner;
            if (type === 12) return this.cRef(a);
            if (type === 13) { this.cWarn('lists have no C equivalent — emitted as 0'); return '0'; }
            return this.cNum(a);
        }
        return this.cRep(blocks[inner], blocks);
    }

    // The SFR bit name for a driveable pin (`P1_0`), or null with a warning.
    cSfr(name) {
        const pin = this.cPin(name);
        if (!pin) {
            this.cWarn(`undeclared pin "${name}" — declare it with e.g. PIN ${name} = P1.0 OUTPUT`);
            return null;
        }
        if (pin.direction !== 'output') {
            this.cWarn(`"${pin.name}" is an ${pin.direction.toUpperCase()} pin and cannot be driven`);
            return null;
        }
        return `P${pin.port}_${pin.bit}`;
    }

    // Reading a pin: the ADC for an ANALOG pin, otherwise the level — inverted when the
    // pin is wired ACTIVE LOW, so the pseudocode never has to know about the polarity.
    cPinRead(name) {
        const pin = this.cPin(name);
        if (!pin) {
            this.cWarn(`read of undeclared pin "${name}" — emitted as 0`);
            return `0 /* read ${this.cComment(name)} */`;
        }
        if (pin.direction === 'analog') {
            this._cUses.adc = true;
            return `adc_read(${pin.bit})`;   // ADC channel n is physically P1.n
        }
        const sfr = `P${pin.port}_${pin.bit}`;
        return pin.activeLow ? `!${sfr}` : sfr;
    }

    // `turn on` writes a 0 on an ACTIVE LOW pin. That inversion is the whole point.
    cSetPin(name, state) {
        const sfr = this.cSfr(name);
        if (!sfr) return `/* set ${this.cComment(name)} ${this.cComment(state)} */`;
        const pin = this.cPin(name);
        const high = state === 'high' ? true
            : state === 'low' ? false
                : (state === 'on') !== !!pin.activeLow;
        return `${sfr} = ${high ? 1 : 0};`;
    }

    cRep(b, blocks) {
        if (!b) return '0';
        const v = (k) => this.cVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        switch (b.opcode) {
            case 'operator_add': case 'planetemaths_add': return `(${v('NUM1')} + ${v('NUM2')})`;
            case 'operator_subtract': case 'planetemaths_substract': return `(${v('NUM1')} - ${v('NUM2')})`;
            case 'operator_multiply': case 'planetemaths_multiply': return `(${v('NUM1')} * ${v('NUM2')})`;
            case 'operator_divide': case 'planetemaths_divide': return `(${v('NUM1')} / ${v('NUM2')})`;
            case 'operator_mod': return `(${v('NUM1')} % ${v('NUM2')})`;
            // Native on the chip, and the reason these exist: masking a port, setting one
            // bit, shifting an ADC reading.
            case 'bitops_and': return `(${v('NUM1')} & ${v('NUM2')})`;
            case 'bitops_or': return `(${v('NUM1')} | ${v('NUM2')})`;
            case 'bitops_xor': return `(${v('NUM1')} ^ ${v('NUM2')})`;
            case 'bitops_shl': return `(${v('NUM1')} << ${v('NUM2')})`;
            case 'bitops_shr': return `(${v('NUM1')} >> ${v('NUM2')})`;
            case 'bitops_not': return `(~${v('NUM')})`;
            case 'operator_round': return v('NUM');       // integer arithmetic already
            case 'planetemaths_oppose': return `(0 - ${v('NUM1')})`;
            case 'planetemaths_pourcent': return `(${v('NUM1')} / 100)`;
            case 'stc12_read': return this.cPinRead(f('PIN'));
            case 'stc12_readport': {
                const portCfg = this.project && this.project.stc && (this.project.stc.ports || []).find((p) => p.name.toLowerCase() === f('PORT').toLowerCase());
                return portCfg ? `P${portCfg.port}` : `0 /* read ${this.cComment(f('PORT'))} */`;
            }
            case 'stc12_tableindex': {
                const tbl = this.stcTable(f('TABLE'));
                const tName = tbl ? `bw_tab_${tbl.name}` : `bw_tab_${f('TABLE').toLowerCase()}`;
                const len = tbl ? tbl.values.length : 0;
                this._cUses.table = true;
                return len ? `${tName}[bw_clamp(${v('INDEX')}, ${len - 1})]` : `${tName}[${v('INDEX')}]`;
            }
            case 'ledcube_readvoxel': {
                this._cUses.cube = true;
                return `bw_cube_get(${v('X')}, ${v('Y')}, ${v('Z')})`;
            }
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return this.cName(f('VALUE'));
            default: {
                const text = this.drep(b, blocks) || b.opcode;
                this.cWarn(`no C equivalent for "${text}" — emitted as 0`);
                return `0 /* ${this.cComment(text)} */`;
            }
        }
    }

    cCond(ref, blocks) {
        const b = typeof ref === 'string' ? blocks[ref] : null;
        if (!b) return '0';
        const v = (k) => this.cVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const c = (k) => this.cCond(b.inputs[k] ? b.inputs[k][1] : null, blocks);
        switch (b.opcode) {
            case 'operator_gt': return `(${v('OPERAND1')} > ${v('OPERAND2')})`;
            case 'operator_lt': return `(${v('OPERAND1')} < ${v('OPERAND2')})`;
            case 'operator_equals': {
                // `IF <boolean-ish> THEN:` parses to `x = true`; on a chip that is just `x`.
                const lit = (k) => {
                    const inner = Array.isArray(b.inputs[k]) ? b.inputs[k][1] : null;
                    return Array.isArray(inner) && (inner[0] === 10 || inner[0] === 4) ? String(inner[1]) : null;
                };
                const l = lit('OPERAND1'), r = lit('OPERAND2');
                if (/^true$/i.test(r || '')) return `(${v('OPERAND1')})`;
                if (/^false$/i.test(r || '')) return `(!(${v('OPERAND1')}))`;
                if (/^true$/i.test(l || '')) return `(${v('OPERAND2')})`;
                if (/^false$/i.test(l || '')) return `(!(${v('OPERAND2')}))`;
                return `(${v('OPERAND1')} == ${v('OPERAND2')})`;
            }
            case 'planetemaths_equals': return `(${v('NUM1')} == ${v('NUM2')})`;
            // The planetemaths boolean opcode NAMES are misnomers; map by the implementation.
            case 'planetemaths_gt': return `(${v('NUM1')} < ${v('NUM2')})`;
            case 'planetemaths_gte': return `(${v('NUM1')} <= ${v('NUM2')})`;
            case 'planetemaths_lt': return `(${v('NUM1')} > ${v('NUM2')})`;
            case 'planetemaths_lte': return `(${v('NUM1')} >= ${v('NUM2')})`;
            case 'operator_and': case 'planetemaths_and': return `(${c('OPERAND1')} && ${c('OPERAND2')})`;
            case 'operator_or': case 'planetemaths_or': return `(${c('OPERAND1')} || ${c('OPERAND2')})`;
            case 'operator_not': return `(!${c('OPERAND')})`;
            case 'planetemaths_not': return `(!${c('OPERAND1')})`;
            case 'planetemaths_multiple': return `((${v('NUM1')} % ${v('NUM2')}) == 0)`;
            case 'stc12_read': return this.cPinRead(f('PIN'));
            case 'stc12_readport': {
                const portCfg = this.project && this.project.stc && (this.project.stc.ports || []).find((p) => p.name.toLowerCase() === f('PORT').toLowerCase());
                return portCfg ? `P${portCfg.port}` : `0 /* read ${this.cComment(f('PORT'))} */`;
            }
            case 'argument_reporter_boolean': return this.cName(f('VALUE'));
            default: return `(${this.cRep(b, blocks)})`;
        }
    }

    // A `wait` duration (seconds, as Scratch spells it) in milliseconds, folded to a
    // constant where it can be — everything downstream counts whole milliseconds.
    cMs(input, blocks) {
        const inner = Array.isArray(input) ? input[1] : null;
        if (Array.isArray(inner)) {
            const n = Number(inner[1]);
            if (inner[0] !== 12 && inner[0] !== 13 && Number.isFinite(n)) return String(Math.round(n * 1000));
        }
        return `(unsigned int)((${this.cVal(input, blocks)}) * 1000)`;
    }

    // Block comments as real C comments (the Python/JS emitters use `#` / `//`).
    cCommentLines(blockId, pad) {
        if (this._emitComments === false) return [];
        const text = this._codeComments && this._codeComments[blockId];
        if (!text) return [];
        return String(text).split('\n').map((l) => `${pad}/* ${this.cComment(l)} */`);
    }

    cProcCall(b, blocks) {
        const m = b.mutation;
        const argIds = JSON.parse(m.argumentids || '[]');
        let ai = 0;
        const args = [];
        m.proccode.replace(/%[sb]/g, (tok) => {
            const input = b.inputs[argIds[ai++]];
            args.push(tok === '%b' ? this.cCond(input ? input[1] : null, blocks) : this.cVal(input, blocks));
            return '';
        });
        return `${this.cName(this._curPrefix + this.pyProcRaw(m.proccode))}(${args.join(', ')});`;
    }

    cStackFrom(firstId, blocks, level) {
        const lines = [];
        let id = firstId;
        const pad = '    '.repeat(level);
        while (id && blocks[id]) {
            lines.push(...this.cCommentLines(id, pad));
            lines.push(...this.cStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return lines;
    }

    // Straight-line statements — the single-script case, and every custom block's body.
    // (Custom blocks run to completion, so a `wait` inside one really does block.)
    cStackBlock(b, blocks, level) {
        const pad = '    '.repeat(level);
        const v = (k) => this.cVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const sub = (k, lvl = level + 1) => (b.inputs[k] ? this.cStackFrom(b.inputs[k][1], blocks, lvl) : []);
        const cond = () => this.cCond(b.inputs.CONDITION ? b.inputs.CONDITION[1] : null, blocks);
        const line = (t) => [pad + t];
        switch (b.opcode) {
            case 'control_forever': return [pad + 'for (;;) {', ...sub('SUBSTACK'), pad + '}'];
            case 'control_repeat': {
                // The counter is scoped to its own block so nested REPEATs never collide,
                // and declared up front because C89 wants declarations before statements.
                const i = `_i${++this._cCounter}`;
                return [pad + `{ unsigned int ${i};`,
                    pad + `    for (${i} = 0; ${i} < (${v('TIMES')}); ${i}++) {`,
                    ...sub('SUBSTACK', level + 2),
                    pad + '    }',
                    pad + '}'];
            }
            case 'control_repeat_until': return [pad + `while (!(${cond()})) {`, ...sub('SUBSTACK'), pad + '}'];
            case 'control_if': return [pad + `if (${cond()}) {`, ...sub('SUBSTACK'), pad + '}'];
            case 'control_if_else': return [pad + `if (${cond()}) {`, ...sub('SUBSTACK'),
                pad + '} else {', ...sub('SUBSTACK2'), pad + '}'];
            case 'control_wait': {
                if (this._cTasks) { this._cUses.blockDelay = true; return line(`bw_block_ms(${this.cMs(b.inputs.DURATION, blocks)});`); }
                this._cUses.delay = true;
                return line(`delay_ms(${this.cMs(b.inputs.DURATION, blocks)});`);
            }
            case 'control_wait_until': return line(`while (!(${cond()})) ;`);
            case 'control_stop': {
                const option = f('STOP_OPTION');
                if (option === 'this script') return line('return;');
                // Straight-line emission means there is exactly one script, so "stop other
                // scripts" has nothing to stop; only "stop all" halts the chip.
                if (option === 'other scripts in sprite') return line('/* stop other scripts in sprite — there are none */');
                return line('for (;;) ;   /* stop all */');
            }
            case 'data_setvariableto': return line(`${this.cRef(f('VARIABLE'))} = ${v('VALUE')};`);
            case 'data_changevariableby': return line(`${this.cRef(f('VARIABLE'))} += ${v('VALUE')};`);
            case 'stc12_setpin': return line(this.cSetPin(f('PIN'), f('STATE')));
            case 'stc12_writepin': {
                const sfr = this.cSfr(f('PIN'));
                // A computed value is a LEVEL, so ACTIVE LOW does not invert it — the same
                // rule `set high` / `set low` already follow.
                return line(sfr ? `${sfr} = (${v('VALUE')}) ? 1 : 0;` : `/* set ${this.cComment(f('PIN'))} */`);
            }
            case 'stc12_toggle': {
                const sfr = this.cSfr(f('PIN'));
                return line(sfr ? `${sfr} = !${sfr};` : `/* toggle ${this.cComment(f('PIN'))} */`);
            }
            case 'stc12_setpwm': {
                this._cUses.pwm = true;
                const pin = this._cPins && this._cPins.get(f('PIN').toLowerCase());
                const module = pin ? `${pin.port * 8 + pin.bit}` : '0';
                return line(`pwm_set(${module}, ${v('VALUE')});`);
            }
            case 'stc12_settone': {
                this._cUses.tone = true;
                return line(`tone_set(${v('VALUE')});`);
            }
            case 'stc12_setport': {
                const port = f('PORT');
                const portCfg = this.project && this.project.stc && (this.project.stc.ports || []).find((p) => p.name.toLowerCase() === port.toLowerCase());
                const sfr = portCfg ? `P${portCfg.port}` : `/* ${this.cComment(port)} */`;
                return line(`${sfr} = (unsigned char)(${v('VALUE')});`);
            }
            case 'stc12_setpart': {
                this._cUses.shiftOut = true;
                const part = f('PART');
                const partCfg = this.project && this.project.stc && (this.project.stc.parts || []).find((p) => p.name.toLowerCase() === part.toLowerCase());
                if (!partCfg) return line(`/* set ${this.cComment(part)} — undeclared PART */`);
                const { data, clock, latch } = partCfg;
                return line(`shift_out(P${data.port}_${data.bit}, P${clock.port}_${clock.bit}, P${latch.port}_${latch.bit}, ${partCfg.activeLow ? '1' : '0'}, (unsigned char)(${v('VALUE')}));`);
            }
            case 'stc12_print': {
                this._cUses.print = true;
                const mode = f('MODE');
                if (mode === 'text') {
                    const text = this.dval(b.inputs.VALUE, blocks).replace(/^"|"$/g, '');
                    return line(`bw_print("${this.cComment(text)}");`);
                }
                return line(`bw_print_num(${v('VALUE')});`);
            }
            // LED cube commands — manipulate the working frame, then hold to play.
            case 'ledcube_setvoxel': {
                this._cUses.cube = true;
                return line(`bw_cube_set(${v('X')}, ${v('Y')}, ${v('Z')}, ${v('COLOUR')});`);
            }
            case 'ledcube_clearvoxel': {
                this._cUses.cube = true;
                return line(`bw_cube_set(${v('X')}, ${v('Y')}, ${v('Z')}, 0);`);
            }
            case 'ledcube_filllayer': {
                this._cUses.cube = true;
                return line(`bw_cube_fill_layer(${v('LAYER')}, ${v('COLOUR')});`);
            }
            case 'ledcube_clear': {
                this._cUses.cube = true;
                return line('bw_cube_clear();');
            }
            case 'ledcube_shift': {
                this._cUses.cube = true;
                const dir = f('DIR');
                const dirIdx = cubeDirectionIndex(dir);
                // `|| 0` used to live here, which turned any unrecognised
                // direction into "up" and emitted it as though it were asked
                // for. Refuse instead: a cube shifting the wrong way is not a
                // thing anyone can debug from the firmware.
                if (dirIdx < 0) {
                    throw new ParseError(
                        `shift cube: "${dir}" is not a direction. ` +
                        `Use one of: ${CUBE_DIRECTIONS.join(', ')}.`);
                }
                return line(`bw_cube_shift(${dirIdx});`);
            }
            case 'ledcube_hold': {
                this._cUses.cube = true;
                return line(`bw_cube_hold(${v('DURATION')});`);
            }
            case 'ledcube_fillcolumn': {
                this._cUses.cube = true;
                return line(`bw_cube_fill_column(${v('X')}, ${v('Y')}, ${v('COLOUR')});`);
            }
            case 'ledcube_fillwall': {
                this._cUses.cube = true;
                return line(`bw_cube_fill_wall(${v('Z')}, ${v('COLOUR')});`);
            }
            case 'ledcube_invert': {
                this._cUses.cube = true;
                return line('bw_cube_invert();');
            }
            // ---- devices_* C lowerings ----
            // Each emits a call to an inline bw_* stub, emitted by the assembly
            // section when _cUses.devices is set. The stubs are no-ops on the
            // device target — they record the call so the simulator can read it,
            // but on bare metal a servo/LCD/motor needs a real driver library
            // that this emitter does not yet generate. The stubs make the code
            // COMPILE, which is better than a link error, and the /* TODO */
            // comment in each stub says what a real implementation would do.
            case 'devices_setservo': { this._cUses.devices = true; this._cUses.servo = true; return line(`bw_servo_set(${v('SERVO')}, ${v('ANGLE')});`); }
            case 'devices_servoangle': { this._cUses.devices = true; this._cUses.servo = true; return `bw_servo_get(${v('SERVO')})`; }
            case 'devices_setmotor': { this._cUses.devices = true; return line(`bw_motor_speed(${v('MOTOR')}, ${v('SPEED')});`); }
            case 'devices_motorspeed': { this._cUses.devices = true; return `bw_motor_get_speed(${v('MOTOR')})`; }
            case 'devices_setdirection': { this._cUses.devices = true; const d = f('DIR'); return line(`bw_motor_dir(${v('MOTOR')}, ${({ forward: 0, reverse: 1, brake: 2, coast: 3 })[d] || 0});`); }
            case 'devices_motordirection': { this._cUses.devices = true; return `bw_motor_get_dir(${v('MOTOR')})`; }
            case 'devices_setrelay': { this._cUses.devices = true; return line(`bw_relay_set(${v('RELAY')}, ${f('STATE') === 'on' ? 1 : 0});`); }
            case 'devices_devicestate': { this._cUses.devices = true; return `bw_device_state(${v('DEVICE')})`; }
            case 'devices_activate': { this._cUses.devices = true; return line(`bw_device_activate(${v('DEVICE')});`); }
            case 'devices_deactivate': { this._cUses.devices = true; return line(`bw_device_deactivate(${v('DEVICE')});`); }
            case 'devices_lcdprint': { this._cUses.devices = true; return line(`bw_lcd_print(${v('DISPLAY')}, ${v('TEXT')});`); }
            case 'devices_lcdcursor': { this._cUses.devices = true; return line(`bw_lcd_cursor(${v('DISPLAY')}, ${v('ROW')}, ${v('COL')});`); }
            case 'devices_lcdclear': { this._cUses.devices = true; return line(`bw_lcd_clear(${v('DISPLAY')});`); }
            case 'devices_showdigit': { this._cUses.devices = true; return line(`bw_7seg_show(${v('DISPLAY')}, ${v('DIGIT')});`); }
            case 'devices_setrgb': { this._cUses.devices = true; return line(`bw_rgb_set(${v('LED')}, ${v('R')}, ${v('G')}, ${v('B')});`); }
            case 'devices_setpixel': { this._cUses.devices = true; return line(`bw_matrix_set(${v('MATRIX')}, ${v('X')}, ${v('Y')}, ${v('BRIGHTNESS')});`); }
            case 'devices_clearmatrix': { this._cUses.devices = true; return line(`bw_matrix_clear(${v('MATRIX')});`); }
            case 'devices_setneopixel': { this._cUses.devices = true; return line(`bw_neopixel_set(${v('STRIP')}, ${v('INDEX')}, ${v('R')}, ${v('G')}, ${v('B')});`); }
            case 'devices_clearneopixels': { this._cUses.devices = true; return line(`bw_neopixel_clear(${v('STRIP')});`); }
            case 'devices_temperature': { this._cUses.devices = true; return `bw_temperature(${v('SENSOR')})`; }
            case 'devices_light': { this._cUses.devices = true; return `bw_light(${v('SENSOR')})`; }
            case 'devices_distance': { this._cUses.devices = true; return `bw_distance(${v('SENSOR')})`; }
            case 'devices_flex': { this._cUses.devices = true; return `bw_flex(${v('SENSOR')})`; }
            case 'devices_force': { this._cUses.devices = true; return `bw_force(${v('SENSOR')})`; }
            case 'devices_ircode': { this._cUses.devices = true; return `bw_ir_code(${v('SENSOR')})`; }
            case 'devices_pressed': { this._cUses.devices = true; return `bw_pressed(${v('BUTTON')})`; }
            case 'devices_above': { this._cUses.devices = true; return `bw_above(${v('SENSOR')}, ${v('THRESHOLD')})`; }
            case 'devices_closer': { this._cUses.devices = true; return `bw_closer(${v('SENSOR')}, ${v('DISTANCE')})`; }
            case 'devices_motion': { this._cUses.devices = true; return `bw_motion(${v('SENSOR')})`; }
            case 'devices_tilted': { this._cUses.devices = true; return `bw_tilted(${v('SENSOR')})`; }
            case 'devices_energised': { this._cUses.devices = true; return `bw_energised(${v('DEVICE')})`; }
            case 'procedures_call': return line(this.cProcCall(b, blocks));
            default: {
                const text = (this.decompileStackBlock(b, blocks, 0)[0] || b.opcode).trim();
                this.cWarn(`no C equivalent for "${text}" — emitted as a comment`);
                return line(`/* ${this.cComment(text)} */`);
            }
        }
    }

    // Does this stack contain a `wait`? Only then does its task need a deadline slot.
    cHasWait(firstId, blocks) {
        let id = firstId;
        while (id && blocks[id]) {
            const b = blocks[id];
            if (b.opcode === 'control_wait') return true;
            for (const k of ['SUBSTACK', 'SUBSTACK2']) {
                if (b.inputs[k] && this.cHasWait(b.inputs[k][1], blocks)) return true;
            }
            id = b.next;
        }
        return false;
    }

    cTaskFrom(firstId, blocks, level, ctx) {
        const lines = [];
        let id = firstId;
        const pad = '    '.repeat(level);
        while (id && blocks[id]) {
            lines.push(...this.cCommentLines(id, pad));
            lines.push(...this.cTaskBlock(blocks[id], blocks, level, ctx, id));
            id = blocks[id].next;
        }
        return lines;
    }

    // Record a yield point: `<task>_state == state` means "about to run this block".
    // The state number is minted here so the map can never disagree with the `case`
    // labels — they come from the same counter, in the same order.
    cYield(ctx, blockId, kind) {
        const state = ++ctx.state;
        ctx.yields.push({ task: ctx.task, state, block: blockId, kind });
        return state;
    }

    // One task's statements as the interior of a Duff's-device state machine. The switch
    // sits in the caller; case labels land inside whatever nesting the statements build,
    // which C allows as long as no inner switch appears (we emit none). Every wait AND
    // every loop back-edge is a numbered yield — the latter is Scratch's own scheduling
    // contract, and it is what makes a busy FOREVER unable to starve the other tasks.
    cTaskBlock(b, blocks, level, ctx, blockId) {
        const pad = '    '.repeat(level);
        const v = (k) => this.cVal(b.inputs[k], blocks);
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const sub = (k, lvl) => (b.inputs[k] ? this.cTaskFrom(b.inputs[k][1], blocks, lvl, ctx) : []);
        const cond = () => this.cCond(b.inputs.CONDITION ? b.inputs.CONDITION[1] : null, blocks);
        const task = ctx.task;
        switch (b.opcode) {
            case 'control_wait': {
                this._cUses.now = true;
                const s = this.cYield(ctx, blockId, 'wait');
                return [
                    `${pad}${task}_until = bw_now() + (${this.cMs(b.inputs.DURATION, blocks)});`,
                    `${pad}${task}_state = ${s};`,
                    `${pad}case ${s}:`,
                    `${pad}if ((int)(bw_now() - ${task}_until) < 0) return;`
                ];
            }
            case 'control_wait_until': {
                const s = this.cYield(ctx, blockId, 'wait-until');
                return [`${pad}${task}_state = ${s};`, `${pad}case ${s}:`, `${pad}if (!(${cond()})) return;`];
            }
            case 'control_forever': {
                const s = this.cYield(ctx, blockId, 'forever');
                return [`${pad}${task}_state = ${s};`, `${pad}case ${s}:`,
                    ...sub('SUBSTACK', level),
                    `${pad}${task}_state = ${s};`, `${pad}return;`];
            }
            case 'control_repeat': {
                // The counter has to survive the yield, so it is a static, not a local.
                const name = `bw_i${++this._cCounter}`;
                ctx.statics.push(name);
                const s = this.cYield(ctx, blockId, 'repeat');
                return [`${pad}${name} = (${v('TIMES')});`,
                    `${pad}${task}_state = ${s};`,
                    `${pad}case ${s}:`,
                    `${pad}if (${name}) {`,
                    ...sub('SUBSTACK', level + 1),
                    `${pad}    ${name}--;`,
                    `${pad}    ${task}_state = ${s};`,
                    `${pad}    return;`,
                    `${pad}}`];
            }
            case 'control_repeat_until': {
                const s = this.cYield(ctx, blockId, 'repeat-until');
                return [`${pad}${task}_state = ${s};`,
                    `${pad}case ${s}:`,
                    `${pad}if (!(${cond()})) {`,
                    ...sub('SUBSTACK', level + 1),
                    `${pad}    ${task}_state = ${s};`,
                    `${pad}    return;`,
                    `${pad}}`];
            }
            case 'control_if': return [`${pad}if (${cond()}) {`, ...sub('SUBSTACK', level + 1), `${pad}}`];
            case 'control_if_else': return [`${pad}if (${cond()}) {`, ...sub('SUBSTACK', level + 1),
                `${pad}} else {`, ...sub('SUBSTACK2', level + 1), `${pad}}`];
            case 'control_stop': {
                const option = f('STOP_OPTION');
                const others = option === 'this script' ? [task]
                    : option === 'other scripts in sprite' ? ctx.tasks.filter((t) => t !== task)
                        : ctx.tasks;
                const out = others.map((t) => `${pad}${t}_state = 0xFFFF;`);
                if (option !== 'other scripts in sprite') out.push(`${pad}return;`);
                return out;
            }
            // Everything else is the same statement in either mode (it cannot yield).
            default: return this.cStackBlock(b, blocks, level);
        }
    }

    // ================== host C target =========================================
    // The second C target. `generateC` emits bare metal for the 8051, where a
    // `move 10 steps` block has no meaning and saying so is correct. A project
    // that moves a sprite needs the other one: a portable C99 program that runs
    // the project the way `generatePython` does, against the shim in
    // cHostRuntime.js. Which target a project gets is decided by the project —
    // declared pins mean the chip, everything else means the host.
    //
    // These walkers mirror the PYTHON ones, not the device ones, because
    // Python's are already total: every block either has a case here or falls
    // through to the same OP_TO_SCRATCH lookup that gives Python its coverage.

    hcStr(s) { return `bw_str(${JSON.stringify(String(s))})`; }

    // A variable or list reference: sprite locals carry their sprite prefix, so
    // two sprites with a `count` each stay distinct in one flat C file.
    hcVar(name) {
        const base = (this._curLocals && this._curLocals.has(name))
            ? this._curPrefix + name : name;
        return this.cName(base);
    }

    // Unique C identifier for a function (two `when flag clicked` hats in one
    // sprite would otherwise collide, exactly as pyFreshName guards against).
    hcFresh(base) {
        let id = sanitizeIdent(base) || 'f';
        if (SB3Creator.C_RESERVED.has(id)) id += '_';
        const used = new Set(this._cNames ? this._cNames.values() : []);
        let final = id, n = 2;
        while (used.has(final)) final = id + '_' + n++;
        if (!this._cNames) this._cNames = new Map();
        this._cNames.set(Symbol(base), final);
        return final;
    }

    hcVal(input, blocks) {
        if (!Array.isArray(input)) return 'bw_num(0)';
        const inner = input[1];
        if (Array.isArray(inner)) {
            const [type, a] = inner;
            if (type === 12 || type === 13) return this.hcVar(a);
            return /^-?\d+(\.\d+)?$/.test(String(a)) ? `bw_num(${Number(a)})` : this.hcStr(a);
        }
        return this.hcRep(blocks[inner], blocks);
    }

    // `scratch.<method>(...)` from the shared table, spelled for C. Mirrors
    // runtimeObjCall rather than calling it, because the separator and the
    // arity-disambiguated names (say / say_for) are C's problem alone.
    hcScratchCall(b, blocks) {
        const e = OP_TO_SCRATCH[b.opcode];
        if (!e) return null;
        const args = e.gen.map((g) => {
            if (g.v) return this.hcVal(b.inputs[g.v], blocks);
            if (g.m) {
                const inp = b.inputs[g.m];
                if (Array.isArray(inp) && inp[0] === 3) return this.hcVal(inp, blocks);
                return this.hcStr(this.dmenu(inp, blocks, g.field || g.m));
            }
            if (g.f) return this.hcStr(b.fields[g.f] ? b.fields[g.f][0] : '');
            if (g.bc) return this.hcStr(this.dbroadcast(b.inputs[g.bc]).replace(/^"|"$/g, ''));
            return 'bw_num(0)';
        });
        return `${cShimName(e.m, args.length)}(${args.join(', ')})`;
    }

    // The Arrays & Vectors registry, the same shape as hcScratchCall. The 2-D and
    // functional blocks have no C implementation, so using one warns rather than
    // quietly returning 0 — the C would otherwise disagree with Python in silence.
    hcArraysCall(b, blocks) {
        const e = OP_TO_ARRAYS[b.opcode];
        if (!e) return null;
        if (SB3Creator.C_ARRAYS_UNIMPLEMENTED.has(e.m)) {
            this.hcWarn(b, blocks);
            return null;
        }
        const args = e.gen.map((g) => {
            if (g.v) return this.hcVal(b.inputs[g.v], blocks);
            if (g.m) {
                const inp = b.inputs[g.m];
                if (Array.isArray(inp) && inp[0] === 3) return this.hcVal(inp, blocks);
                return this.hcStr(this.dmenu(inp, blocks, g.field || g.m));
            }
            if (g.f) return this.hcStr(b.fields[g.f] ? b.fields[g.f][0] : '');
            return 'bw_num(0)';
        });
        return `arrays_${e.m}(${args.join(', ')})`;
    }

    hcRep(b, blocks) {
        if (!b) return 'bw_num(0)';
        const v = (k) => this.hcVal(b.inputs[k], blocks);
        const n = (k) => `bw_n(${this.hcVal(b.inputs[k], blocks)})`;
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const list = (k) => `&${this.hcVar(f(k))}`;
        switch (b.opcode) {
            case 'operator_add': return `bw_num(${n('NUM1')} + ${n('NUM2')})`;
            case 'operator_subtract': return `bw_num(${n('NUM1')} - ${n('NUM2')})`;
            case 'operator_multiply': return `bw_num(${n('NUM1')} * ${n('NUM2')})`;
            case 'operator_divide': return `bw_num(${n('NUM1')} / ${n('NUM2')})`;
            case 'operator_mod': return `bw_mod(${v('NUM1')}, ${v('NUM2')})`;
            case 'bitops_and': return `bw_num((double)((long)${n('NUM1')} & (long)${n('NUM2')}))`;
            case 'bitops_or': return `bw_num((double)((long)${n('NUM1')} | (long)${n('NUM2')}))`;
            case 'bitops_xor': return `bw_num((double)((long)${n('NUM1')} ^ (long)${n('NUM2')}))`;
            case 'bitops_shl': return `bw_num((double)((long)${n('NUM1')} << (long)${n('NUM2')}))`;
            case 'bitops_shr': return `bw_num((double)((long)${n('NUM1')} >> (long)${n('NUM2')}))`;
            case 'bitops_not': return `bw_num((double)(~(long)${n('NUM')}))`;
            case 'operator_random': return `bw_random(${v('FROM')}, ${v('TO')})`;
            case 'operator_round': return `bw_num(round(${n('NUM')}))`;
            case 'operator_mathop': return `bw_mathop(${JSON.stringify(f('OPERATOR'))}, ${v('NUM')})`;
            case 'operator_join': return `bw_join(${v('STRING1')}, ${v('STRING2')})`;
            case 'operator_letter_of': return `bw_letter(${v('STRING')}, ${v('LETTER')})`;
            case 'operator_length': return `bw_length(${v('STRING')})`;
            case 'operator_contains': return `bw_contains(${v('STRING1')}, ${v('STRING2')})`;
            case 'data_itemoflist': return `bw_list_item(${list('LIST')}, (int)${n('INDEX')})`;
            case 'data_itemnumoflist': return `bw_list_index(${list('LIST')}, ${v('ITEM')})`;
            case 'data_lengthoflist': return `bw_list_length(${list('LIST')})`;
            case 'data_listcontainsitem': return `bw_list_contains(${list('LIST')}, ${v('ITEM')})`;
            case 'sensing_answer': this._hcUses.answer = true; return 'bw_answer';
            case 'argument_reporter_string_number':
            case 'argument_reporter_boolean': return this.cName(f('VALUE'));
            case 'planetemaths_add': return `bw_num(${n('NUM1')} + ${n('NUM2')})`;
            case 'planetemaths_substract': return `bw_num(${n('NUM1')} - ${n('NUM2')})`;
            case 'planetemaths_multiply': return `bw_num(${n('NUM1')} * ${n('NUM2')})`;
            case 'planetemaths_divide': return `bw_num(${n('NUM1')} / ${n('NUM2')})`;
            case 'planetemaths_pow': return `bw_num(pow(${n('NUM1')}, ${n('NUM2')}))`;
            case 'planetemaths_oppose': return `bw_num(0 - ${n('NUM1')})`;
            case 'planetemaths_inverse': return `bw_num(1 / ${n('NUM1')})`;
            case 'planetemaths_pourcent': return `bw_num(${n('NUM1')} / 100)`;
            case 'planetemaths_nombre_pi': return 'bw_pi()';
            case 'planetemaths_nombre_e': return 'bw_e()';
            case 'planetemaths_factorial': return `bw_num(tgamma(${n('NUM1')} + 1))`;
            case 'planetemaths_min': return `bw_num(fmin(${n('NUM1')}, ${n('NUM2')}))`;
            case 'planetemaths_max': return `bw_num(fmax(${n('NUM1')}, ${n('NUM2')}))`;
            case 'planetemaths_random': return `bw_random(${v('NUM1')}, ${v('NUM2')})`;
            case 'planetemaths_join': return `bw_join(${v('STRING1')}, ${v('STRING2')})`;
            case 'planetemaths_letterOf': return `bw_letter(${v('STRING')}, ${v('LETTER')})`;
            case 'planetemaths_length': return `bw_length(${v('STRING')})`;
            case 'planetemaths_sommechiffres': return `bw_sumdigits(${v('NUM1')})`;
            default: {
                const ac = this.hcArraysCall(b, blocks);
                if (ac) return ac;
                const sc = this.hcScratchCall(b, blocks);
                if (sc) return sc;
                this.hcWarn(b, blocks);
                return 'bw_num(0)';
            }
        }
    }

    hcCond(ref, blocks) {
        const b = blocks[ref];
        if (!b) return '0';
        const v = (k) => this.hcVal(b.inputs[k], blocks);
        const c = (k) => (b.inputs[k] ? this.hcCond(b.inputs[k][1], blocks) : '0');
        const truthy = (e) => `(bw_n(${e}) != 0)`;
        switch (b.opcode) {
            case 'operator_gt': return `(bw_cmp(${v('OPERAND1')}, ${v('OPERAND2')}) > 0)`;
            case 'operator_lt': return `(bw_cmp(${v('OPERAND1')}, ${v('OPERAND2')}) < 0)`;
            case 'operator_equals': return `(bw_cmp(${v('OPERAND1')}, ${v('OPERAND2')}) == 0)`;
            case 'operator_and': return `(${c('OPERAND1')} && ${c('OPERAND2')})`;
            case 'operator_or': return `(${c('OPERAND1')} || ${c('OPERAND2')})`;
            case 'operator_not': return `(!${c('OPERAND')})`;
            case 'operator_contains': return truthy(`bw_contains(${v('STRING1')}, ${v('STRING2')})`);
            case 'data_listcontainsitem':
                return truthy(`bw_list_contains(&${this.hcVar(b.fields.LIST[0])}, ${v('ITEM')})`);
            case 'argument_reporter_boolean': return truthy(this.cName(b.fields.VALUE[0]));
            case 'planetemaths_gt': return `(bw_cmp(${v('NUM1')}, ${v('NUM2')}) < 0)`;
            case 'planetemaths_gte': return `(bw_cmp(${v('NUM1')}, ${v('NUM2')}) <= 0)`;
            case 'planetemaths_lt': return `(bw_cmp(${v('NUM1')}, ${v('NUM2')}) > 0)`;
            case 'planetemaths_lte': return `(bw_cmp(${v('NUM1')}, ${v('NUM2')}) >= 0)`;
            case 'planetemaths_equals': return `(bw_cmp(${v('NUM1')}, ${v('NUM2')}) == 0)`;
            case 'planetemaths_and': return `(${c('OPERAND1')} && ${c('OPERAND2')})`;
            case 'planetemaths_or': return `(${c('OPERAND1')} || ${c('OPERAND2')})`;
            case 'planetemaths_not': return `(!${c('OPERAND1')})`;
            case 'planetemaths_contains': return truthy(`bw_contains(${v('STRING1')}, ${v('STRING2')})`);
            case 'planetemaths_multiple':
                // Its own helper: `x mod y = 0` is a different block that happens
                // to mean the same thing, and the way back cannot guess which.
                return `bw_multiple(${v('NUM1')}, ${v('NUM2')})`;
            default: {
                const ac = this.hcArraysCall(b, blocks);
                if (ac) return truthy(ac);
                const sc = this.hcScratchCall(b, blocks);
                if (sc) return truthy(sc);
                this.hcWarn(b, blocks);
                return '0';
            }
        }
    }

    // A block with no host-C form. Unlike the device target this should stay
    // empty for ordinary projects — if it fills up, the table and the walkers
    // have drifted apart and that is worth knowing.
    hcWarn(b, blocks) {
        const text = (this.decompileStackBlock(b, blocks, 0)[0] || b.opcode).trim();
        const msg = `no host-C form for "${text}"`;
        if (!this._hcWarnings.includes(msg)) this._hcWarnings.push(msg);
    }

    hcStackFrom(firstId, blocks, level) {
        const out = [];
        let id = firstId;
        while (id && blocks[id]) {
            out.push(...this.codeCommentLines(id, '    '.repeat(level), '//'));
            out.push(...this.hcStackBlock(blocks[id], blocks, level));
            id = blocks[id].next;
        }
        return out;
    }

    hcStackBlock(b, blocks, level) {
        const pad = '    '.repeat(level);
        const v = (k) => this.hcVal(b.inputs[k], blocks);
        const n = (k) => `bw_n(${this.hcVal(b.inputs[k], blocks)})`;
        const f = (k) => (b.fields[k] ? b.fields[k][0] : '');
        const list = (k) => `&${this.hcVar(f(k))}`;
        const cond = (k) => (b.inputs[k] ? this.hcCond(b.inputs[k][1], blocks) : '0');
        const body = (k) => (b.inputs[k] ? this.hcStackFrom(b.inputs[k][1], blocks, level + 1) : []);
        const line = (t) => [pad + t];
        switch (b.opcode) {
            case 'control_forever': return [`${pad}for (;;) {`, ...body('SUBSTACK'), `${pad}}`];
            case 'control_repeat': {
                const i = `bw_i${++this._hcCounter}`;
                // A C99 for-init declaration, so the whole construct is one line
                // going out and one line coming back.
                return [`${pad}for (long ${i} = (long)${n('TIMES')}; ${i}-- > 0; ) {`,
                    ...body('SUBSTACK'), `${pad}}`];
            }
            case 'control_repeat_until':
                return [`${pad}while (!${cond('CONDITION')}) {`, ...body('SUBSTACK'), `${pad}}`];
            case 'control_while':
                return [`${pad}while (${cond('CONDITION')}) {`, ...body('SUBSTACK'), `${pad}}`];
            case 'control_if':
                return [`${pad}if (${cond('CONDITION')}) {`, ...body('SUBSTACK'), `${pad}}`];
            case 'control_if_else':
                return [`${pad}if (${cond('CONDITION')}) {`, ...body('SUBSTACK'),
                    `${pad}} else {`, ...body('SUBSTACK2'), `${pad}}`];
            case 'control_wait': return line(`bw_wait(${v('DURATION')});`);
            case 'control_wait_until': return line(`while (!${cond('CONDITION')}) ;`);
            case 'control_stop':
                return f('STOP_OPTION') === 'this script'
                    ? line('return;') : line(`${this.hcScratchCall(b, blocks)};`);
            case 'sensing_askandwait':
                this._hcUses.answer = true;
                return line(`bw_answer = bw_ask(${v('QUESTION')});`);
            case 'data_setvariableto': return line(`${this.hcVar(f('VARIABLE'))} = ${v('VALUE')};`);
            case 'data_changevariableby':
                // Not `x = bw_num(bw_n(x) + …)`: that is byte-identical to what
                // `set x to x + 1` emits, and the way back could not tell the two
                // blocks apart. A named helper keeps the distinction.
                return line(`bw_change(&${this.hcVar(f('VARIABLE'))}, ${v('VALUE')});`);
            case 'data_addtolist': return line(`bw_list_add(${list('LIST')}, ${v('ITEM')});`);
            case 'data_deleteoflist': return line(`bw_list_delete(${list('LIST')}, (int)${n('INDEX')});`);
            case 'data_deletealloflist': return line(`bw_list_delete_all(${list('LIST')});`);
            case 'data_insertatlist':
                return line(`bw_list_insert(${list('LIST')}, (int)${n('INDEX')}, ${v('ITEM')});`);
            case 'data_replaceitemoflist':
                return line(`bw_list_replace(${list('LIST')}, (int)${n('INDEX')}, ${v('ITEM')});`);
            case 'procedures_call': {
                const m = b.mutation;
                const argIds = JSON.parse(m.argumentids || '[]');
                let ai = 0; const args = [];
                m.proccode.replace(/%[sb]/g, (tok) => {
                    const input = b.inputs[argIds[ai++]];
                    args.push(tok === '%b'
                        ? `bw_bool(${this.hcCond(input[1], blocks)})`
                        : this.hcVal(input, blocks));
                    return '';
                });
                return line(`${this.cName(this._curPrefix + this.pyProcRaw(m.proccode))}(${args.join(', ')});`);
            }
            default: {
                const ac = this.hcArraysCall(b, blocks);
                if (ac) return line(ac + ';');
                const sc = this.hcScratchCall(b, blocks);
                if (sc) return line(sc + ';');
                this.hcWarn(b, blocks);
                const ps = (this.decompileStackBlock(b, blocks, 0)[0] || b.opcode).trim();
                return line(`/* ${ps} */`);
            }
        }
    }

    // The whole program. Mirrors generatePython's shape — global state, one
    // function per script, structural markers so the project round-trips —
    // with C's constraints: markers must live inside a function, and every
    // function needs a prototype before it is called.
    // Everything the extension offers has a C form now: the value model grew a
    // list kind for reverse/sort/slice/transpose/reshape, and map/filter/reduce
    // evaluate their lambda text with a small parser over the subset those
    // blocks contain. The set stays as the place to name a block that has no C
    // form, so one reappearing is a warning rather than a silent zero.
    static C_ARRAYS_UNIMPLEMENTED = new Set([]);

    generateHostC(project = this.project, opts = {}) {
        this._cNames = new Map();
        this._hcWarnings = [];
        this._hcUses = { answer: false };
        this._hcCounter = 0;
        this._emitComments = opts.comments !== false;
        const targets = project.targets || [];
        this._buildCodeComments(targets);

        const stage = targets.find((t) => t.isStage);
        const gScalars = stage ? Object.values(stage.variables || {}).map((v) => v[0]) : [];
        const gLists = stage ? Object.values(stage.lists || {}).map((l) => l[0]) : [];

        const sections = targets.filter((t) => !t.isStage
            || Object.values(t.blocks || {}).some((b) => b.topLevel));

        const decls = [];           // file-scope state
        const protos = [];          // every function, declared before use
        const defs = [];            // the functions themselves
        const structure = [];       // marker calls, for the round trip
        const flagCalls = [];

        for (const name of gScalars) decls.push(`static bw_val ${this.cName(name)};`);
        for (const name of gLists) decls.push(`static bw_list ${this.cName(name)};`);
        for (const name of gScalars) structure.push(`    scratch_global_var(${this.hcStr(name)});`);
        for (const name of gLists) structure.push(`    scratch_global_list(${this.hcStr(name)});`);

        sections.forEach((t, idx) => {
            const pfx = spritePrefix(idx);
            const localScalars = t.isStage ? [] : Object.values(t.variables || {}).map((v) => v[0]);
            const localLists = t.isStage ? [] : Object.values(t.lists || {}).map((l) => l[0]);
            this._curPrefix = pfx;
            this._curLocals = new Set([...localScalars, ...localLists]);
            for (const name of localScalars) decls.push(`static bw_val ${this.hcVar(name)};`);
            for (const name of localLists) decls.push(`static bw_list ${this.hcVar(name)};`);

            if (t.isStage) structure.push('    scratch_stage();');
            else {
                const shape = t.costumes && t.costumes[0] && t.costumes[0]._shapeSpec;
                structure.push(shape
                    ? `    scratch_sprite_shape(${this.hcStr(t.name)}, ${this.hcStr(shape)});`
                    : `    scratch_sprite(${this.hcStr(t.name)});`);
            }
            for (const name of localScalars) structure.push(`    scratch_local(${this.hcStr(name)});`);
            for (const name of localLists) structure.push(`    scratch_local_list(${this.hcStr(name)});`);
            for (const cos of (t.costumes || []).slice(1)) {
                structure.push(`    scratch_costume(${this.hcStr(cos._spec || cos.name)});`);
            }
            for (const snd of (t.sounds || []).slice(1)) {
                structure.push(`    scratch_sound(${this.hcStr(snd.name)});`);
            }

            const blocks = t.blocks || {};
            for (const b of Object.values(blocks)) {
                if (!b.topLevel || !this.isHat(b.opcode)) continue;
                if (b.opcode === 'procedures_definition') {
                    const proto = blocks[b.inputs.custom_block[1]];
                    const m = proto.mutation;
                    const argNames = JSON.parse(m.argumentnames || '[]').map((a) => this.cName(a));
                    const fn = this.cName(pfx + this.pyProcRaw(m.proccode));
                    const params = argNames.length
                        ? argNames.map((a) => `bw_val ${a}`).join(', ') : 'void';
                    // External linkage on purpose: a custom block or an event handler
                    // that nothing calls is still meaningful -- it is an entry point for
                    // whatever drives the shim -- and `static` would make an uncalled one
                    // a warning under -Werror.
                    protos.push(`void ${fn}(${params});`);
                    // The marker keeps the exact proccode and warp flag, which a flat
                    // C name cannot encode — the same reason Python emits defblock().
                    defs.push([
                        `/* DEFINE ${m.proccode} */`,
                        `void ${fn}(${params})`, '{',
                        `    scratch_defblock(${this.hcStr(m.proccode)}, bw_num(${m.warp === 'true' ? 1 : 0}));`,
                        ...this.hcStackFrom(b.next, blocks, 1), '}',
                    ].join('\n'));
                } else {
                    const fn = this.hcFresh(pfx + this.pyHatBase(b));
                    protos.push(`void ${fn}(void);`);
                    // A comment attached to the hat belongs to the script; `//` so
                    // the way back can tell it from the emitter's own /* notes */.
                    const note = this.codeCommentLines(b.id || Object.keys(blocks)
                        .find((k) => blocks[k] === b), '', '//');
                    const head = b.opcode === 'event_whenflagclicked'
                        ? [] : [`/* ${this.decompileHat(b, blocks)} — call when that happens */`];
                    defs.push([...note, ...head, `void ${fn}(void)`, '{',
                        ...this.hcStackFrom(b.next, blocks, 1), '}'].join('\n'));
                    if (b.opcode === 'event_whenflagclicked') flagCalls.push(`    ${fn}();`);
                }
            }
        });
        this._curPrefix = ''; this._curLocals = null;

        const program = [];
        if (decls.length) program.push(...decls, '');
        if (this._hcUses.answer) program.push('static bw_val bw_answer;', '');
        if (protos.length) program.push(...protos, '');
        if (structure.length) {
            program.push('/* Project structure, so the C reads back as the same blocks. */',
                'static void bw_structure(void)', '{', ...structure, '}', '');
        }
        for (const d of defs) program.push(d, '');
        program.push('int main(void)', '{');
        if (structure.length) program.push('    bw_structure();');
        program.push(...flagCalls, '    return 0;', '}');

        const body = program.join('\n');
        const out = [
            '/* Generated by Brickwright — blocks → C (host).',
            ' * Scratch blocks map to a `scratch_*` shim you can point at a real renderer;',
            ' * the structure calls in bw_structure() are what make this read back as the',
            ' * same project. For the STC12/8051 this is the WRONG target — declare pins',
            ' * and you get bare metal instead. */',
            // 200809L, not 199309L: POSIX.1b gets nanosleep but predates C99, so the
            // headers then hide snprintf and every generated program fails to compile
            // with an implicit declaration. POSIX.1-2008 has both.
            '#define _POSIX_C_SOURCE 200809L   /* nanosleep, and C99 in the headers */',
            ...C_HOST_INCLUDES.map((h) => `#include <${h}>`),
            '',
            cHostRuntime(body),
            '/* @bw-program — everything above is runtime; the project starts here. */',
            body,
            '',
        ];
        return out.join('\n');
    }

    generateC(project = this.project, opts = {}) {
        // Which C? The project decides. Declared pins mean the chip and bare
        // metal; anything else is a Scratch program, and emitting 8051 register
        // writes for it produced the 390 "no C equivalent" warnings this split
        // exists to end. `opts.target` overrides for the rare case of wanting
        // the other one on purpose.
        const stc = project && project.stc;
        const hasPins = !!(stc && stc.pins && stc.pins.length);
        const hasHardware = hasPins || !!(stc && stc.ledcube);
        const want = opts.target || (hasHardware ? 'device' : 'host');
        if (want === 'host') return this.generateHostC(project, opts);

        this._cNames = new Map();
        this._cCounter = 0;
        this._cWarnings = [];
        this._cUses = { adc: false, delay: false, blockDelay: false, now: false };
        this._emitComments = !(opts && opts.comments === false);
        const targets = project.targets || [];
        this._buildCodeComments(targets);

        const stored = project.stc || {};
        const device = String(opts.device || stored.device || 'stc12c5a60s2').toLowerCase();
        const clock = Number(opts.clock || stored.clock || 11059200);
        const pins = opts.pins || stored.pins || [];
        const part = SB3Creator.STC_PARTS[device];
        if (!part) this.cWarn(`unknown DEVICE "${device}" — emitting for stc12c5a60s2`);
        // A board whose pins are numbers has no P1_0 to assign and no port-mode
        // register to set up, so falling back to the 8051 emitter would produce
        // a file that compiles for the wrong chip out of pins that do not exist
        // on it. Refusing by name is the only honest answer until the Arduino
        // back end lands; stc-compiler can already build these, and says so.
        if (part && part.core && part.core !== '8051') {
            const how = part.core === 'micropython'
                ? 'runs MicroPython, where the program IS the artefact and there is nothing to compile'
                : 'has numbered pins and no 8051 registers';
            this.cWarn(`DEVICE ${device.toUpperCase()} ${how} — `
                + 'this back end emits bare-metal 8051 only. The project is unchanged; '
                + 'build it with stc-compiler, which has a target for this board.');
            return `/* No C emitted for DEVICE ${device.toUpperCase()}.\n`
                + ' *\n'
                + ' * This back end emits bare-metal 8051. An Arduino board has numbered\n'
                + ' * pins (D13, A0) and none of the registers this emitter writes, so\n'
                + ' * there is nothing here it could correctly produce.\n'
                + ' *\n'
                + ' * The pseudocode form of this project IS portable: stc-compiler\n'
                + ' * builds it for the Arduino targets.\n'
                + ' */\n';
        }
        const chip = part || SB3Creator.STC_PARTS.stc12c5a60s2;
        this._cPins = new Map(pins.map((p) => [String(p.name).toLowerCase(), p]));

        const stage = targets.find((t) => t.isStage);
        // Same section rule as the Python/JS back ends, so sprite prefixes line up.
        const sections = targets.filter((t) => !t.isStage || Object.values(t.blocks || {}).some((b) => b.topLevel));

        // Pass 1 — count scripts that become tasks. Several means the cooperative
        // scheduler; exactly one `when green flag clicked` keeps straight-line code in
        // main(). A `when X pressed` hat ALWAYS forces the scheduler — there is no
        // straight-line form of something that has to be sampled.
        let scriptCount = 0;
        let hasEventHat = false;
        for (const t of sections) {
            for (const b of Object.values(t.blocks || {})) {
                if (!b.topLevel) continue;
                if (b.opcode === 'event_whenflagclicked') scriptCount++;
                if (b.opcode === 'stc12_whenpin') {
                    const pn = b.fields.PIN ? b.fields.PIN[0] : '';
                    const pc = this._cPins && this._cPins.get(pn.toLowerCase());
                    if (pc && pc.direction === 'input') { scriptCount++; hasEventHat = true; }
                }
            }
        }
        // `{debug: true}` forces the scheduler even for one script. Straight-line code in
        // main() has no `<task>_state`, so it has no Level 1 position — and a debugger that
        // cannot say where it is in the commonest beginner project (a single WHEN) is not
        // worth having. The cooperative form costs the Timer-0 ISR and a dispatch loop and
        // changes nothing semantically: a lone task that yields simply re-enters at once.
        // Release builds are untouched. See reference/debugger-ui.md §7.
        // Event hats always force the scheduler — a polled task has no straight-line form.
        const debug = !!(opts && opts.debug);
        this._cTasks = scriptCount > 1 || hasEventHat || (scriptCount > 0 && debug);
        const taskNames = Array.from({ length: scriptCount }, (_, n) => `bw_task${n}`);
        const yieldMap = [];   // only emitted for a debug build — see the marker header below

        // Pass 2 — declare state. Names are claimed here so a custom block's parameter can
        // never quietly take a variable's identifier.
        const stateDecls = [];
        const markVars = [], markProcs = [], markScripts = [];
        for (const entry of Object.values((stage && stage.variables) || {})) {
            stateDecls.push(`static int ${this.cName(entry[0])} = ${this.cInit(entry[1])};`);
            markVars.push(`var ${this.cName(entry[0])} ${this.pyStr(entry[0])}`);
        }
        sections.forEach((t, idx) => {
            if (t.isStage) return;
            const pfx = spritePrefix(idx);
            for (const entry of Object.values(t.variables || {})) {
                stateDecls.push(`static int ${this.cName(pfx + entry[0])} = ${this.cInit(entry[1])};   /* ${this.cComment(t.name)}: ${this.cComment(entry[0])} */`);
                markVars.push(`var ${this.cName(pfx + entry[0])} ${this.pyStr(entry[0])} sprite ${this.pyStr(t.name)}`);
            }
        });

        // Pass 3 — walk the scripts.
        const procProtos = [], procDefs = [], taskDefs = [];
        const statics = [];
        let mainBody = [];
        let mainNote = [];   // a comment on the single script's hat
        let taskIndex = 0;
        sections.forEach((t, idx) => {
            const pfx = spritePrefix(idx);
            this._curPrefix = pfx;
            this._curLocals = t.isStage ? new Set()
                : new Set([...Object.values(t.variables || {}).map((v) => v[0]),
                    ...Object.values(t.lists || {}).map((l) => l[0])]);
            const blocks = t.blocks || {};
            for (const [topId, b] of Object.entries(blocks)) {
                if (!b || !b.topLevel) continue;
                if (b.opcode === 'procedures_definition') {
                    const proto = blocks[b.inputs.custom_block[1]];
                    const m = proto.mutation;
                    const argNames = JSON.parse(m.argumentnames || '[]').map((a) => this.cName(a));
                    const fn = this.cName(pfx + this.pyProcRaw(m.proccode));
                    const params = argNames.length ? argNames.map((a) => `int ${a}`).join(', ') : 'void';
                    procProtos.push(`static void ${fn}(${params});`);
                    markProcs.push(`proc ${fn} ${this.pyStr(m.proccode)} warp=${m.warp === 'true' ? 1 : 0}`);
                    procDefs.push(`/* ${this.cComment(m.proccode.replace(/%[sb]/g, '').trim())} */`,
                        `static void ${fn}(${params})`, '{',
                        ...this.cStackFrom(b.next, blocks, 1), '}', '');
                } else if (b.opcode === 'event_whenflagclicked') {
                    const n = taskIndex++;
                    const task = taskNames[n];
                    const where = t.isStage ? '' : `, ${this.cComment(t.name)}`;
                    // A comment on the hat belongs to the script. The host target
                    // carries it; this one was dropping it, which is the only thing
                    // that stopped a device round trip from being a fixed point.
                    const hatNote = this.codeCommentLines(topId, '', '//');
                    markScripts.push(`script ${this._cTasks ? task : 'main'} ${n}`
                        + (t.isStage ? ' stage' : ` sprite ${this.pyStr(t.name)}`));
                    if (!this._cTasks) {
                        mainNote = hatNote;
                        mainBody = this.cStackFrom(b.next, blocks, 1);
                        continue;
                    }
                    // State 0 is `case 0:` — the task has not started, so the block to point
                    // at is the hat itself. That is what Scratch shows for a script that has
                    // not run, and it means the map covers every reachable state.
                    const ctx = { task, state: 0, statics, tasks: taskNames, yields: debug ? yieldMap : [] };
                    if (debug) yieldMap.push({ task, state: 0, block: topId, kind: 'hat' });
                    const body = this.cTaskFrom(b.next, blocks, 1, ctx);
                    taskDefs.push(`static unsigned int ${task}_state;`);
                    if (this.cHasWait(b.next, blocks)) taskDefs.push(`static unsigned int ${task}_until;`);
                    taskDefs.push(...hatNote,
                        `/* when green flag clicked (script ${n + 1}${where}) */`,
                        `static void ${task}(void)`, '{',
                        `    switch (${task}_state) {`,
                        '    case 0:',
                        ...body,
                        '    }',
                        `    ${task}_state = 0xFFFF;   /* ran to the end */`,
                        '}', '');
                } else if (b.opcode === 'stc12_whenpin') {
                    const pinName = b.fields.PIN ? b.fields.PIN[0] : '';
                    const edge = b.fields.EDGE ? b.fields.EDGE[0] : 'pressed';
                    const pin = this._cPins && this._cPins.get(pinName.toLowerCase());
                    if (!pin) {
                        this.cWarn(`"when ${pinName} ${edge}" — undeclared pin; script skipped`);
                    } else if (pin.direction !== 'input') {
                        this.cWarn(`"when ${pinName} ${edge}" — ${pinName} is ${pin.direction.toUpperCase()}, not INPUT; script skipped`);
                    } else {
                        const n = taskIndex++;
                        const task = taskNames[n];
                        const where = t.isStage ? '' : `, ${this.cComment(t.name)}`;
                        const hatNote = this.codeCommentLines(topId, '', '//');
                        markScripts.push(`script ${task} ${n}`
                            + (t.isStage ? ' stage' : ` sprite ${this.pyStr(t.name)}`));
                        const ctx = { task, state: 0, statics, tasks: taskNames, yields: debug ? yieldMap : [] };
                        if (debug) yieldMap.push({ task, state: 0, block: topId, kind: 'hat' });
                        // Body starts at case 1 — case 0 is the edge test.
                        ctx.state = 1;
                        const body = this.cTaskFrom(b.next, blocks, 1, ctx);
                        // The polarity-aware LOGICAL level — same rule as cPinRead: ACTIVE
                        // LOW means pressed = pin low, so `!Px_y` reads as 1 when pressed.
                        const sfr = `P${pin.port}_${pin.bit}`;
                        const level = pin.activeLow ? `!${sfr}` : sfr;
                        const test = edge === 'pressed'
                            ? `now && !${task}_prev`
                            : `!now && ${task}_prev`;
                        taskDefs.push(`static unsigned int ${task}_state;`);
                        if (this.cHasWait(b.next, blocks)) taskDefs.push(`static unsigned int ${task}_until;`);
                        taskDefs.push(`static unsigned char ${task}_prev;`);
                        taskDefs.push(...hatNote,
                            `/* WHEN ${this.cComment(pinName)} ${edge}: (script ${n + 1}${where})`,
                            ' *',
                            ` * Polled once per dispatch and EDGE-triggered: \`_prev\` is updated on every`,
                            ` * pass, so a held button runs the body once rather than every millisecond,`,
                            ` * and a release during the body does not queue a second run. The level read`,
                            ` * is the LOGICAL one, so an ACTIVE LOW button reads as pressed when the pin`,
                            ` * is low. */`,
                            `static void ${task}(void)`, '{',
                            `    unsigned char now   = (${level}) ? 1 : 0;`,
                            `    unsigned char fired = (${test}) ? 1 : 0;`,
                            `    ${task}_prev = now;`,
                            '',
                            `    switch (${task}_state) {`,
                            '    case 0:',
                            '        if (!fired)',
                            '            return;',
                            `        ${task}_state = 1;`,
                            '    case 1:',
                            ...body,
                            '    }',
                            `    ${task}_state = 0;   /* ready for the next edge */`,
                            '}', '');
                    }
                } else if (this.isHat(b.opcode) || this.runtimeOp(b.opcode)) {
                    this.cWarn(`"${this.decompileHat(b, blocks) || b.opcode}" has no meaning on the chip — script skipped`);
                }
            }
        });
        this._curPrefix = ''; this._curLocals = null;
        // The cube scan kernel needs delay_ms unconditionally — it is a blocking
        // per-line dwell, not a scheduler wait. Flag it so the assembly emits it
        // even when the scheduler is active (which normally suppresses delay_ms
        // in favour of the ISR-based bw_now/bw_block_ms).
        if (this._cUses.cube) this._cUses.cubeDelay = true;
        if (this._cUses.adc && !chip.adc) this.cWarn(`ANALOG pins need an ADC, and the ${device} has none`);

        // ---- assemble ----------------------------------------------------------------
        const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0');
        const out = [
            '/* Generated by Brickwright — blocks → C for the STC12 / 8051.',
            // This used to read "Hand edits will be lost; change the project
            // instead." The first half is still true and the second stopped
            // being true once the C reader landed: edits are no longer a dead
            // end, they just do not survive a REGENERATION. Telling someone
            // their only option is to go back to the blocks now sends them the
            // long way round.
            ' * Regenerating from the project overwrites this file. Your edits are not',
            ' * stuck here though — the C reader imports this back into blocks, and it',
            ' * names anything it cannot represent rather than dropping it in silence.'
        ];
        // closed either by the not-an-STC12-program diagnostic below, or here
        if (!(pins.length === 0 && this._cWarnings.length > 3)) out.push(' */');
        // A Scratch program compiled to C produces one "no equivalent" warning per block —
        // 52 of them for a Minesweeper, which reads as a broken tool rather than as the
        // honest answer, which is that a sprite has no meaning on a microcontroller. Lead
        // with that once, then summarise. Only projects that declare pins get the detail.
        const noPins = !pins.length;
        if (noPins && this._cWarnings.length > 3) {
            out.push(' *',
                ' * THIS PROJECT IS NOT AN STC12 PROGRAM. It declares no pins, and'
                + ` ${this._cWarnings.length} of its blocks have no meaning on a`,
                ' * microcontroller (sprites, lists, sounds and the like). What follows will'
                + ' compile,',
                ' * but it does nothing on hardware.',
                ' *',
                ' * To target the chip, declare what is wired to it and drive it — see the'
                + ' stc_blink',
                ' * example, or write:  DEVICE STC12C5A60S2 / PIN led = P1.0 OUTPUT ACTIVE'
                + ' LOW / turn on led',
                ' */');
            const shown = this._cWarnings.slice(0, 3);
            for (const w of shown) out.push(`/* warning: ${this.cComment(w)} */`);
            out.push(`/* warning: …and ${this._cWarnings.length - shown.length} more of the same kind. */`);
        } else {
            for (const w of this._cWarnings) out.push(`/* warning: ${this.cComment(w)} */`);
        }

        const tables = (this.project && this.project.stc && this.project.stc.tables) || [];

        // The marker header: everything the flat C form cannot say for itself, stated by the
        // emitter instead of left to be inferred. Same device as `scratch.defblock(...)` /
        // `scratch.sprite(...)` in the Python and JS back ends, and for the same reason — it
        // is what makes a C -> blocks front end a bounded parser rather than a guessing game.
        // `#include <stc12.h>` cannot distinguish stc12c5a60s2 from stc15f2k60s2; `cName`
        // mangling is not reversible; a proccode's %s/%b positions are lost in the C name;
        // and the Duff's-device form hides where one script ends and the next begins.
        // Suppress with `{markers: false}` if you only want the C.
        if (!(opts && opts.markers === false)) {
            const marks = [
                `device ${device}`,
                `clock ${clock}`,
                ...pins.map((p) => `pin ${p.name} P${p.port}.${p.bit} ${p.direction}${p.activeLow ? ' active-low' : ''}`),
                ...tables.map((t) => `table ${t.name} ${t.values.length}`),
                ...markVars, ...markProcs, ...markScripts,
                // The yield map: `<task>_state == N` means "about to run this block". It is
                // the only thing that turns a Level 1 position into something the block
                // editor can point at, and only the emitter knows it — the C form has lost
                // it by the time stc_symtab or either emulator sees the file.
                //
                // Debug builds only, and that is not squeamishness: block ids are minted
                // afresh by every parse, so emitting them unconditionally would make
                // generateC's output differ run to run for the same program. That breaks
                // the `C -> pseudocode -> C` fixed point the other three languages hold
                // themselves to, and makes emitted C undiffable. A debugger asks for
                // {debug: true} anyway — it needs the scheduler form regardless.
                // reference/debugger-ui.md §7 is the normative spec.
                ...yieldMap.map((y) => `yield ${y.task} ${y.state} ${this.cMark(y.block)} ${y.kind}`)
            ];
            out.push('/* @bw-begin — machine-readable; do not hand-edit.');
            for (const m of marks) out.push(` * @bw ${this.cComment(m)}`);
            out.push(' * @bw-end */');
        }
        out.push(`#include <${chip.header}>`, '');
        out.push(`#define FOSC_HZ ${clock}UL`, '');
        out.push('/* Timer 0, mode 1, clocked at FOSC/12 — accuracy depends only on FOSC, and',
            ' * every supported family counts this mode identically, so the same program is',
            ' * timing-correct on a 12T STC89 and a 1T STC12 or STC15. Nothing generated here',
            ' * ever busy-waits on a cycle count. */',
            '#define T0_RELOAD (65536UL - (FOSC_HZ / 12UL / 1000UL))', '');

        if (this._cTasks) {
            out.push('/* One script = one cooperative task. Timer 0 interrupts every millisecond;',
                ' * tasks yield at every wait and at every loop iteration (Scratch\'s own',
                ' * scheduling contract), so no task can starve the others. */',
                'static volatile unsigned int bw_ms;', '',
                'void bw_tick(void) __interrupt(1)',
                '{',
                '    TL0 = (unsigned char)(T0_RELOAD & 0xFF);',
                '    TH0 = (unsigned char)(T0_RELOAD >> 8);',
                '    bw_ms++;',
                '}', '');
            if (this._cUses.now || this._cUses.blockDelay) {
                out.push('/* A 16-bit read is not atomic on an 8051; hold the tick off. */',
                    'static unsigned int bw_now(void)',
                    '{',
                    '    unsigned int t;',
                    '    ET0 = 0;',
                    '    t = bw_ms;',
                    '    ET0 = 1;',
                    '    return t;',
                    '}', '');
            }
            if (this._cUses.blockDelay) {
                out.push('/* A wait inside a custom block: those run to completion in Scratch too, so',
                    ' * this one really does block — but on the tick, never on a cycle count. */',
                    'static void bw_block_ms(unsigned int ms)',
                    '{',
                    '    unsigned int start = bw_now();',
                    '    while ((int)(bw_now() - start - ms) < 0) ;',
                    '}', '');
            }
        } else if (this._cUses.delay) {
            out.push('static void delay_ms(unsigned int ms)',
                '{',
                '    while (ms--) {',
                '        TL0 = (unsigned char)(T0_RELOAD & 0xFF);',
                '        TH0 = (unsigned char)(T0_RELOAD >> 8);',
                '        TF0 = 0;',
                '        TR0 = 1;',
                '        while (!TF0) ;',
                '        TR0 = 0;',
                '        TF0 = 0;',
                '    }',
                '}', '');
        }
        // The cube scan kernel always needs delay_ms (blocking per-line dwell).
        // The normal path emits it only when !_cTasks && _cUses.delay; if the
        // scheduler is active (or no wait blocks exist), it was not emitted.
        const delayAlreadyEmitted = !this._cTasks && this._cUses.delay;
        if (this._cUses.cubeDelay && !delayAlreadyEmitted) {
            out.push('/* Blocking delay for the cube scan kernel (per-line dwell). */',
                'static void delay_ms(unsigned int ms)',
                '{',
                '    while (ms--) {',
                '        TL0 = (unsigned char)(T0_RELOAD & 0xFF);',
                '        TH0 = (unsigned char)(T0_RELOAD >> 8);',
                '        TF0 = 0;',
                '        TR0 = 1;',
                '        while (!TF0) ;',
                '        TR0 = 0;',
                '        TF0 = 0;',
                '    }',
                '}', '');
        }

        if (this._cUses.adc) {
            out.push('/* 10-bit ADC, polled. Channel n is on P1.n; the channel is selected and the',
                ' * conversion started in one write, as STC\'s own examples do. */',
                'static unsigned int adc_read(unsigned char channel)',
                '{',
                '    unsigned char settle;',
                '    ADC_CONTR = (unsigned char)(0xE8 | channel);  /* power|fast|start|chan */',
                '    for (settle = 0; settle < 8; settle++) ;      /* let the mux settle */',
                '    while (!(ADC_CONTR & 0x10)) ;                 /* wait for ADC_FLAG */',
                '    ADC_CONTR &= ~0x10;                           /* clear it by hand */',
                '    return ((unsigned int)ADC_RES << 2) | (ADC_RESL & 0x03);',
                '}', '');
        }

        // Lookup tables: constant bytes in code space (__code flash).
        // (tables was declared earlier, before the marker header that references it.)
        if (tables.length) {
            out.push('/* Lookup tables live in code space: flash is the abundant resource',
                ' * here and RAM is not. `const __code` keeps them out of the 256 bytes',
                ' * that matter. */');
            const hex2 = (n) => '0x' + n.toString(16).toUpperCase().padStart(2, '0');
            for (const t of tables) {
                out.push(`static const __code unsigned char bw_tab_${t.name}[] = { ${t.values.map(hex2).join(', ')} };`);
            }
            out.push('', '/* A computed index is clamped rather than trusted. Reading past a',
                ' * table means reading a random byte of flash and, on a display,',
                ' * showing it — which looks like data rather than like a fault. */',
                'static unsigned char bw_clamp(int i, unsigned char last)',
                '{',
                '    if (i < 0) return 0;',
                '    if (i > (int)last) return last;',
                '    return (unsigned char)i;',
                '}', '');
        }

        // LED cube runtime: working frame buffer, scan kernel, and helper functions.
        // The voxel map is unknown (stc/src/20-ledcube/README.md): the blocks work on a
        // logical grid and the mapping table (identity for now) translates at emit time.
        if (this._cUses.cube) {
            const cube = (this.project && this.project.stc && this.project.stc.ledcube) || { size: 4, selects: 8, bits: 8 };
            const S = cube.selects;
            const N = cube.size;   // side length (4 for a 4×4×4)
            out.push(`/* LED cube: ${cube.size}x${cube.size}x${cube.size}, ${S} select lines, multiplex scan.`,
                ' *',
                ' * P0 POLARITY — ACTIVE-HIGH.  Measured: emu8051-stc Finding #14, P0',
                ' * value histogram over 5 s of vendor firmware, zero exceptions in 3,930+',
                ' * writes (0x00 always blank, 0xFF always data).  Not yet confirmed on',
                ' * silicon — probe.c on a real cube is the definitive check.  Changing',
                ' * this one constant flips every frame, clear, fill and blank. */',
                '#define BW_CUBE_ACTIVE_HIGH 1',
                `#define BW_CUBE_BLANK  (BW_CUBE_ACTIVE_HIGH ? 0x00 : 0xFF)`,
                `#define BW_CUBE_FILL   (BW_CUBE_ACTIVE_HIGH ? 0xFF : 0x00)`,
                `#define BW_CUBE_ON(b)  (BW_CUBE_ACTIVE_HIGH ? (1u << (b)) : ~(1u << (b)))`,
                '',
                `static const __code unsigned char bw_cube_sel[${S}] = {`,
                `    ${Array.from({ length: S }, (_, i) => '0x' + ((~(1 << i)) & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(', ')}`,
                '};',
                `static unsigned char bw_cube_frame[${S}];   /* working frame buffer */`,
                '',
                `static void bw_cube_scan(unsigned int ms)`,
                '{',
                '    unsigned int end;',
                '    unsigned char i;',
                `    end = ms;   /* iterations, ~1 ms each at ${S} lines × ~125 µs/line */`,
                '    while (end--) {',
                `        for (i = 0; i < ${S}; i++) {`,
                '            /* A layer must never be enabled while P0 holds another',
                '             * line\'s data — blank first, then select, then drive. */',
                '            P0 = BW_CUBE_BLANK;',
                '            P2 = bw_cube_sel[i];',
                '            P0 = bw_cube_frame[i];',
                '            delay_ms(1);',
                '        }',
                '    }',
                '}',
                '',
                `/* VOXEL MAP — UNVERIFIED.  Assumed identity: (x, y, z) maps to`,
                ` * select = z * 2, bit = y * ${N} + x.  Only probe.c on a real cube can`,
                ` * fill in the actual (select, bit) → position table.  Changing this`,
                ` * one table corrects every set/get/fill/clear in the kernel.`,
                ` * See stc/src/20-ledcube/README.md. */`,
                `static void bw_cube_addr(int x, int y, int z, int colour,`,
                '                         unsigned char *sel, unsigned char *bit)',
                '{',
                `    *sel = (unsigned char)(z * 2 + (colour > 1 ? 1 : 0));`,
                `    *bit = (unsigned char)(y * ${N} + x);`,
                '}',
                '',
                `static void bw_cube_set(int x, int y, int z, int colour)`,
                '{',
                '    unsigned char sel, bit;',
                '    bw_cube_addr(x, y, z, colour, &sel, &bit);',
                `    if (sel >= ${S} || bit >= 8) return;`,
                '    if (colour) {',
                '        if (BW_CUBE_ACTIVE_HIGH)',
                '            bw_cube_frame[sel] |= (unsigned char)(1u << bit);',
                '        else',
                '            bw_cube_frame[sel] &= (unsigned char)~(1u << bit);',
                '    } else {',
                '        if (BW_CUBE_ACTIVE_HIGH)',
                '            bw_cube_frame[sel] &= (unsigned char)~(1u << bit);',
                '        else',
                '            bw_cube_frame[sel] |= (unsigned char)(1u << bit);',
                '    }',
                '}',
                '',
                `static unsigned char bw_cube_get(int x, int y, int z)`,
                '{',
                '    unsigned char sel, bit;',
                '    bw_cube_addr(x, y, z, 1, &sel, &bit);',
                `    if (sel >= ${S} || bit >= 8) return 0;`,
                '    return BW_CUBE_ACTIVE_HIGH ? ((bw_cube_frame[sel] >> bit) & 1)',
                '                              : !((bw_cube_frame[sel] >> bit) & 1);',
                '}',
                '',
                'static void bw_cube_clear(void)',
                '{',
                `    unsigned char i; for (i = 0; i < ${S}; i++) bw_cube_frame[i] = BW_CUBE_BLANK;`,
                '}',
                '',
                `static void bw_cube_fill_layer(int layer, int colour)`,
                '{',
                `    int sel = layer * 2 + (colour > 1 ? 1 : 0);`,
                `    if (sel >= 0 && sel < ${S}) bw_cube_frame[sel] = BW_CUBE_FILL;`,
                '}',
                '',
                // The legend the firmware carries for whoever reads the C later.
                // Generated from the same table, so it cannot describe an
                // encoding the emitter no longer uses — a comment that lies
                // about a wire format is worse than no comment.
                `/* Directions: ${CUBE_DIRECTIONS.map((d, i) => `${i}=${d}`).join(' ')} */`,
                'static void bw_cube_shift(int dir)',
                '{',
                `    unsigned char i;`,
                '    switch (dir) {',
                `    case 0: for (i = ${S} - 1; i > 0; i--) bw_cube_frame[i] = bw_cube_frame[i-1]; bw_cube_frame[0] = 0; break;`,
                `    case 1: for (i = 0; i < ${S} - 1; i++) bw_cube_frame[i] = bw_cube_frame[i+1]; bw_cube_frame[${S}-1] = 0; break;`,
                '    case 2: for (i = 0; i < ' + S + '; i++) bw_cube_frame[i] <<= 1; break;',
                '    case 3: for (i = 0; i < ' + S + '; i++) bw_cube_frame[i] >>= 1; break;',
                `    default: break;  /* forward/back need the voxel map */`,
                '    }',
                '}',
                '',
                `static void bw_cube_fill_column(int x, int y, int colour)`,
                '{',
                `    int z; for (z = 0; z < ${N}; z++) bw_cube_set(x, y, z, colour);`,
                '}',
                '',
                `static void bw_cube_fill_wall(int z, int colour)`,
                '{',
                `    int x, y; for (y = 0; y < ${N}; y++) for (x = 0; x < ${N}; x++) bw_cube_set(x, y, z, colour);`,
                '}',
                '',
                'static void bw_cube_invert(void)',
                '{',
                `    unsigned char i; for (i = 0; i < ${S}; i++) bw_cube_frame[i] = ~bw_cube_frame[i];`,
                '}',
                '',
                'static void bw_cube_hold(unsigned int ms) { bw_cube_scan(ms); }',
                '');
        }

        // Device helper stubs — emitted inline when any devices_* block is used.
        // These are no-op stubs that make the generated C COMPILE. On bare metal
        // a real implementation would drive the peripheral; these record the
        // intent so the simulator can read it, and on hardware they do nothing.
        // Each carries a /* TODO */ comment saying what a real driver would do.
        if (this._cUses.devices) {
            out.push('/* ---- device helper stubs (emitted because devices_* blocks are used) ----',
                ' * These are no-ops on the device target. A real implementation would',
                ' * drive the peripheral via its protocol (I2C for LCD, PWM for servo,',
                ' * pin toggling for shift registers, etc.). The stubs make the code',
                ' * compile and record the call for the simulator. */');
            // Each stub carries a greppable BW_STUB: marker so the build tool
            // can report them. grep 'BW_STUB:' on the generated C and echo to
            // stderr — one line per stub, naming the block that will do nothing.
            const stub = (sig, marker) => `${sig} { /* BW_STUB: ${marker} — no-op on hardware */ }`;
            const rstub = (sig, marker) => `${sig} { /* BW_STUB: ${marker} */ return 0; }`;
            // Servo: real PCA 16-bit compare/match driver when _cUses.servo is set,
            // otherwise fall back to the stub.
            if (this._cUses.servo) {
                // PCA module 0 on P1.3, 16-bit software-timer mode.
                // At FOSC/12 (921.6 kHz for 11.0592 MHz), 20 ms = 18432 counts.
                // Pulse: 500 µs (0°) = 461 counts, 2500 µs (180°) = 2304 counts.
                // The ISR toggles the pin: high at frame start, low at the pulse end.
                out.push(
                    '/* Servo driver: PCA module 0 in 16-bit compare/match mode (50 Hz). */',
                    '/* Pin: P1.3 (CCP0). Note: P1.3 is also the ADC example pin — a */',
                    '/* project using both servo and ADC on P1.3 would conflict. CCP1 on */',
                    '/* P1.4 is available as an alternative. */',
                    '/* FOSC/12 clock: 20 ms = FOSC_HZ/12/50 counts. Pulse: 500-2500 µs. */',
                    '#define SERVO_PERIOD  ((unsigned int)(FOSC_HZ / 12UL / 50UL))',
                    '#define SERVO_MIN_US  500',
                    '#define SERVO_MAX_US  2500',
                    'static unsigned int _servo_pulse;   /* pulse width in timer counts */',
                    'static unsigned int _servo_phase;   /* 0 = rising edge, 1 = falling */',
                    'static int _servo_angle;',
                    '',
                    'static void bw_servo_set(int servo, int angle)',
                    '{',
                    '    unsigned long us;',
                    '    (void)servo;',
                    '    if (angle < 0) angle = 0;',
                    '    if (angle > 180) angle = 180;',
                    '    _servo_angle = angle;',
                    '    us = SERVO_MIN_US + (unsigned long)angle * (SERVO_MAX_US - SERVO_MIN_US) / 180;',
                    '    _servo_pulse = (unsigned int)(us * (FOSC_HZ / 12UL) / 1000000UL);',
                    '}',
                    '',
                    'static int bw_servo_get(int servo) { (void)servo; return _servo_angle; }',
                    '',
                    '/* PCA ISR: toggles the servo pin at the pulse edges. */',
                    '/* Module 0 match flag (CCF0) fires twice per period: */',
                    '/*   phase 0: set pin HIGH, schedule falling edge at +_servo_pulse */',
                    '/*   phase 1: set pin LOW,  schedule rising edge at +(PERIOD-pulse) */',
                    'void bw_pca_isr(void) __interrupt(7)',
                    '{',
                    '    unsigned int next;',
                    '    if (!(CCON & 0x01)) return;  /* not CCF0 */',
                    '    CCON &= ~0x01;               /* clear CCF0 */',
                    '    if (_servo_phase == 0) {',
                    '        P1_3 = 1;                /* pulse start */',
                    '        next = ((unsigned int)CCAP0H << 8) | CCAP0L;',
                    '        next += _servo_pulse;',
                    '        CCAP0L = (unsigned char)(next & 0xFF);',
                    '        CCAP0H = (unsigned char)(next >> 8);',
                    '        _servo_phase = 1;',
                    '    } else {',
                    '        P1_3 = 0;                /* pulse end */',
                    '        next = ((unsigned int)CCAP0H << 8) | CCAP0L;',
                    '        next += SERVO_PERIOD - _servo_pulse;',
                    '        CCAP0L = (unsigned char)(next & 0xFF);',
                    '        CCAP0H = (unsigned char)(next >> 8);',
                    '        _servo_phase = 0;',
                    '    }',
                    '}',
                    '');
            } else {
                out.push(
                    stub('static void bw_servo_set(int servo, int angle)', 'devices_setservo'),
                    rstub('static int bw_servo_get(int servo)', 'devices_servoangle'));
            }
            out.push(
                stub('static void bw_motor_speed(int motor, int speed)', 'devices_setmotor'),
                rstub('static int bw_motor_get_speed(int motor)', 'devices_motorspeed'),
                stub('static void bw_motor_dir(int motor, int dir)', 'devices_setdirection'),
                rstub('static int bw_motor_get_dir(int motor)', 'devices_motordirection'),
                stub('static void bw_relay_set(int relay, int on)', 'devices_setrelay'),
                rstub('static int bw_device_state(int dev)', 'devices_devicestate'),
                stub('static void bw_device_activate(int dev)', 'devices_activate'),
                stub('static void bw_device_deactivate(int dev)', 'devices_deactivate'),
                stub('static void bw_lcd_print(int disp, int text)', 'devices_lcdprint'),
                stub('static void bw_lcd_cursor(int disp, int row, int col)', 'devices_lcdcursor'),
                stub('static void bw_lcd_clear(int disp)', 'devices_lcdclear'),
                stub('static void bw_7seg_show(int disp, int digit)', 'devices_showdigit'),
                stub('static void bw_rgb_set(int led, int r, int g, int b)', 'devices_setrgb'),
                stub('static void bw_matrix_set(int m, int x, int y, int br)', 'devices_setpixel'),
                stub('static void bw_matrix_clear(int m)', 'devices_clearmatrix'),
                stub('static void bw_neopixel_set(int s, int i, int r, int g, int b)', 'devices_setneopixel'),
                stub('static void bw_neopixel_clear(int s)', 'devices_clearneopixels'),
                rstub('static int bw_temperature(int s)', 'devices_temperature'),
                rstub('static int bw_light(int s)', 'devices_light'),
                rstub('static int bw_distance(int s)', 'devices_distance'),
                rstub('static int bw_flex(int s)', 'devices_flex'),
                rstub('static int bw_force(int s)', 'devices_force'),
                rstub('static int bw_ir_code(int s)', 'devices_ircode'),
                rstub('static int bw_pressed(int btn)', 'devices_pressed'),
                rstub('static int bw_above(int s, int thr)', 'devices_above'),
                rstub('static int bw_closer(int s, int dist)', 'devices_closer'),
                rstub('static int bw_motion(int s)', 'devices_motion'),
                rstub('static int bw_tilted(int s)', 'devices_tilted'),
                rstub('static int bw_energised(int d)', 'devices_energised'),
                '');
        }

        if (stateDecls.length) {
            out.push('/* Variables (16-bit signed, like Scratch\'s integers). */', ...stateDecls, '');
        }
        if (procProtos.length) out.push(...procProtos, '');
        if (procDefs.length) out.push(...procDefs);
        if (statics.length) {
            out.push('/* REPEAT counters live across yields. */',
                ...statics.map((n) => `static unsigned int ${n};`), '');
        }
        if (taskDefs.length) out.push(...taskDefs);

        const setup = [];
        out.push('/* Register setup: ports, ADC, Timer 0. Kept out of main() so the program',
            ' * body stands alone — a C -> blocks reader can then tell them apart. */',
            'static void bw_setup(void)', '{');
        void setup;
        const outputs = {};
        for (const p of pins) if (p.direction === 'output') outputs[p.port] = (outputs[p.port] || 0) | (1 << p.bit);
        if (chip.portModes) {
            for (const port of Object.keys(outputs).sort()) {
                out.push(`    P${port}M1 &= ~0x${hex(outputs[port])};   /* push-pull */`,
                    `    P${port}M0 |=  0x${hex(outputs[port])};`);
            }
        }
        // On a quasi-bidirectional-only part (STC89) there is nothing to set up: the
        // active-low wiring sinks the LED current either way.
        for (const p of pins) {
            if (p.direction === 'output') out.push(`    P${p.port}_${p.bit} = ${p.activeLow ? 1 : 0};   /* ${this.cComment(p.name)} off */`);
        }
        let analog = 0;
        for (const p of pins) if (p.direction === 'analog') analog |= 1 << p.bit;
        if (analog) {
            out.push('',
                `    P1ASF = 0x${hex(analog)};                 /* analog function on P1 */`,
                `    P1M1 |=  0x${hex(analog)};                /* high-impedance input */`,
                `    P1M0 &= ~0x${hex(analog)};`,
                '    ADC_CONTR = 0xE0;              /* ADC on, fastest conversion */');
        }
        out.push('');
        if (chip.aux1T) out.push('    AUXR &= ~0x80;                 /* Timer 0 at FOSC/12 */');
        out.push('    TMOD  = (TMOD & 0xF0) | 0x01;  /* Timer 0, mode 1 */');
        // PCA setup for servo (16-bit compare/match, module 0 on P1.3).
        if (this._cUses.servo) {
            out.push('',
                '    /* PCA: FOSC/12 clock, 16-bit compare/match on module 0 (P1.3). */',
                '    CMOD = 0x00;                      /* PCA clock = FOSC/12 */',
                '    CCAPM0 = 0x49;                    /* module 0: match + toggle + interrupt */',
                '    CCAP0L = 0; CCAP0H = 0;',
                '    CL = 0; CH = 0;',
                '    EA = 1;                           /* global interrupt enable */',
                '    /* PCA interrupt is enabled per-module by CCAPM0.ECCF (bit 0 of */',
                '    /* 0x49 above). There is NO IE.EC bit for PCA on STC12 — IE.6 is */',
                '    /* ELVD (Low Voltage Detector). Do not set EC=1 here. */',
                '    CR = 1;                           /* start PCA counter — AFTER EA */',
                '    _servo_pulse = (unsigned int)(1500UL * (FOSC_HZ / 12UL) / 1000000UL);  /* 90° default */',
                '    _servo_angle = 90;',
                '    _servo_phase = 0;');
        }
        out.push('}', '', 'void main(void)', '{', '    bw_setup();');
        if (this._cTasks) {
            out.push('    TL0 = (unsigned char)(T0_RELOAD & 0xFF);',
                '    TH0 = (unsigned char)(T0_RELOAD >> 8);',
                '    ET0 = 1;                       /* millisecond tick */',
                '    EA  = 1;',
                '    TR0 = 1;',
                '',
                '    for (;;) {',
                ...taskNames.map((n) => `        ${n}();`),
                '    }');
        } else {
            out.push('');
            out.push(...mainNote.map((l) => `    ${l}`));
            out.push(...mainBody);
        }
        out.push('}', '');
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    // Functional shims for the Arrays & Vectors extension (id `arrays`) so the generated
    // code runs standalone. The block surface maps 1:1 to these methods (0-based indices).
    arraysShimPy() {
        return [
            'class _Arrays:  # Arrays & Vectors extension (github.com/CrispStrobe/extensions), as plain Python',
            '    def __init__(self): self._d = {}',
            '    def create1d(self, n, j): self._d[n] = json.loads(j) if isinstance(j, str) else list(j)',
            '    def create(self, n): self._d[n] = []',
            '    def create_range(self, n, s, e): self._d[n] = list(range(int(s), int(e) + 1))',
            '    def set(self, n, i, v): self._d[n][int(i)] = v',
            '    def push(self, n, v): self._d[n].append(v)',
            '    def insert(self, n, i, v): self._d[n].insert(int(i), v)',
            '    def remove(self, n, i): del self._d[n][int(i)]',
            '    def drop(self, n): self._d.pop(n, None)',
            '    def get(self, n, i): return self._d[n][int(i)]',
            '    def pop(self, n): return self._d[n].pop()',
            '    def length(self, n): return len(self._d[n])',
            '    def sum(self, n): return sum(self._d[n])',
            '    def mean(self, n): return sum(self._d[n]) / len(self._d[n])',
            '    def min(self, n): return min(self._d[n])',
            '    def max(self, n): return max(self._d[n])',
            '    def index_of(self, n, v): return self._d[n].index(v) if v in self._d[n] else -1',
            '    def reverse(self, n): return list(reversed(self._d[n]))',
            '    def flatten(self, n): return [x for row in self._d[n] for x in (row if isinstance(row, list) else [row])]',
            '    def sort(self, n, o="ascending"): return sorted(self._d[n], reverse=(o != "ascending"))',
            '    def slice(self, n, s, e): return self._d[n][int(s):int(e)]',
            '    def to_text(self, n): return json.dumps(self._d[n])',
            '    def contains(self, n, v): return v in self._d[n]',
            '    def create2d(self, n, j): self._d[n] = json.loads(j) if isinstance(j, str) else [list(r) for r in j]',
            '    def get2d(self, n, r, c): return self._d[n][int(r)][int(c)]',
            '    def set2d(self, n, r, c, v):',
            '        row = self._d[n]',
            '        while len(row) <= int(r): row.append([])',
            '        while len(row[int(r)]) <= int(c): row[int(r)].append(0)',
            '        row[int(r)][int(c)] = v',
            '    def transpose(self, n): return [list(x) for x in zip(*self._d[n])]',
            '    def _flat(self, a): return [y for x in a for y in (self._flat(x) if isinstance(x, list) else [x])]',
            '    def reshape(self, n, shp):',
            '        dims = json.loads(shp) if isinstance(shp, str) else shp',
            '        flat = self._flat(self._d[n])',
            '        def rs(i=0):',
            '            if i == len(dims) - 1: return [flat.pop(0) for _ in range(int(dims[i]))]',
            '            return [rs(i + 1) for _ in range(int(dims[i]))]',
            '        return rs()',
            '    def _fn(self, f):',
            '        if callable(f): return f',
            '        s = str(f)',
            '        i = s.find("=>")',
            '        if i < 0: return lambda *a: None',
            '        return eval("lambda " + s[:i].strip().strip("()").strip() + ": " + s[i + 2:].strip())',
            '    def map(self, n, f):',
            '        g = self._fn(f)',
            '        return [g(x) for x in self._d[n]]',
            '    def filter(self, n, f):',
            '        g = self._fn(f)',
            '        return [x for x in self._d[n] if g(x)]',
            '    def reduce(self, n, f, init):',
            '        g = self._fn(f)',
            '        acc = init',
            '        for x in self._d[n]: acc = g(acc, x)',
            '        return acc',
            '_arrays = _Arrays()'
        ];
    }

    arraysShimJs() {
        return [
            'const _arrays = (() => {  // Arrays & Vectors extension (github.com/CrispStrobe/extensions), as plain JS',
            '    const d = {};',
            '    const _fn = (f) => typeof f === "function" ? f : new Function("return (" + f + ")")();  // compile a "x => …" FUNC string',
            '    return {',
            '        create1d: (n, j) => { d[n] = typeof j === "string" ? JSON.parse(j) : Array.from(j); },',
            '        create: (n) => { d[n] = []; }, create_range: (n, s, e) => { d[n] = Array.from({length: Number(e) - Number(s) + 1}, (_, i) => Number(s) + i); },',
            '        set: (n, i, v) => { d[n][Number(i)] = v; }, push: (n, v) => { d[n].push(v); },',
            '        insert: (n, i, v) => { d[n].splice(Number(i), 0, v); }, remove: (n, i) => { d[n].splice(Number(i), 1); }, drop: (n) => { delete d[n]; },',
            '        get: (n, i) => d[n][Number(i)], pop: (n) => d[n].pop(), length: (n) => d[n].length,',
            '        sum: (n) => d[n].reduce((a, b) => a + Number(b), 0), mean: (n) => d[n].reduce((a, b) => a + Number(b), 0) / d[n].length,',
            '        min: (n) => Math.min(...d[n]), max: (n) => Math.max(...d[n]), index_of: (n, v) => d[n].indexOf(v),',
            '        reverse: (n) => d[n].slice().reverse(), flatten: (n) => d[n].flat(Infinity),',
            '        sort: (n, o = "ascending") => d[n].slice().sort((a, b) => o === "ascending" ? a - b : b - a),',
            '        slice: (n, s, e) => d[n].slice(Number(s), Number(e)), to_text: (n) => JSON.stringify(d[n]), contains: (n, v) => d[n].includes(v),',
            '        create2d: (n, j) => { d[n] = typeof j === "string" ? JSON.parse(j) : j; },',
            '        get2d: (n, r, c) => d[n][Number(r)][Number(c)],',
            '        set2d: (n, r, c, v) => { if (!d[n][Number(r)]) d[n][Number(r)] = []; d[n][Number(r)][Number(c)] = v; },',
            '        transpose: (n) => d[n][0].map((_, i) => d[n].map((row) => row[i])),',
            '        reshape: (n, shp) => { const dims = typeof shp === "string" ? JSON.parse(shp) : shp; const flat = d[n].flat(Infinity); const rs = (i = 0) => i === dims.length - 1 ? flat.splice(0, Number(dims[i])) : Array.from({length: Number(dims[i])}, () => rs(i + 1)); return rs(); },',
            '        map: (n, f) => d[n].map(_fn(f)), filter: (n, f) => d[n].filter(_fn(f)), reduce: (n, f, init) => d[n].reduce(_fn(f), init)',
            '    };',
            '})();'
        ];
    }

    // Append a user-supplied SVG as an extra costume (animation frame) on a sprite.
    addCustomSVGCostume(spriteName, svgText, costumeName) {
        const target = this.project.targets.find(t => !t.isStage && t.name === spriteName);
        if (!target) return false;
        const { width, height } = this.svgDimensions(svgText);
        const assetId = this.generateAssetId();
        this.assets.set(assetId, { type: 'svg', data: svgText, filename: `${assetId}.svg`, metadata: { width, height } });
        target.costumes.push({
            assetId,
            name: costumeName || `costume${target.costumes.length + 1}`,
            md5ext: `${assetId}.svg`, dataFormat: 'svg',
            rotationCenterX: width / 2, rotationCenterY: height / 2
        });
        return true;
    }
}

// Core Scratch block categories (everything else is an extension id, see syncExtensions).
SB3Creator.CORE_CATEGORIES = new Set([
    'motion', 'looks', 'sound', 'event', 'control', 'sensing', 'operator', 'data', 'procedures', 'argument'
]);

// URLs for custom gallery extensions so the VM can load them when a project uses them.
// Source of truth: github.com/CrispStrobe/extensions; the fork loads the registry from
// crispstrobe.github.io/extensions/generated-metadata/extensions-v0.json (slug -> `${slug}.js`).
SB3Creator.EXTENSION_URLS = {
    planetemaths: 'https://crispstrobe.github.io/extensions/CrispStrobe/planetemaths.js',
    arrays: 'https://crispstrobe.github.io/extensions/CrispStrobe/arrays.js',
    // Without this line a hardware project carries `extensions: ["stc12"]` and no URL
    // for it, so a TurboWarp-based host has nowhere to fetch the blocks from and the
    // project fails to open at all: "Unknown extension: stc12". A host that has the
    // extension built in (brickwright-lite does) checks that first and ignores the URL.
    stc12: 'https://crispstrobe.github.io/extensions/CrispStrobe/stc12.js',
    ...GENERATED_URLS   // gamepad + LEGO/hardware extension URLs (auto-generated)
};

// Pluggable-driver convention for runtime/hardware extensions (gamepad, LEGO, …).
// The transpiled program is driver-agnostic: it calls `_<runtime>.<method>(args)`.
// A driver object is emitted at the top — a neutral no-op "shim" by default — which is
// the single swap point: implement its methods to drive real hardware on-brick (ev3dev/
// pybricks) or remotely (USB/BLE/BTC). Adding an extension = one declarative entry here,
// not new emitter code. Each op: { kind: 'command'|'reporter'|'boolean', method, args?,
// neutral? }. Source of truth for the block surface: github.com/CrispStrobe/extensions.
// All runtime/hardware extensions (Gamepad + Boost, PoweredUp, WeDo, Spike, EV3, …) are
// auto-generated from their block surfaces (scripts/gen-runtime-registry.mjs) so the
// pluggable-driver convention works for every one of them.
SB3Creator.RUNTIME_EXTENSIONS = {
    ...GENERATED_RUNTIME,
    // The STC12 pin surface. Declared here rather than special-cased in the walkers, which is
    // the convention's own promise: adding hardware is one registry entry, not new emitter code.
    //
    // This is what lets the CHEAP simulation tier reach the chip blocks. Emitted Python/JS now
    // calls `_stc12.setPin("led1", "on")` instead of dropping a `# comment`, so swapping in a
    // driver that pokes a board layer simulates an STC12 program with no emitter change at all
    // — the same swap point that already serves shim / remote / on-brick. See
    // reference/simulation.md (tier 1). `generateC` does NOT come through here: on the chip
    // these are direct SFR writes.
    stc12: {
        runtime: 'stc12',
        ops: {
            setpin: { kind: 'command', method: 'setPin', args: ['PIN', 'STATE'] },
            toggle: { kind: 'command', method: 'togglePin', args: ['PIN'] },
            writepin: { kind: 'command', method: 'writePin', args: ['PIN', 'VALUE'] },
            read: { kind: 'reporter', method: 'readPin', args: ['PIN'], neutral: '0' },
            setpwm: { kind: 'command', method: 'setPwm', args: ['PIN', 'VALUE'] },
            settone: { kind: 'command', method: 'setTone', args: ['PIN', 'VALUE'] },
            setport: { kind: 'command', method: 'setPort', args: ['PORT', 'VALUE'] },
            readport: { kind: 'reporter', method: 'readPort', args: ['PORT'], neutral: '0' },
            setpart: { kind: 'command', method: 'setPart', args: ['PART', 'VALUE'] },
            print: { kind: 'command', method: 'print', args: ['VALUE', 'MODE'] },
            whenpin: { kind: 'hat', method: 'whenpin', args: ['PIN', 'EDGE'] },
            tableindex: { kind: 'reporter', method: 'tableIndex', args: ['TABLE', 'INDEX'], neutral: '0' }
        }
    },
    // LED cube — frame-buffer animation blocks. The simulator driver maps to
    // the board's cube accessors (bw-board led_cube kind) when a board is
    // attached; the neutral shim records frames locally.
    ledcube: {
        runtime: 'ledcube',
        ops: {
            setvoxel: { kind: 'command', method: 'setVoxel', args: ['X', 'Y', 'Z', 'COLOUR'] },
            clearvoxel: { kind: 'command', method: 'clearVoxel', args: ['X', 'Y', 'Z'] },
            filllayer: { kind: 'command', method: 'fillLayer', args: ['LAYER', 'COLOUR'] },
            fillcolumn: { kind: 'command', method: 'fillColumn', args: ['X', 'Y', 'COLOUR'] },
            fillwall: { kind: 'command', method: 'fillWall', args: ['Z', 'COLOUR'] },
            clear: { kind: 'command', method: 'clear', args: [] },
            invert: { kind: 'command', method: 'invert', args: [] },
            shift: { kind: 'command', method: 'shift', args: ['DIR'] },
            hold: { kind: 'command', method: 'hold', args: ['DURATION'] },
            readvoxel: { kind: 'reporter', method: 'readVoxel', args: ['X', 'Y', 'Z'], neutral: '0' }
        }
    },
    // The circuit extension — board instruments and controls (simulation-only reporters).
    // Overrides the generated entry with camelCase method names (matching the simulator
    // driver and boundary B) and neutral values (resistance alone refuses with a reason).
    // Device convenience blocks — higher-level vocabulary over pins/ports.
    // A learner says "show digit 5" not "set port to font[5]".
    devices: {
        runtime: 'devices',
        ops: {
            showdigit: { kind: 'command', method: 'showDigit', args: ['DIGIT', 'DISPLAY'] },
            setrgb: { kind: 'command', method: 'setRgb', args: ['LED', 'R', 'G', 'B'] },
            setservo: { kind: 'command', method: 'setServo', args: ['SERVO', 'ANGLE'] },
            setmotor: { kind: 'command', method: 'setMotor', args: ['MOTOR', 'SPEED'] },
            setrelay: { kind: 'command', method: 'setRelay', args: ['RELAY', 'STATE'] },
            temperature: { kind: 'reporter', method: 'temperature', args: ['SENSOR'], neutral: 'NaN' },
            light: { kind: 'reporter', method: 'light', args: ['SENSOR'], neutral: 'NaN' },
            servoangle: { kind: 'reporter', method: 'servoAngle', args: ['SERVO'], neutral: 'NaN' },
            distance: { kind: 'reporter', method: 'distance', args: ['SENSOR'], neutral: 'NaN' },
            // char_lcd
            lcdprint: { kind: 'command', method: 'lcdPrint', args: ['TEXT', 'DISPLAY'] },
            lcdcursor: { kind: 'command', method: 'lcdCursor', args: ['ROW', 'COL', 'DISPLAY'] },
            lcdclear: { kind: 'command', method: 'lcdClear', args: ['DISPLAY'] },
            // led_matrix
            setpixel: { kind: 'command', method: 'setPixel', args: ['X', 'Y', 'BRIGHTNESS', 'MATRIX'] },
            clearmatrix: { kind: 'command', method: 'clearMatrix', args: ['MATRIX'] },
            // neopixel
            setneopixel: { kind: 'command', method: 'setNeopixel', args: ['INDEX', 'R', 'G', 'B', 'STRIP'] },
            clearneopixels: { kind: 'command', method: 'clearNeopixels', args: ['STRIP'] },
            // H-bridge / solenoid / general actuator control
            setdirection: { kind: 'command', method: 'setDirection', args: ['MOTOR', 'DIR'] },
            activate: { kind: 'command', method: 'activate', args: ['DEVICE'] },
            deactivate: { kind: 'command', method: 'deactivate', args: ['DEVICE'] },
            // Sensor reporters
            flex: { kind: 'reporter', method: 'flex', args: ['SENSOR'], neutral: 'NaN' },
            force: { kind: 'reporter', method: 'force', args: ['SENSOR'], neutral: 'NaN' },
            ircode: { kind: 'reporter', method: 'irCode', args: ['SENSOR'], neutral: 'NaN' },
            // Actuator readback reporters
            motorspeed: { kind: 'reporter', method: 'motorSpeed', args: ['MOTOR'], neutral: 'NaN' },
            motordirection: { kind: 'reporter', method: 'motorDirection', args: ['MOTOR'], neutral: '"stopped"' },
            devicestate: { kind: 'reporter', method: 'deviceState', args: ['DEVICE'], neutral: '"unknown"' },
            // Predicates (boolean reporters)
            pressed: { kind: 'boolean', method: 'pressed', args: ['BUTTON'], neutral: 'false' },
            above: { kind: 'boolean', method: 'above', args: ['SENSOR', 'THRESHOLD'], neutral: 'false' },
            closer: { kind: 'boolean', method: 'closer', args: ['SENSOR', 'DISTANCE'], neutral: 'false' },
            motion: { kind: 'boolean', method: 'motion', args: ['SENSOR'], neutral: 'false' },
            tilted: { kind: 'boolean', method: 'tilted', args: ['SENSOR'], neutral: 'false' },
            energised: { kind: 'boolean', method: 'energised', args: ['DEVICE'], neutral: 'false' },
            // Sensor event hats
            whenabove: { kind: 'hat', method: 'whenAbove', args: ['SENSOR', 'THRESHOLD'] },
            whencloser: { kind: 'hat', method: 'whenCloser', args: ['SENSOR', 'DISTANCE'] },
            whenmotion: { kind: 'hat', method: 'whenMotion', args: ['SENSOR'] },
            whentilted: { kind: 'hat', method: 'whenTilted', args: ['SENSOR'] },
            whenirreceived: { kind: 'hat', method: 'whenIrReceived', args: ['SENSOR'] }
        }
    },
    // The generated entry from circuit.js provides the opcode shape and the gallery URL.
    circuit: {
        runtime: 'circuit',
        ops: {
            nodevoltage: { kind: 'reporter', method: 'nodeVoltage', args: ['NET'], neutral: 'NaN' },
            branchcurrent: { kind: 'reporter', method: 'branchCurrent', args: ['PART'], neutral: 'NaN' },
            resistance: { kind: 'reporter', method: 'resistance', args: ['A', 'B'], neutral: 'NaN' },
            ledbrightness: { kind: 'reporter', method: 'ledBrightness', args: ['PART'], neutral: 'NaN' },
            buzzertone: { kind: 'reporter', method: 'buzzerTone', args: ['PART'], neutral: 'NaN' },
            setcontrol: { kind: 'command', method: 'setControl', args: ['CONTROL', 'VALUE'] },
            setpower: { kind: 'command', method: 'setPower', args: ['STATE'] }
        }
    }
};

// ---- STC12 / 8051 target (generateC) ---------------------------------------------
// What the C emitter must know about a chip family. The point of keeping this explicit:
// an STC12C5A60S2 drops into an STC89C52 socket pin-for-pin, but its 1T core runs
// software delay loops 6-12x too fast. Generated code never busy-waits on a cycle count
// — every delay and every scheduler tick is Timer 0 at FOSC/12, which both families
// count identically — so the same project is timing-correct on either chip.
// Register addresses are datasheet facts; the header is SDCC's own.
// Mirrors the PARTS table in ../stc-compiler/stc_pseudocode.py.
//   header     — the SDCC header carrying this family's registers
//   portModes  — PxM0/PxM1 exist (STC12/STC15); the STC89 is quasi-bidirectional only
//   aux1T      — AUXR.7 selects Timer 0's 1T mode and must be cleared
//   adc        — 10-bit ADC on P1
// The STC15 borrows stc12.h deliberately: every register this emitter touches (P0-P3,
// PxM0/PxM1, AUXR, Timer 0, P1ASF, the ADC block) sits at the same address on an
// STC15F2K60S2. Its famous divergences (Timer 2 at 0xD6/0xD7, S3CON…) are registers
// nothing here ever writes.
// Not all STC any more, but the name is in warning text and in saved
// projects. `core` is what actually matters: it says which vocabulary a
// board's pins are spelled in, and which C back end (if any) can emit for it.
SB3Creator.STC_PARTS = {
    // core: '8051' -- {port, bit} pins, and generateC() emits for these.
    stc12c5a60s2: { header: 'stc12.h', portModes: true, aux1T: true, adc: true },
    stc12c5a16s2: { header: 'stc12.h', portModes: true, aux1T: true, adc: true },
    stc89c52rc: { header: '8052.h', portModes: false, aux1T: false, adc: false },
    stc89c52: { header: '8052.h', portModes: false, aux1T: false, adc: false },
    stc15f2k60s2: { header: 'stc12.h', portModes: true, aux1T: true, adc: true },
    // STC15W408AS: same SFR layout as STC15F2K60S2 for everything the emitter
    // touches. Lacks Timer 1, so TONE pins (which need Timer 1) should warn.
    stc15w408as: { header: 'stc12.h', portModes: true, aux1T: true, adc: true },
    // core: 'arduino' -- pins are NUMBERS (D13, A0), and there is no C back
    // end here yet. Declared so a sketch imported by cToPseudocode.js parses
    // into a project and reaches the blocks; generateC() refuses them by name
    // rather than emitting 8051 registers for a board that has none.
    'arduino-uno': { core: 'arduino', header: 'Arduino.h', portModes: false, aux1T: false, adc: true },
    'arduino-nano': { core: 'arduino', header: 'Arduino.h', portModes: false, aux1T: false, adc: true },
    atmega328p: { core: 'arduino', header: 'avr/io.h', portModes: false, aux1T: false, adc: true },
    // core: 'micropython' -- the program IS the artefact, so there is no C back
    // end for these by definition, not merely not yet. Pins are P0-P20 and the
    // two buttons on a micro:bit, GP0-GP28 on a Pico.
    microbit: { core: 'micropython', header: null, portModes: false, aux1T: false, adc: true },
    pico: { core: 'micropython', header: null, portModes: false, aux1T: false, adc: true }
};

// C keywords a sanitized Scratch name could collide with (sanitizeIdent only guards the
// Python/JS ones). SDCC's own storage-class keywords are included.
SB3Creator.C_RESERVED = new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
    'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register',
    'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
    'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'bit', 'sbit', 'sfr',
    'sfr16', 'data', 'idata', 'xdata', 'pdata', 'code', 'bdata', 'at', 'interrupt', 'using',
    'reentrant', 'naked', 'main'
]);

export default SB3Creator;