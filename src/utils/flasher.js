// VENDORED from CrispStrobe/stc-compiler docs/flash.js — do NOT edit here.
// It has the mock-bootloader tests there. Node uses it via nodeSerialPort.js.
// flash.js — Intel HEX to an AVR over Web Serial, speaking STK500v1.
//
// This is the last gap between the page and a board doing something. An
// ATmega with the Arduino bootloader (optiboot) is entered by pulsing DTR,
// which resets the chip; the bootloader then answers STK500v1 for a second or
// so before handing over to the application.
//
// The transport is a parameter rather than `navigator.serial` directly, so
// the whole protocol can be driven against a simulated bootloader in a test.
// Flashing is one of the few things here that cannot be checked by compiling
// the output, and "it looked right" is not good enough for something that
// writes to a chip.
//
// Deliberately NOT here: the STC12's ISP. That protocol only answers after a
// COLD power-on -- a reset pulse will not do -- so it needs a different
// interaction from the user, not just different bytes. See flashStc below.

export const STK = {
  OK: 0x10, INSYNC: 0x14, CRC_EOP: 0x20,
  GET_SYNC: 0x30, ENTER_PROGMODE: 0x50, LEAVE_PROGMODE: 0x51,
  LOAD_ADDRESS: 0x55, PROG_PAGE: 0x64, READ_PAGE: 0x74,
  READ_SIGN: 0x75,
};

/** Parse Intel HEX into a flat image. Throws on a bad checksum. */
export function parseIntelHex(text) {
  const bytes = new Map();
  let base = 0, highest = -1, lowest = Infinity;
  let line = 0;
  for (const raw of text.split(/\r?\n/)) {
    line++;
    const record = raw.trim();
    if (!record) continue;
    if (record[0] !== ':') throw new Error(`line ${line}: no start code`);
    const octets = [];
    for (let i = 1; i + 1 < record.length; i += 2) {
      octets.push(parseInt(record.substr(i, 2), 16));
    }
    if (octets.some(Number.isNaN)) throw new Error(`line ${line}: not hex`);
    const sum = octets.reduce((a, b) => (a + b) & 0xff, 0);
    if (sum !== 0) throw new Error(`line ${line}: checksum mismatch`);
    const count = octets[0];
    const address = (octets[1] << 8) | octets[2];
    const type = octets[3];
    if (type === 0x00) {
      for (let i = 0; i < count; i++) {
        const at = base + address + i;
        bytes.set(at, octets[4 + i]);
        if (at > highest) highest = at;
        if (at < lowest) lowest = at;
      }
    } else if (type === 0x01) {
      break;                                    // end of file
    } else if (type === 0x02) {
      base = ((octets[4] << 8) | octets[5]) << 4;
    } else if (type === 0x04) {
      base = ((octets[4] << 8) | octets[5]) << 16;
    }
    // 0x03 and 0x05 are start-address records: meaningless for a bootloader
    // that always begins at reset, and skipping them is correct rather than
    // lazy.
  }
  if (highest < 0) throw new Error('no data records');
  // Bootloaders write from 0; a gap inside the image is padded with 0xFF,
  // which is what erased flash reads as.
  const image = new Uint8Array(highest + 1).fill(0xff);
  for (const [at, value] of bytes) image[at] = value;
  return { image, lowest, highest };
}

/** A framed STK500v1 conversation over a byte transport. */
export class Stk500 {
  constructor(transport, { pageSize = 128, log = () => {} } = {}) {
    this.io = transport;
    this.pageSize = pageSize;
    this.log = log;
  }

  async command(body, expected = 0) {
    await this.io.write(Uint8Array.from([...body, STK.CRC_EOP]));
    const head = await this.io.read(1);
    if (head[0] !== STK.INSYNC) {
      throw new Error(`out of sync (got 0x${head[0].toString(16)})`);
    }
    const payload = expected ? await this.io.read(expected) : new Uint8Array(0);
    const tail = await this.io.read(1);
    if (tail[0] !== STK.OK) {
      throw new Error(`command not acknowledged (0x${tail[0].toString(16)})`);
    }
    return payload;
  }

  /** optiboot answers within a couple of attempts; the first can be noise. */
  async sync(attempts = 5) {
    let last;
    for (let i = 0; i < attempts; i++) {
      try {
        await this.command([STK.GET_SYNC]);
        return true;
      } catch (err) {
        last = err;
        await this.io.drain?.();
      }
    }
    throw new Error(`no bootloader answered: ${last && last.message}`);
  }

  async signature() {
    return this.command([STK.READ_SIGN], 3);
  }

  async program(image) {
    await this.command([STK.ENTER_PROGMODE]);
    for (let offset = 0; offset < image.length; offset += this.pageSize) {
      const page = image.subarray(offset, Math.min(offset + this.pageSize,
                                                   image.length));
      // STK500 addresses flash in WORDS, not bytes. Getting this wrong writes
      // the image to twice its address and the board does nothing at all.
      const word = offset >> 1;
      await this.command([STK.LOAD_ADDRESS, word & 0xff, (word >> 8) & 0xff]);
      await this.command([STK.PROG_PAGE, (page.length >> 8) & 0xff,
                          page.length & 0xff, 0x46, ...page]);
      this.log(`  wrote ${page.length} bytes at 0x${offset.toString(16).padStart(4, '0')}`);
    }
    await this.command([STK.LEAVE_PROGMODE]);
  }

