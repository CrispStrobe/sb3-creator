// picoRepl — MicroPython raw-REPL upload protocol, transport-agnostic.
//
/* global Buffer */ // Node global; this util also runs under the node transport + tests.
//
// The app's path from blocks to a live Pico over USB: generateMicroPython
// gives main.py, THIS speaks the wire protocol, and the transport is
// whatever can move bytes — the browser's WebSerial port, a node serial
// stream, or the scripted mock in the tests. It is exactly the dance
// mpremote and Thonny do:
//
//   Ctrl-C Ctrl-C   interrupt whatever runs
//   Ctrl-A          enter raw REPL        → "raw REPL; CTRL-B to exit"
//   <code> Ctrl-D   execute               → "OK" then output, then \x04
//   Ctrl-B          back to friendly REPL
//
// Deployment writes main.py via a small exec'd program (open/write/close),
// then soft-reboots so the stored file runs standalone — surviving
// unplug/replug, like a flashed firmware.
//
// Browser wiring (Chromium only — Safari has no WebSerial, which is why
// the app must ALSO offer the main.py download and the `bw flash` CLI):
//
//   const port = await navigator.serial.requestPort({
//     filters: [{ usbVendorId: 0x2e8a }]   // Raspberry Pi
//   });
//   await port.open({ baudRate: 115200 });
//   const repl = createPicoRepl(webSerialTransport(port));
//   await repl.deployMainPy(py);

const CTRL_A = '\x01';
const CTRL_B = '\x02';
const CTRL_C = '\x03';
const CTRL_D = '\x04';

/**
 * @typedef {object} Transport
 * @property {(text: string) => Promise<void>} write
 * @property {() => Promise<string>} read — resolves with the next chunk
 */

/**
 * Wrap a WebSerial port into the Transport this module speaks.
 * Lives here so the app's glue stays one call — but the module never
 * touches navigator itself, which is what keeps it testable in node.
 * @param {*} port — an open WebSerial SerialPort
 * @returns {Transport & {close: () => Promise<void>}}
 */
export function webSerialTransport(port) {
  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  return {
    async write(text) { await writer.write(enc.encode(text)); },
    async read() {
      const { value, done } = await reader.read();
      return done ? '' : dec.decode(value);
    },
    async close() {
      writer.releaseLock();
      await reader.cancel().catch(() => {});
      reader.releaseLock();
      await port.close();
    },
  };
}

/**
 * @param {Transport} transport
 * @param {{ timeoutMs?: number }} [opts]
 */
