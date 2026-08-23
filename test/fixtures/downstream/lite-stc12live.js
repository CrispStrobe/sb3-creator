const makeExt = require('../adapter');

// The STC12 tethered (Web Serial) extension — drive a real chip over UART.
//
// This source is identical to extensions/CrispStrobe/stc12live.js (the gallery
// copy). The conformance test in sb3-creator asserts they agree on opcodes,
// argument shapes, and menu identity.
module.exports = makeExt(`// Name: STC12 Live
// ID: stc12live
// Description: Connect to a real STC12 / 8051 chip over USB serial.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // Wire protocol — from stc/include/live-proto.h.
  // Frame: SOF LEN CMD payload[LEN] SUM   where (LEN+CMD+payload+SUM) & 0xFF == 0.
  // ============================================================================

  const SOF = 0x7e;
  const CMD_HELLO = 0x01;
  const CMD_READ = 0x02;
  const CMD_WRITE = 0x03;
  // Address spaces (live-proto.h LIVE_SP_*): a port register is SFR, a single
  // pin is a bit address in BIT space.
  const SP_SFR = 2;
  const SP_BIT = 4;
  const CMD_POS = 0x0a;
  const CMD_RESET = 0x0b;
  const REPLY = (c) => c | 0x80;
  const EVT_HALT = 0xf0;
  const NAK = 0xff;

  const BAUD = 115200;
  const EXCHANGE_TIMEOUT_MS = 2000;

  // Consumed-resource bits from the HELLO capability blob.
  const RES_TIMER0 = 0x01;
  const RES_TIMER1 = 0x02;
  const RES_UART1 = 0x10;

  // ---- frame codec ----------------------------------------------------------

  function buildFrame(cmd, payload = []) {
    const len = payload.length;
    const body = [len, cmd, ...payload];
    let sum = 0;
    for (const b of body) sum += b;
    body.push(-sum & 0xff);
    return new Uint8Array([SOF, ...body]);
  }

  // Decoder FSM: HUNT → LEN → CMD → DATA → SUM.  Mirrors live-monitor.py.
  class Decoder {
    constructor() {
      this.reset();
      this.onFrame = null; // (cmd, payload) => void
    }
    reset() {
      this._state = 0; // 0=HUNT 1=LEN 2=CMD 3=DATA 4=SUM
      this._len = 0;
      this._cmd = 0;
      this._buf = [];
      this._sum = 0;
    }
    feed(byte) {
      switch (this._state) {
        case 0: // HUNT
          if (byte === SOF) this._state = 1;
          break;
        case 1: // LEN
          this._len = byte;
          this._sum = byte;
          this._state = 2;
          break;
        case 2: // CMD
          this._cmd = byte;
          this._sum += byte;
          this._buf = [];
          this._state = this._len > 0 ? 3 : 4;
          break;
        case 3: // DATA
          this._buf.push(byte);
          this._sum += byte;
          if (this._buf.length >= this._len) this._state = 4;
          break;
        case 4: // SUM
          this._sum += byte;
          if ((this._sum & 0xff) === 0 && this.onFrame) {
            this.onFrame(this._cmd, this._buf);
          }
          this._state = 0;
          break;
      }
    }
    // Call on a read timeout to abandon a truncated frame.
    idle() {
      this._state = 0;
    }
  }

  // ============================================================================
  // EXTENSION
  // ============================================================================

  class STC12Live {
    constructor() {
      this._port = null;
      this._reader = null;
      this._writer = null;
      this._decoder = new Decoder();
      this._connected = false;
      this._capabilities = null;
      this._pendingResolve = null;
      this._pendingCmd = 0;
      this._readLoop = null;
      // Publish capabilities to runtime so the palette layer can grey out
      // blocks that are unavailable on this target.  Same seam as runtime.stc
      // and runtime.circuitBoard.
      this._runtime =
        typeof Scratch !== "undefined" && Scratch.vm && Scratch.vm.runtime
          ? Scratch.vm.runtime
          : null;
    }

    getInfo() {
      return {
        id: "stc12live",
        name: Scratch.translate({
          id: "stc12live.name",
          default: "STC12 Live",
        }),
        color1: "#2e8b57",
        color2: "#267349",
        color3: "#1e5c3a",
        blocks: [
          {
            opcode: "connect",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "stc12live.connect",
              default: "connect to chip",
            }),
          },
          {
            opcode: "disconnect",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate({
              id: "stc12live.disconnect",
              default: "disconnect",
            }),
          },
          {
            opcode: "isConnected",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate({
              id: "stc12live.connected",
              default: "connected?",
            }),
          },
          {
            opcode: "chipVersion",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "stc12live.version",
              default: "chip protocol version",
            }),
          },
          {
            opcode: "consumed",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate({
              id: "stc12live.consumed",
              default: "monitor consumes",
            }),
          },
        ],
        menus: {},
      };
    }

    // ---- transport ----------------------------------------------------------

    async _open() {
      if (
        typeof navigator === "undefined" ||
        !navigator.serial ||
        typeof navigator.serial.requestPort !== "function"
      ) {
        throw new Error("Web Serial is not available in this browser");
      }
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: BAUD });
      this._port = port;
      this._writer = port.writable.getWriter();
      this._decoder.reset();
      // Start the read loop.
      this._readLoop = this._runReadLoop(port.readable.getReader());
    }

    async _runReadLoop(reader) {
      this._reader = reader;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            for (const b of value) this._decoder.feed(b);
          }
        }
      } catch (e) {
        // Port closed or disconnected — clean up.
        if (this._connected) {
          this._connected = false;
          this._capabilities = null;
        }
      }
    }

    async _close() {
      this._connected = false;
      this._capabilities = null;
      if (this._runtime) this._runtime.stc12liveCapabilities = null;
      try {
        if (this._reader) {
          await this._reader.cancel();
          this._reader.releaseLock();
          this._reader = null;
        }
      } catch {
        /* ignore */
      }
      try {
        if (this._writer) {
          this._writer.releaseLock();
          this._writer = null;
        }
      } catch {
        /* ignore */
      }
      try {
        if (this._port) {
          await this._port.close();
          this._port = null;
        }
      } catch {
        /* ignore */
      }
    }

    // Send a frame, wait for the reply with the matching command code.
    _exchange(cmd, payload = []) {
      return new Promise((resolve, reject) => {
        const frame = buildFrame(cmd, payload);
        const timer = setTimeout(() => {
          this._decoder.idle();
          this._pendingResolve = null;
          reject(new Error("timeout waiting for reply"));
        }, EXCHANGE_TIMEOUT_MS);

        this._pendingCmd = REPLY(cmd);
        this._pendingResolve = (rxCmd, rxPayload) => {
          clearTimeout(timer);
          this._pendingResolve = null;
          if (rxCmd === NAK) {
            reject(
              new Error(
                "NAK: " +
                  (rxPayload[1] || "unknown") +
                  " for cmd 0x" +
                  cmd.toString(16)
              )
            );
          } else {
            resolve(rxPayload);
          }
        };

        this._decoder.onFrame = (rxCmd, rxPayload) => {
          // Unsolicited events (EVT_HALT) are stored but do not resolve the exchange.
          if (rxCmd === EVT_HALT) return;
          if (
            this._pendingResolve &&
            (rxCmd === this._pendingCmd || rxCmd === NAK)
          ) {
            this._pendingResolve(rxCmd, rxPayload);
          }
        };

        this._writer.write(frame).catch(reject);
      });
    }

    // ---- block methods ------------------------------------------------------

    async connect() {
      if (this._connected) return;
      try {
        await this._open();
        // HELLO: send 0-byte payload, expect capability blob back.
        const cap = await this._exchange(CMD_HELLO);
        this._capabilities = {
          version: cap[0] || 0,
          maxPayload: cap[1] || 64,
          stepKinds: cap[2] || 0,
          bpKinds: cap[3] || 0,
          readable: cap[4] || 0,
          writable: cap[5] || 0,
          flags: cap[6] || 0,
          maxTasks: cap[7] || 0,
          consumed: cap[8] || 0,
        };
        this._connected = true;
        // Publish to runtime so the palette and circuit extension can read them.
        if (this._runtime) this._runtime.stc12liveCapabilities = this._capabilities;
      } catch (e) {
        await this._close();
        // Surface the reason rather than failing silently.
        if (typeof console !== "undefined")
          console.error("stc12live connect:", e.message);
      }
    }

    async disconnect() {
      await this._close();
    }

    isConnected() {
      return this._connected;
    }

    // ── Control writes (host -> chip) ─────────────────────────────────────
    // The tethered face of the Controller panel: a DIGITAL widget (button,
    // toggle, D-pad) drives a real port pin. LIVE_CMD_WRITE(space, addr_hi,
    // addr_lo, data...) — the firmware writes the addressed SFR/bit. Analog
    // inputs (a pot behind an ADC) CANNOT be tethered: they are a physical
    // voltage, not a host-writable register. Guarded by the HELLO writable
    // capability bitmap so a refused space fails loudly, not silently.
    // (No template literals or backtick strings here: the whole extension is a
    // makeExt template string, so any backtick would terminate it early.)
    async writeMem(space, addr, data) {
      if (!this._connected) throw new Error("stc12live: not connected");
      if (this._capabilities && !((this._capabilities.writable >> space) & 1)) {
        throw new Error("stc12live: space " + space + " is not writable on this target");
      }
      const bytes = Array.isArray(data) ? data : [data & 0xff];
      await this._exchange(CMD_WRITE, [
        space & 0xff, (addr >> 8) & 0xff, addr & 0xff, ...bytes.map((b) => b & 0xff),
      ]);
    }

    // Drive one bit-addressable pin (a port bit) high/low.
    async setBit(bitAddr, on) {
      return this.writeMem(SP_BIT, bitAddr, [on ? 1 : 0]);
    }

    // Write a whole SFR (e.g. a port register, or a PWM compare value).
    async writeSfr(sfrAddr, value) {
      return this.writeMem(SP_SFR, sfrAddr, [value & 0xff]);
    }

    chipVersion() {
      if (!this._capabilities) return "not connected";
      return this._capabilities.version;
    }

    consumed() {
      if (!this._capabilities) return "not connected";
      const c = this._capabilities.consumed;
      const names = [];
      if (c & RES_TIMER0) names.push("Timer0");
      if (c & RES_TIMER1) names.push("Timer1");
      if (c & RES_UART1) names.push("UART1");
      if (c & 0x04) names.push("Timer2");
      if (c & 0x08) names.push("BRT");
      if (c & 0x20) names.push("PCA");
      return names.length ? names.join(", ") : "none";
    }
  }

  Scratch.extensions.register(new STC12Live());
})(Scratch);
`);