  async verify(image) {
    await this.command([STK.ENTER_PROGMODE]);
    for (let offset = 0; offset < image.length; offset += this.pageSize) {
      const length = Math.min(this.pageSize, image.length - offset);
      const word = offset >> 1;
      await this.command([STK.LOAD_ADDRESS, word & 0xff, (word >> 8) & 0xff]);
      const back = await this.command(
        [STK.READ_PAGE, (length >> 8) & 0xff, length & 0xff, 0x46], length);
      for (let i = 0; i < length; i++) {
        if (back[i] !== image[offset + i]) {
          await this.command([STK.LEAVE_PROGMODE]);
          throw new Error(
            `verify failed at 0x${(offset + i).toString(16)}: ` +
            `wrote 0x${image[offset + i].toString(16)}, read 0x${back[i].toString(16)}`);
        }
      }
    }
    await this.command([STK.LEAVE_PROGMODE]);
    return true;
  }
}

/** Web Serial as a byte transport, with a read buffer and a deadline. */
export function serialTransport(port, { timeout = 3000 } = {}) {
  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();
  let buffer = new Uint8Array(0);
  let closed = false;

  const pump = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.length) {
          const merged = new Uint8Array(buffer.length + value.length);
          merged.set(buffer); merged.set(value, buffer.length);
          buffer = merged;
        }
      }
    } catch { /* the port went away; read() below will time out and say so */ }
    closed = true;
  })();

  return {
    async write(bytes) { await writer.write(bytes); },
    async read(count) {
      const deadline = Date.now() + timeout;
      while (buffer.length < count) {
        if (Date.now() > deadline) {
          throw new Error(`timed out waiting for ${count} byte(s) from the board`);
        }
        if (closed && buffer.length < count) throw new Error('port closed');
        await new Promise(r => setTimeout(r, 5));
      }
      const out = buffer.subarray(0, count);
      buffer = buffer.subarray(count);
      return out;
    },
    async drain() { buffer = new Uint8Array(0); },
    async close() {
      try { reader.cancel(); } catch {}
      try { writer.releaseLock(); } catch {}
      await pump.catch(() => {});
    },
  };
}

/** Pulse DTR/RTS to reset the board into its bootloader. */
export async function pulseReset(port) {
  await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  await new Promise(r => setTimeout(r, 250));
  await port.setSignals({ dataTerminalReady: true, requestToSend: true });
  await new Promise(r => setTimeout(r, 50));
}

/**
 * The whole flow: reset, sync, program, verify.
 * `open` lets a test supply a port without touching navigator.serial.
 */
export async function flashAvr(port, hexText, {
  baud = [115200, 57600], pageSize = 128, log = () => {}, verify = true,
} = {}) {
  // A list, not a number. An Uno and a modern Nano run optiboot at 115200,
  // but a Nano with the older bootloader runs at 57600 -- and the symptom is
  // identical to a board that is not there: no sync. avrdude users learn to
  // pass -b 57600 by folklore; probing is cheaper than folklore.
  const rates = Array.isArray(baud) ? baud : [baud];
  const { image, highest } = parseIntelHex(hexText);
  log(`image: ${highest + 1} bytes`);

  let io = null, stk = null, chosen = null, lastError = null;
  for (const rate of rates) {
    await port.open({ baudRate: rate });
    // Short reads while probing: a wrong rate fails by silence, and the only
    // cost of guessing wrong should be a second, not fifteen.
    io = serialTransport(port, { timeout: rates.length > 1 ? 1500 : 3000 });
    try {
      if (port.setSignals) {
        log(`resetting the board (DTR), ${rate} baud…`);
        await pulseReset(port);
        await io.drain();
      }
      stk = new Stk500(io, { pageSize, log });
      await stk.sync(rates.length > 1 ? 3 : 5);
      chosen = rate;
      break;
    } catch (err) {
      lastError = err;
      await io.close();
      try { await port.close(); } catch {}
      io = null;
      stk = null;
      if (rates.length > 1) log(`  nothing at ${rate} baud`);
    }
  }
  if (!chosen) {
    throw new Error(
      `no bootloader answered at ${rates.join(' or ')} baud` +
      (lastError ? `: ${lastError.message}` : ''));
  }

  try {
    log(`bootloader answered at ${chosen} baud`);
    log('programming…');
    await stk.program(image);
    if (verify) {
      log('verifying…');
      await stk.verify(image);
    }
    log(`done: ${highest + 1} bytes written${verify ? ' and verified' : ''}`);
    return { bytes: highest + 1, baud: chosen };
  } finally {
    await io.close();
    try { await port.close(); } catch {}
  }
}

// ------------------------------------------------- micro:bit and Pico
//
// Neither has a serial bootloader to talk STK500 to. What both have, once
// MicroPython is on them, is a REPL over USB CDC -- and MicroPython's "raw
// REPL" is a perfectly good file-transfer channel. That is what microfs and
// the official editors use, and it is far less machinery than splicing a
// script into a runtime image and asking the user to drag it to a drive.
//
// One function serves both, because at this level they are the same device:
// interrupt, enter raw mode, write main.py, read the size back, restart. The
// differences between them are all in what the PROGRAM says, which is the
// code generator's problem and not this one's.
//
// The trade is explicit: this writes main.py to a board that ALREADY has
// MicroPython. It does not install it. For a micro:bit that is a one-off from
// python.microbit.org; for a Pico it is holding BOOTSEL and dropping a UF2 on
// the drive that appears.

const CTRL_A = 0x01, CTRL_B = 0x02, CTRL_C = 0x03, CTRL_D = 0x04;

/** A Python bytes literal that survives the REPL: printable ASCII, escaped. */
export function pythonBytes(chunk) {
  let out = "b'";
  for (const byte of chunk) {
    if (byte === 0x5c) out += '\\\\';
    else if (byte === 0x27) out += "\\'";
    else if (byte === 0x0a) out += '\\n';
    else if (byte === 0x0d) out += '\\r';
    else if (byte === 0x09) out += '\\t';
    else if (byte >= 0x20 && byte < 0x7f) out += String.fromCharCode(byte);
    else out += '\\x' + byte.toString(16).padStart(2, '0');
  }
  return out + "'";
}