export function createPicoRepl(transport, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 5000;

  let buffer = '';
  /** Read until the buffer contains `marker`; returns everything up to and
   *  including it, consuming it from the buffer. */
  async function readUntil(marker) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const i = buffer.indexOf(marker);
      if (i >= 0) {
        const out = buffer.slice(0, i + marker.length);
        buffer = buffer.slice(i + marker.length);
        return out;
      }
      if (Date.now() > deadline) {
        throw new Error(`timeout waiting for ${JSON.stringify(marker)} — got ${JSON.stringify(buffer.slice(-80))}`);
      }
      buffer += await transport.read();
    }
  }

  async function enterRaw() {
    await transport.write(CTRL_C + CTRL_C);   // interrupt a running program
    await transport.write('\r' + CTRL_A);
    await readUntil('raw REPL; CTRL-B to exit');
  }

  /** Write text to the raw REPL in packets no larger than the CDC bulk OUT
   *  endpoint (64 bytes), draining between each so the device consumes one
   *  before the next arrives. A single large write is delivered whole in node,
   *  but a real CDC endpoint pulls one 64-byte packet per poll — and the bundled
   *  browser USB path takes only the first packet of a write and silently drops
   *  the rest, truncating the program. BOTH the run-live start (execStart) and
   *  the install-and-reboot deploy (deployMainPy, via exec) write through this,
   *  so the sim and silicon seams share the WRITE discipline, not just the
   *  handshake — a long .py truncates on hardware exactly as it did in the sim. */
  async function writeChunked(text, onProgress) {
    const MAX_PACKET = 64;
    for (let i = 0; i < text.length; i += MAX_PACKET) {
      await transport.write(text.slice(i, i + MAX_PACKET));
      if (onProgress) onProgress('program-written', {bytes: Math.min(i + MAX_PACKET, text.length)});
      if (transport.drain) await transport.drain();
    }
  }

  /** Execute code in raw REPL; returns its stdout. Throws on a traceback. */
  async function exec(code) {
    await writeChunked(code + CTRL_D);
    await readUntil('OK');
    // Output ends with \x04, then the error channel, then another \x04.
    const out = await readUntil(CTRL_D);
    const err = await readUntil(CTRL_D);
    const errText = err.slice(0, -1);
    if (errText.trim()) throw new Error(`device error: ${errText.trim()}`);
    return out.slice(0, -1);
  }

  /** Wake the REPL and wait for its friendly prompt. Entering raw mode BEFORE
   *  the REPL loop is running drops the Ctrl-A, and the program then lands in a
   *  friendly REPL that ECHOES a multi-line def and runs nothing — no error, so
   *  it looks like it ran. Waiting for the prompt first is what prevents that. */
  async function waitForPrompt() {
    await transport.write('\r\n');
    await readUntil('>>> ');
  }

  /** Start code in raw REPL and wait only for the OK that acknowledges it was
   *  accepted — NOT for completion. A live/forever program (a blink) never sends
   *  the trailing \x04, so exec() would hang; this is how a run-live program is
   *  started and left running while its GPIO drives the board. `onProgress` is a
   *  diagnostic seam: it fires after the program bytes are written, after the
   *  Ctrl-D, and before the OK wait, so a stall can be localized to the exact
   *  step (the program and the Ctrl-D go as SEPARATE writes for the same reason). */
  async function execStart(code, onProgress = () => {}) {
    // The program in 64-byte packets (writeChunked), then Ctrl-D as its own
    // final packet after the program has drained. Same discipline as exec.
    await writeChunked(code, onProgress);
    await writeChunked(CTRL_D);
    onProgress('ctrld-written');
    onProgress('waiting-ok');
    await readUntil('OK');
  }

  return {
    enterRaw,
    exec,
    waitForPrompt,
    execStart,

    /** The whole deployment: write main.py, verify the byte count, reboot
     *  so the stored program runs standalone. */
    async deployMainPy(py) {
      await enterRaw();
      // Write in chunks through a file handle — a single exec string
      // holding the WHOLE program would need escaping it into a literal
      // anyway, so do exactly that, but chunked to respect the device's
      // raw-REPL input buffer.
      await exec('f = open("main.py", "wb")');
      const CHUNK = 512;
      for (let i = 0; i < py.length; i += CHUNK) {
        const part = py.slice(i, i + CHUNK);
        await exec(`f.write(${pyBytesLiteral(part)})`);
      }
      await exec('f.close()');
      const size = await exec('import os\nprint(os.stat("main.py")[6])');
      const written = parseInt(size.trim(), 10);
      const expected = utf8Length(py);
      if (written !== expected) {
        throw new Error(`main.py is ${written} bytes on the device, expected ${expected}`);
      }
      // Leave raw REPL, then hard-reset via machine — main.py boots.
      await transport.write(CTRL_B);
      await transport.write('\r' + CTRL_A);
      await readUntil('raw REPL; CTRL-B to exit');
      await transport.write('import machine\nmachine.reset()' + CTRL_D);
      return written;
    },
  };
}

/**
 * Start a program LIVE over the raw REPL — the ONE handshake the browser sim
 * seam and the node oracle both call, so they cannot diverge (the divergence
 * that cost a CI round: the seam exec'd into a friendly REPL, which echoed a
 * multi-line def and ran nothing, while the oracle entered raw mode first).
 *
 * The sequence, and every step matters: wake the REPL and wait for its prompt
 * (so raw mode is entered against a running REPL, not mid-boot), enter raw mode
 * and wait for its ack, send the program and wait for the OK that acknowledges
 * it. Only after the OK is the program actually running. Each wait is bounded by
 * `opts.timeoutMs`; a step that does not ack throws, so a silent no-run cannot
 * masquerade as "running". Returns the raw-REPL handle, so the caller can start
 * further statements (execStart) or interrupt with Ctrl-C.
 *
 * The DRIVING is the transport's job: `transport.read()` steps the emulator in
 * the node oracle and awaits the rAF pump's bytes in the browser — this code is
 * identical across both.
 *
 * @param {import('./pico-repl.js').Transport} transport
 * @param {string} py
 * @param {{timeoutMs?: number}} [opts]
 * @returns {Promise<ReturnType<typeof createPicoRepl>>}
 */
export async function startProgramOnRepl(transport, py, opts = {}) {
  const onProgress = opts.onProgress || (() => {});
  const repl = createPicoRepl(transport, opts);
  onProgress('waking');
  await repl.waitForPrompt();
  onProgress('prompt-seen');
  await repl.enterRaw();
  onProgress('raw-ack');
  await repl.execStart(py, onProgress);
  onProgress('ok');
  return repl;
}

/** A Python bytes literal for arbitrary text, UTF-8 encoded. */
export function pyBytesLiteral(text) {
  const bytes = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(text)
    : Buffer.from(text, 'utf8');
  let out = 'b"';
  for (const b of bytes) {
    if (b === 0x22) out += '\\"';
    else if (b === 0x5c) out += '\\\\';
    else if (b >= 0x20 && b < 0x7f) out += String.fromCharCode(b);
    else if (b === 0x0a) out += '\\n';
    else if (b === 0x0d) out += '\\r';
    else if (b === 0x09) out += '\\t';
    else out += '\\x' + b.toString(16).padStart(2, '0');
  }
  return out + '"';
}

function utf8Length(text) {
  return typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(text).length
    : Buffer.byteLength(text, 'utf8');
}