/** Read until `marker` appears, or time out saying what was seen instead. */
async function readUntil(io, marker, { timeout = 5000 } = {}) {
  const deadline = Date.now() + timeout;
  let seen = '';
  const decoder = new TextDecoder();
  while (!seen.includes(marker)) {
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for ${JSON.stringify(marker)}; ` +
                      `saw ${JSON.stringify(seen.slice(-60))}`);
    }
    try {
      seen += decoder.decode(await io.read(1));
    } catch {
      throw new Error(`the board stopped responding; saw ` +
                      `${JSON.stringify(seen.slice(-60))}`);
    }
  }
  return seen;
}

export class RawRepl {
  constructor(io) { this.io = io; this.encoder = new TextEncoder(); }

  async send(text) { await this.io.write(this.encoder.encode(text)); }
  async control(byte) { await this.io.write(Uint8Array.from([byte])); }

  async enter() {
    // Two interrupts: the first stops a running program, the second lands in
    // the REPL even if the first arrived while it was already idle.
    await this.control(CTRL_C);
    await this.control(CTRL_C);
    await this.io.drain?.();
    await this.control(CTRL_A);
    await readUntil(this.io, 'raw REPL');
    await readUntil(this.io, '>');
  }

  /** Run one block and return its stdout. Raises on a Python traceback. */
  async exec(code) {
    await this.send(code);
    await this.control(CTRL_D);
    await readUntil(this.io, 'OK');
    const body = await readUntil(this.io, '\x04');
    const error = await readUntil(this.io, '\x04');
    const failure = error.replace(/\x04/g, '').trim();
    if (failure) throw new Error(failure.split('\n').pop());
    await readUntil(this.io, '>');
    return body.replace(/\x04/g, '');
  }

  async exit() { await this.control(CTRL_B); }
}

/**
 * Write `source` to main.py on an attached micro:bit and restart it.
 * `chunk` stays small because each write becomes one REPL line.
 */
export async function flashMicroPython(port, source, {
  baud = 115200, chunk = 96, log = () => {}, name = 'main.py',
} = {}) {
  const bytes = new TextEncoder().encode(source);
  await port.open({ baudRate: baud });
  const io = serialTransport(port, { timeout: 6000 });
  try {
    log('interrupting whatever is running…');
    const repl = new RawRepl(io);
    await repl.enter();

    log(`writing ${name} (${bytes.length} bytes)…`);
    await repl.exec(`fd = open(${JSON.stringify(name)}, 'wb')\nf = fd.write`);
    for (let at = 0; at < bytes.length; at += chunk) {
      await repl.exec(`f(${pythonBytes(bytes.subarray(at, at + chunk))})`);
    }
    await repl.exec('fd.close()');

    // Read it back. A REPL that swallowed a chunk looks exactly like one that
    // did not, right up until the board runs the wrong program.
    log('verifying…');
    const size = (await repl.exec(
      `import os\nprint(os.size(${JSON.stringify(name)}))`)).trim();
    if (parseInt(size, 10) !== bytes.length) {
      throw new Error(`wrote ${bytes.length} bytes but the board has ${size}`);
    }

    await repl.exit();
    log('restarting…');
    await repl.control(CTRL_D);
    log(`done: ${name}, ${bytes.length} bytes`);
    return { bytes: bytes.length };
  } finally {
    await io.close();
    try { await port.close(); } catch {}
  }
}

// -------------------------------------------------------------------- STC
//
// The STC12/STC15 ISP. Its bootloader answers ONLY after a cold power-on --
// a reset pulse will not do it, which is the single fact most STC tutorials
// get wrong -- so the flow is: open the port, start sending 0x7F, and wait
// for the user to pull and reapply power. That is a different interaction
// from the AVR's, not just different bytes, which is why it lives here rather
// than in flashAvr.
//
// The wire format was not deduced. scripts/fixtures/stc12-session.json is a
// transcript captured from real stcgal driving a simulated STC12C5A60S2, and
// scripts/test-flash.mjs asserts this code reproduces it packet for packet.
// An implementation that merely agrees with my reading of stcgal would pass a
// test I also wrote from that reading; one that reproduces stcgal's own bytes
// is speaking the protocol.

const STC_START = [0x46, 0xb9], STC_HOST = 0x6a, STC_MCU = 0x68, STC_END = 0x16;

// The erase command carries the PART's flash size, not the image's, so the
// model has to be recognised from the magic the bootloader announces. `isp`
// selects the family's genuinely different framing and command sequence.
export const STC_MODELS = {
  0xd17e: { name: 'STC12C5A60S2', code: 61440, isp: 'stc12' },
  0xd168: { name: 'STC12C5A16S2', code: 16384, isp: 'stc12' },
  0xf408: { name: 'STC15F2K60S2', code: 61440, isp: 'stc15' },
  0xf002: { name: 'STC89C52RC', code: 8192, isp: 'stc89' },
};

export function stcPacket(data) {
  const body = [STC_HOST, ((data.length + 6) >> 8) & 0xff, (data.length + 6) & 0xff,
                ...data];
  const sum = body.reduce((a, b) => a + b, 0) & 0xffff;
  return Uint8Array.from([...STC_START, ...body, (sum >> 8) & 0xff, sum & 0xff,
                          STC_END]);
}

/** STC89 uses the same envelope but an 8-bit rather than 16-bit checksum. */
export function stc89Packet(data) {
  const body = [STC_HOST, ((data.length + 5) >> 8) & 0xff, (data.length + 5) & 0xff,
                ...data];
  const sum = body.reduce((a, b) => a + b, 0) & 0xff;
  return Uint8Array.from([...STC_START, ...body, sum, STC_END]);
}

/** Read an STC envelope without assuming which family's checksum it uses. */
export async function readStcRawPacket(io, { deadline = Infinity } = {}) {
  let head = (await io.read(1))[0];
  let prefix;
  // A few old bootloaders omit 46 B9 on the unsolicited greeting.
  if (head === STC_MCU) {
    prefix = [STC_START[0], STC_START[1], STC_MCU];
  } else {
    // A running application may continuously print text. Bound one scan so
    // the caller can pulse 0x7F again and, crucially, enforce its deadline.
    let skipped = 0;
    while (head !== STC_START[0]) {
      if (Date.now() > deadline) throw new Error('STC frame scan timed out');
      if (++skipped >= 256) throw new Error('no STC frame in serial noise');
      head = (await io.read(1))[0];
    }
    if ((await io.read(1))[0] !== STC_START[1]) throw new Error('bad frame start');
    const direction = (await io.read(1))[0];
    if (direction !== STC_MCU) throw new Error('bad packet direction');
    prefix = [STC_START[0], STC_START[1], direction];
  }
  const lengthBytes = await io.read(2);
  const length = (lengthBytes[0] << 8) | lengthBytes[1];
  if (length < 5 || length > 4096) throw new Error(`bad STC packet length ${length}`);
  const rest = await io.read(length - 3);
  if (rest[rest.length - 1] !== STC_END) throw new Error('bad frame end');
  return Uint8Array.from([...prefix, ...lengthBytes, ...rest]);
}

function decodeStcRaw(raw, checksumBytes) {
  const length = (raw[3] << 8) | raw[4];
  if (raw.length !== length + 2 || raw.at(-1) !== STC_END) {
    throw new Error('bad STC packet envelope');
  }
  const checksumAt = raw.length - 1 - checksumBytes;
  const data = raw.subarray(5, checksumAt);
  const want = raw.subarray(2, checksumAt).reduce((a, b) => a + b, 0) &
               (checksumBytes === 1 ? 0xff : 0xffff);
  const given = checksumBytes === 1 ? raw[checksumAt] :
    (raw[checksumAt] << 8) | raw[checksumAt + 1];
  if (given !== want) throw new Error('packet checksum mismatch');
  return data;
}

/** Read one MCU packet and return its payload, checksum verified. */
export async function readStcPacket(io) {
  return decodeStcRaw(await readStcRawPacket(io), 2);
}

export async function readStc89Packet(io) {
  return decodeStcRaw(await readStcRawPacket(io), 1);
}

/** IAP wait states, straight from the datasheet table stcgal encodes. */
function iapDelay(hz) {
  if (hz < 1e6) return 0x87;
  if (hz < 2e6) return 0x86;
  if (hz < 3e6) return 0x85;
  if (hz < 6e6) return 0x84;
  if (hz < 12e6) return 0x83;
  if (hz < 20e6) return 0x82;
  if (hz < 24e6) return 0x81;
  return 0x80;
}

export function stcBaud(clockHz, transferBaud) {
  const brt = 256 - Math.round(clockHz / (transferBaud * 16));
  if (brt <= 1 || brt > 255) {
    throw new Error(`${transferBaud} baud cannot be set from a ${clockHz} Hz clock`);
  }
  return { brt, csum: (2 * (256 - brt)) & 0xff, iap: iapDelay(clockHz), delay: 0x80 };
}

/** Decode the status packet the bootloader greets us with. */
export function stcStatus(payload, handshakeBaud) {
  if (payload.length < 23) throw new Error('status packet too short');
  let counter = 0;
  for (let i = 0; i < 8; i++) counter += (payload[1 + 2 * i] << 8) | payload[2 + 2 * i];
  counter /= 8;
  return {
    clockHz: (handshakeBaud * counter * 12) / 7,
    magic: (payload[20] << 8) | payload[21],
    bslVersion: payload[17],
  };
}

export function stc89Status(payload, handshakeBaud) {
  const info = stcStatus(payload, handshakeBaud);
  if (payload.length < 53 || payload[0] !== 0x00) {
    throw new Error('invalid STC89 status packet');
  }
  const first = (payload[1] << 8) | payload[2];
  for (let i = 1; i < 8; i++) {
    const word = (payload[1 + 2 * i] << 8) | payload[2 + 2 * i];
    if (word !== first) throw new Error('inconsistent STC89 frequency measurement');
  }
  return { ...info, option: payload[19] };
}

export function stc89Baud(clockHz, transferBaud) {
  const ticks = Math.round(clockHz / (transferBaud * 32));
  const reload = 256 - ticks;
  if (reload < 1 || reload > 255) {
    throw new Error(`${transferBaud} baud cannot be set from a ${clockHz} Hz clock`);
  }
  return reload;
}

/**
 * Program an STC12 or STC89 over its family-specific ISP. `onPowerCycle` is called once, so the caller
 * can tell the user to do the one thing only they can do.
 *
 * Options are deliberately NOT programmed. stcgal rewrites them on every run;
 * this does not, because an option byte is how you disable the ISP pin and
 * lock yourself out of the part, and nothing in the pseudocode dialect asks
 * for one to change.
 */
export async function flashStc(port, hexText, {
  handshakeBaud = 2400, transferBaud = 115200, log = () => {},
  onPowerCycle = () => {}, sink = null, timeoutMs = 30000,
} = {}) {
  const parsed = parseIntelHex(hexText);
  // stcgal pads to a 512-byte boundary before erasing or writing, and the
  // block count in the erase command is derived from the padded length. An
  // unpadded image asks the part to erase fewer blocks than it then writes.
  const padded = new Uint8Array(Math.ceil(parsed.image.length / 512) * 512).fill(0xff);
  padded.set(parsed.image);
  const image = padded;
  const sent = [];
  const record = (packet) => { sent.push(packet); return packet; };

  await port.open({ baudRate: handshakeBaud });
  let io = serialTransport(port, { timeout: 4000 });
  const say = async (data) => { const p = record(stcPacket(data)); await io.write(p); };
  const say89 = async (data) => { const p = record(stc89Packet(data)); await io.write(p); };
  const reopen = async (baudRate) => {
    if (sink) return;
    await io.close();
    await port.close();
    await port.open({ baudRate, parity: 'none' });
    io = serialTransport(port, { timeout: 4000 });
  };

  try {
    log('waiting for the bootloader — pull the power and reapply it');
    onPowerCycle();
    const deadline = Date.now() + timeoutMs;
    let rawStatus = null;
    let pulsing = true;
    // Reading and pulsing must be concurrent. One pulse followed by the
    // transport's four-second read timeout leaves almost the entire STC89
    // cold-start window uncovered; the real YL-39 only answered when 0x7F was
    // kept on the wire about every 20 ms.
    const pulseTask = (async () => {
      while (pulsing && Date.now() <= deadline) {
        try { await io.write(Uint8Array.from([0x7f])); } catch { /* USB may re-enumerate */ }
        await new Promise(r => setTimeout(r, 20));
      }
    })();
    try {
      while (!rawStatus) {
        if (Date.now() > deadline) {
          throw new Error('no bootloader greeting: the STC ISP answers only ' +
                          'after a COLD power-on, and a reset button is not enough');
        }
        try { rawStatus = await readStcRawPacket(io, { deadline }); } catch { /* keep pulsing */ }
      }
    } finally {
      pulsing = false;
      await pulseTask;
    }
    let status12 = null, status89 = null;
    try { status12 = decodeStcRaw(rawStatus, 2); } catch { /* not STC12 framing */ }
    try { status89 = decodeStcRaw(rawStatus, 1); } catch { /* not STC89 framing */ }
    const candidate = status89 || status12;
    if (!candidate || candidate.length < 22) throw new Error('unrecognised STC greeting');
    const announcedMagic = (candidate[20] << 8) | candidate[21];
    const announcedModel = STC_MODELS[announcedMagic];
    const protocol = announcedModel?.isp || (status12 ? 'stc12' : 'stc89');
    const status = protocol === 'stc89' ? status89 : status12;
    if (!status) throw new Error(`${protocol} greeting has the wrong checksum format`);
    const info = protocol === 'stc89' ? stc89Status(status, handshakeBaud) :
      stcStatus(status, handshakeBaud);
    log(`bootloader: magic ${info.magic.toString(16)}, ` +
        `${(info.clockHz / 1e6).toFixed(3)} MHz, BSL ${(info.bslVersion >> 4)}.` +
        `${info.bslVersion & 0xf}`);

    const magicHi = (info.magic >> 8) & 0xff, magicLo = info.magic & 0xff;

    if (protocol === 'stc89') {
      const model = STC_MODELS[info.magic];
      if (model) log(`part: ${model.name}, ${model.code} bytes of flash`);
      const reload = stc89Baud(info.clockHz, transferBaud);
      const reloadField = [0xff, reload];
      const expect89 = async (command, message, check = () => true) => {
        const reply = await readStc89Packet(io);
        if (reply[0] !== command || !check(reply.subarray(1))) throw new Error(message);
        return reply;
      };

      log('negotiating STC89 baud…');
      await say89([0x8f, ...reloadField, 0x00, 0x06, 0xa0, 0x81]);
      // The MCU echoes at the trial rate. Switch immediately after the write;
      // close() is the only drain-and-retune operation Web Serial exposes.
      if (transferBaud !== handshakeBaud) await reopen(transferBaud);
      await expect89(0x8f, 'STC89 baud probe refused');

      if (transferBaud !== handshakeBaud) await reopen(handshakeBaud);
      await say89([0x8e, ...reloadField, 0x00, 0x06, 0xa0]);
      if (transferBaud !== handshakeBaud) await reopen(transferBaud);
      await expect89(0x8e, 'STC89 baud commit refused');

      for (let attempt = 0; attempt < 4; attempt++) {
        await say89([0x80, 0x00, 0x00, 0x36, 0x01, magicHi, magicLo]);
        await expect89(0x80, `STC89 link test ${attempt + 1} refused`, p => p.length === 0);
      }

      const blocks = 2 * Math.ceil(image.length / 512);
      log(`erasing ${blocks} blocks…`);
      await say89([0x84, blocks, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33]);
      await expect89(0x80, 'STC89 erase refused',
        p => p.length === 7 && p[0] === magicHi && p[1] === magicLo);

      const BLOCK = 128;
      for (let at = 0; at < image.length; at += BLOCK) {
        const chunk = image.subarray(at, at + BLOCK);
        const address = [(at >>> 24) & 0xff, (at >>> 16) & 0xff,
                         (at >>> 8) & 0xff, at & 0xff];
        await say89([0x00, ...address, 0x00, BLOCK, ...chunk]);
        const checksum = chunk.reduce((a, b) => (a + b) & 0xff, 0);
        await expect89(0x80, `STC89 write refused at 0x${at.toString(16)}`,
          p => p.length === 1 && p[0] === checksum);
        log(`  wrote ${chunk.length} bytes at 0x${at.toString(16).padStart(4, '0')}`);
      }

      // Echo only the option byte this bootloader just reported. This keeps
      // the chip's ISP-pin and clock policy unchanged.
      await say89([0x8d, info.option, 0xff, 0xff, 0xff]);
      await expect89(0x8d, 'STC89 option echo refused',
        p => p.length === 4 && p[0] === info.option);
      await say89([0x82]);
      log(`done: ${parsed.image.length} bytes (padded to ${image.length})`);
      return { bytes: parsed.image.length, padded: image.length, sent,
               model: model?.name, protocol };
    }

    if (protocol !== 'stc12') {
      const model = STC_MODELS[info.magic];
      throw new Error(`${model?.name || 'this chip'} uses ${protocol}; support is not implemented yet`);
    }
    const { brt, csum, iap, delay } = stcBaud(info.clockHz, transferBaud);

    log('negotiating baud…');
    await say([0x50, 0x00, 0x00, 0x36, 0x01, magicHi, magicLo]);
    if ((await readStcPacket(io))[0] !== 0x8f) throw new Error('handshake refused');
    await say([0x8f, 0xc0, brt, 0x3f, csum, delay, iap]);
    if ((await readStcPacket(io))[0] !== 0x8f) throw new Error('baud test refused');
    await say([0x8e, 0xc0, brt, 0x3f, csum, delay]);
    if ((await readStcPacket(io))[0] !== 0x84) throw new Error('baud switch refused');

    // Web Serial cannot change the rate of an open port, so this is a close
    // and reopen. It is also the most fragile step here and the one a
    // simulator cannot vouch for.
    if (transferBaud !== handshakeBaud && !sink) {
      await io.close();
      await port.close();
      await port.open({ baudRate: transferBaud });
      io = serialTransport(port, { timeout: 4000 });
    }

    const model = STC_MODELS[info.magic];
    const codeSize = model ? model.code : image.length;
    if (model) log(`part: ${model.name}, ${codeSize} bytes of flash`);
    else log(`unknown magic ${info.magic.toString(16)}; erasing only what is written`);
    const blocks = Math.ceil(image.length / 512) * 2;
    const total = Math.ceil(codeSize / 512) * 2;
    log(`erasing ${blocks} blocks…`);
    const erase = [0x84, 0xff, 0x00, blocks, 0x00, 0x00, total,
                   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0x80; i > 0x0d; i--) erase.push(i);
    await say(erase);
    if ((await readStcPacket(io))[0] !== 0x00) throw new Error('erase refused');

    const BLOCK = 128;
    for (let at = 0; at < image.length; at += BLOCK) {
      const chunk = image.subarray(at, at + BLOCK);
      const body = [0, 0, 0, (at >> 8) & 0xff, at & 0xff, (BLOCK >> 8) & 0xff,
                    BLOCK & 0xff, ...chunk];
      while (body.length < BLOCK + 7) body.push(0);
      await say(body);
      if ((await readStcPacket(io))[0] !== 0x00) {
        throw new Error(`write refused at 0x${at.toString(16)}`);
      }
      log(`  wrote ${chunk.length} bytes at 0x${at.toString(16).padStart(4, '0')}`);
    }

    await say([0x69, 0x00, 0x00, 0x36, 0x01, magicHi, magicLo]);
    if ((await readStcPacket(io))[0] !== 0x8d) throw new Error('finish refused');

    await say([0x82]);                       // reset and run
    log(`done: ${parsed.image.length} bytes (padded to ${image.length})`);
    return { bytes: parsed.image.length, padded: image.length, sent };
  } finally {
    try { await io.close(); } catch {}
    try { await port.close(); } catch {}
  }
}

/** The micro:bit's name for it, kept so existing callers still work. */
export const flashMicrobit = flashMicroPython;

// ------------------------------------------------- STM32 (AN3155)
//
// The fourth family, entered a fourth way. The STM32 system bootloader in
// ROM listens on USART only when BOOT0 is HIGH at reset (the F030 breakout
// has a jumper), and it speaks AN3155 at 8E1 -- EVEN parity, unlike every
// other board here. The image is a RAW flash binary, vectors first (word 0
// is the initial SP, word 1 the reset handler) -- exactly what the compile
// service emits for target stm32f030, format bin.
//
// Byte-for-byte twin of bw-board's src/stm32-isp.js (mock-ROM-tested) and
// stc's Rust stm32bsl; the three keep identical frame rules so a capture
// from any of them reads the same.

const STM32_ACK = 0x79;
const STM32_NACK = 0x1f;
const STM32_PID_F03X = 0x0444;

function stm32Xor(bytes) { return bytes.reduce((a, b) => a ^ b, 0); }
function stm32Be32(v) {
  return Uint8Array.of((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
}

/**
 * Flash a raw STM32 image over the ROM bootloader.
 * @param {SerialPort} port  an OPEN Web Serial port at 8E1 (see openStm32Port)
 * @param {Uint8Array} image raw flash binary, vectors first
 */
export async function flashStm32(port, image, {
  base = 0x08000000, log = () => {}, timeout = 2000,
} = {}) {
  const io = serialTransport(port, { timeout });
  const one = async (what, t = timeout) => {
    const b = (await io.read(1))[0];
    if (b === STM32_NACK) throw new Error(`${what}: NACK`);
    if (b !== STM32_ACK) throw new Error(`${what}: expected ACK 0x79, got 0x${b.toString(16)}`);
  };
  const command = async (cmd, what) => { await io.write(Uint8Array.of(cmd, (~cmd) & 0xff)); await one(what); };
  try {
    // init: the 0x7F auto-baud byte; ACK once per reset, NACK on re-init tolerated
    await io.write(Uint8Array.of(0x7f));
    const first = (await io.read(1))[0];
    if (first !== STM32_ACK && first !== STM32_NACK) {
      throw new Error('init: no bootloader (is BOOT0 high, a fresh reset, and the line 8E1?)');
    }
    log('bootloader answered');

    // GET_ID
    await command(0x02, 'GET_ID');
    const idn = (await io.read(1))[0];
    const idbody = await io.read(idn + 1);
    await one('GET_ID tail');
    let id = 0; for (const b of idbody) id = (id << 8) | b;
    log(`product id 0x${id.toString(16)}${id === STM32_PID_F03X ? ' (STM32F03x)' : ''}`);

    // extended global erase (the F0 family's 0x44)
    await command(0x44, 'EXTENDED_ERASE');
    await io.write(Uint8Array.of(0xff, 0xff, 0x00));
    await one('global erase', 30000);
    log('erased');

    // chunked write, 256 bytes, word-aligned, padded with 0xFF
    const padded = image.length % 4 === 0 ? image
      : Uint8Array.of(...image, ...new Uint8Array(4 - (image.length % 4)).fill(0xff));
    for (let off = 0; off < padded.length; off += 256) {
      const chunk = padded.subarray(off, Math.min(off + 256, padded.length));
      const addr = base + off;
      await command(0x31, 'WRITE_MEMORY');
      const a = stm32Be32(addr);
      await io.write(Uint8Array.of(...a, stm32Xor(a)));
      await one(`write addr 0x${addr.toString(16)}`);
      const head = (chunk.length - 1) & 0xff;
      await io.write(Uint8Array.of(head, ...chunk, head ^ stm32Xor(chunk)));
      await one(`write data 0x${addr.toString(16)}`);
      log(`  wrote ${chunk.length} bytes at 0x${addr.toString(16).padStart(8, '0')}`);
    }

    // GO: jump to the application
    await command(0x21, 'GO');
    const g = stm32Be32(base);
    await io.write(Uint8Array.of(...g, stm32Xor(g)));
    await one('go');
    log(`done: ${padded.length} bytes written, running`);
    return { bytes: padded.length, productId: id };
  } finally {
    await io.close();
    try { await port.close(); } catch {}
  }
}

/**
 * Open a Web Serial port at STM32's 8E1 line format. Kept separate from
 * flashStm32 so a test can hand in a fake port, and so the ONE place the
 * parity differs from every other board is obvious.
 */
export async function openStm32Port(port, { baud = 115200 } = {}) {
  await port.open({ baudRate: baud, dataBits: 8, parity: 'even', stopBits: 1, flowControl: 'none' });
  return port;
}

// ------------------------------------------------- parallel EEPROM (Ben Eater programmer)
//
// The fifth path, and the odd one: it does not flash the TARGET at all.
// A 6502 / Z80 breadboard computer has no bootloader — its program lives
// in a parallel EEPROM (28C256) that is burned on a bench programmer and
// physically moved to the board. Ben Eater's Arduino programmer (MIT) is
// that bench, and the fleet's bweep.ino sketch gives it a serial upload
// protocol (tools/eeprom-programmer/bweep.ino in the stc repo). This
// drives that sketch: paginate the image on 64-byte page boundaries,
// write+verify each, ACK/NACK per page (the AN3155 values, so one log
// reads every flasher).
//
// The port is a plain 115200 8N1 Web Serial port (no parity, no DTR
// dance) — the programmer is an Arduino running our sketch, not the
// target.

const EEPROM_PAGE = 64;

/**
 * @param {SerialPort} port  an OPEN 115200 8N1 Web Serial port to the programmer
 * @param {Uint8Array} image the ROM bytes; written from base (default 0)
 */
export async function flashEeprom(port, image, {
  base = 0, log = () => {}, timeout = 3000, identify = true,
} = {}) {
  const io = serialTransport(port, { timeout });
  const ack = async (what) => {
    const b = (await io.read(1))[0];
    if (b === 0x1f) throw new Error(`${what}: NACK (write or verify failed at the programmer)`);
    if (b !== 0x79) throw new Error(`${what}: expected ACK 0x79, got 0x${b.toString(16)}`);
  };
  try {
    if (identify) {
      await io.write(Uint8Array.of(0x56)); // 'V'
      // "BWEEP1\n" then ACK — read the line, then the ack.
      let banner = '';
      for (let i = 0; i < 16; i++) {
        const c = String.fromCharCode((await io.read(1))[0]);
        if (c === '\n') break;
        banner += c;
      }
      await ack('identify');
      if (!/^BWEEP/.test(banner)) throw new Error(`not a bweep programmer (said "${banner}")`);
      log(`programmer: ${banner}`);
    }
    let written = 0;
    let off = 0;
    while (off < image.length) {
      // Never straddle a page: the chunk reaches the next page boundary,
      // then advances by exactly what was sent (NOT a fixed page — an
      // aligned-short first chunk would otherwise skip the tail bytes).
      const addr = base + off;
      const room = EEPROM_PAGE - (addr % EEPROM_PAGE);
      const n = Math.min(room, EEPROM_PAGE, image.length - off);
      const chunk = image.subarray(off, off + n);
      const aHi = (addr >> 8) & 0xff, aLo = addr & 0xff;
      let ck = n ^ aHi ^ aLo;
      for (const b of chunk) ck ^= b;
      await io.write(Uint8Array.of(0x57, aHi, aLo, n, ...chunk, ck & 0xff)); // 'W'
      await ack(`write 0x${addr.toString(16)}`);
      written += n;
      off += n;
      if ((off & 0x3ff) < n) log(`  ${written}/${image.length} bytes`);
    }
    await io.write(Uint8Array.of(0x51)); // 'Q'
    await ack('finish');
    log(`done: ${written} bytes burned and verified`);
    return { bytes: written };
  } finally {
    await io.close();
    try { await port.close(); } catch {}
  }
}

// ------------------------------------------------- ATmega2560 / Arduino Mega (STK500v2)
//
// The Mega's bootloader (stk500boot) speaks STK500v2, not v1 — a
// different framing entirely — so the optiboot path above cannot touch
// it. Clean-room from Atmel's AVR068 application note ("STK500
// Communication Protocol"), the wire format only. avrdude calls this the
// `wiring` programmer; the reset is the same DTR pulse as v1.
//
// Frame (AVR068 §2): MESSAGE_START(0x1B) SEQ SIZE_HI SIZE_LO TOKEN(0x0E)
//   BODY... CHECKSUM(XOR of every byte from MESSAGE_START through the last
//   body byte). Every reply echoes the command byte then STATUS_CMD_OK(0).

const STK2 = {
  MESSAGE_START: 0x1b, TOKEN: 0x0e, STATUS_CMD_OK: 0x00,
  CMD_SIGN_ON: 0x01, CMD_LOAD_ADDRESS: 0x06,
  CMD_ENTER_PROGMODE_ISP: 0x10, CMD_LEAVE_PROGMODE_ISP: 0x11,
  CMD_PROGRAM_FLASH_ISP: 0x13, CMD_READ_FLASH_ISP: 0x14,
};

/** A framed STK500v2 conversation over the same byte transport. */
export class Stk500v2 {
  constructor(transport, { pageSize = 256, log = () => {} } = {}) {
    this.io = transport; this.pageSize = pageSize; this.log = log;
    this.seq = 1;
  }

  async command(body) {
    const seq = this.seq; this.seq = (this.seq + 1) & 0xff;
    const size = body.length;
    const frame = [STK2.MESSAGE_START, seq, (size >> 8) & 0xff, size & 0xff, STK2.TOKEN, ...body];
    let ck = 0; for (const b of frame) ck ^= b;
    frame.push(ck);
    await this.io.write(Uint8Array.from(frame));

    // Read a reply frame and verify its structure + checksum.
    const start = await this.io.read(1);
    if (start[0] !== STK2.MESSAGE_START) throw new Error(`v2: no MESSAGE_START (got 0x${start[0].toString(16)})`);
    const rseq = (await this.io.read(1))[0];
    if (rseq !== seq) throw new Error(`v2: sequence ${rseq} != ${seq}`);
    const sz = await this.io.read(2);
    const rsize = (sz[0] << 8) | sz[1];
    const token = (await this.io.read(1))[0];
    if (token !== STK2.TOKEN) throw new Error(`v2: no TOKEN (got 0x${token.toString(16)})`);
    const rbody = await this.io.read(rsize);
    const rck = (await this.io.read(1))[0];
    let rc = STK2.MESSAGE_START ^ rseq ^ sz[0] ^ sz[1] ^ token;
    for (const b of rbody) rc ^= b;
    if (rc !== rck) throw new Error('v2: reply checksum mismatch');
    if (rbody[0] !== body[0]) throw new Error(`v2: reply for 0x${rbody[0].toString(16)}, expected 0x${body[0].toString(16)}`);
    if (rbody[1] !== STK2.STATUS_CMD_OK) throw new Error(`v2: command 0x${body[0].toString(16)} status 0x${rbody[1].toString(16)}`);
    return rbody;
  }

  async signOn() {
    const r = await this.command([STK2.CMD_SIGN_ON]);
    // body: CMD, STATUS_OK, len, signature bytes
    return String.fromCharCode(...r.slice(3, 3 + r[2]));
  }

  /** Load a WORD address. The top byte's bit 7 is the extended-address
   *  flag AVR068 uses for >128 KB parts — the 2560's 256 KB needs it. */
  async loadAddress(byteOffset) {
    const word = byteOffset >> 1;
    await this.command([STK2.CMD_LOAD_ADDRESS,
      ((word >> 24) & 0xff) | 0x80, (word >> 16) & 0xff, (word >> 8) & 0xff, word & 0xff]);
  }

  async program(image) {
    await this.command([STK2.CMD_ENTER_PROGMODE_ISP, 200, 100, 25, 32, 0, 0x53, 3, 0xac, 0x53, 0, 0]);
    for (let off = 0; off < image.length; off += this.pageSize) {
      const page = image.subarray(off, Math.min(off + this.pageSize, image.length));
      await this.loadAddress(off);
      // CMD, size_hi, size_lo, mode(0xC1 = page mode + write page), delay,
      // cmd1..3, poll1..2, then data. The bootloader ignores the ISP timing
      // fields and writes `data` at the loaded address.
      await this.command([STK2.CMD_PROGRAM_FLASH_ISP,
        (page.length >> 8) & 0xff, page.length & 0xff, 0xc1, 6, 0x40, 0x4c, 0x20, 0, 0, ...page]);
      this.log(`  wrote ${page.length} bytes at 0x${off.toString(16).padStart(4, '0')}`);
    }
    await this.command([STK2.CMD_LEAVE_PROGMODE_ISP, 1, 1]);
  }

  async verify(image) {
    await this.command([STK2.CMD_ENTER_PROGMODE_ISP, 200, 100, 25, 32, 0, 0x53, 3, 0xac, 0x53, 0, 0]);
    for (let off = 0; off < image.length; off += this.pageSize) {
      const len = Math.min(this.pageSize, image.length - off);
      await this.loadAddress(off);
      const r = await this.command([STK2.CMD_READ_FLASH_ISP, (len >> 8) & 0xff, len & 0xff, 0x20]);
      // body: CMD, STATUS_OK, data..., STATUS_OK
      for (let i = 0; i < len; i++) {
        if (r[2 + i] !== image[off + i]) {
          await this.command([STK2.CMD_LEAVE_PROGMODE_ISP, 1, 1]);
          throw new Error(`verify failed at 0x${(off + i).toString(16)}: ` +
            `wrote 0x${image[off + i].toString(16)}, read 0x${r[2 + i].toString(16)}`);
        }
      }
    }
    await this.command([STK2.CMD_LEAVE_PROGMODE_ISP, 1, 1]);
    return true;
  }
}

/** Flash an ATmega2560 / Arduino Mega over its STK500v2 bootloader. */
export async function flashAvrMega(port, hexText, {
  baud = 115200, pageSize = 256, log = () => {}, verify = true,
} = {}) {
  const { image, highest } = parseIntelHex(hexText);
  await port.open({ baudRate: baud });
  const io = serialTransport(port, { timeout: 5000 });
  const stk = new Stk500v2(io, { pageSize, log });
  try {
    if (port.setSignals) await pulseReset(port);
    const sig = await stk.signOn();
    log(`bootloader: ${sig}`);
    await stk.program(image);
    if (verify) await stk.verify(image);
    log(`done: ${highest + 1} bytes written${verify ? ' and verified' : ''}`);
    return { bytes: highest + 1 };
  } finally {
    await io.close();
    try { await port.close(); } catch {}
  }
}
