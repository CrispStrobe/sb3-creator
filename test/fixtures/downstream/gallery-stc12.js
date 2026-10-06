// Name: STC12 / 8051 pins
// ID: stc12
// Description: Drive the pins declared with PIN in the Code tab.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  /** Pin declarations live on the runtime; see the importer's loadProject. */
  function decls(runtime) {
    const stc = runtime && runtime.stc;
    return stc && Array.isArray(stc.pins) ? stc.pins : [];
  }

  function portDecls(runtime) {
    const stc = runtime && runtime.stc;
    return stc && Array.isArray(stc.ports) ? stc.ports : [];
  }

  function partDecls(runtime) {
    const stc = runtime && runtime.stc;
    return stc && Array.isArray(stc.parts) ? stc.parts : [];
  }

  function tableDecls(runtime) {
    const stc = runtime && runtime.stc;
    return stc && Array.isArray(stc.tables) ? stc.tables : [];
  }

  /** Which device family is active? Drives palette name, color, and gating. */
  function deviceFamily(runtime) {
    const stc = runtime && runtime.stc;
    if (!stc || !stc.device) return "8051";
    if (/eater6502|w65c02/i.test(stc.device)) return "6502";
    if (/pico|rp2040/i.test(stc.device)) return "pico";
    if (/arduino-mega/i.test(stc.device)) return "mega";
    if (/arduino|atmega/i.test(stc.device)) return "avr";
    return "8051";
  }

  /**
   * The extension's own record of what the program wrote. It is the answer a
   * read gives when no circuit is attached, and the store for the frame
   * buffers and part state the circuit layer does not model yet. It is NOT how
   * a pin reaches the circuit: for a long time it was the only place a pin
   * write went, and nothing read it, so `turn on LED` lit nothing even on a
   * wired bench. The circuit is reached through circuitBoard() below.
   */
  function board(runtime) {
    if (!runtime._stc12Pins) runtime._stc12Pins = Object.create(null);
    return runtime._stc12Pins;
  }

  /**
   * The simulated board the Circuit tab publishes (vm.runtime.circuitBoard,
   * the same seam the devices, circuit and micro:bit+ extensions use), or
   * null when no circuit is attached.
   */
  function circuitBoard(runtime) {
    const b = runtime && runtime.circuitBoard;
    return b && typeof b.setPin === "function" ? b : null;
  }

  /**
   * The board terminal a PIN declaration names. The same mapping the stc12
   * JS/Python drivers use: 8051 pins are P<port>.<bit>; board-class devices
   * (Nano D13/A0, Pico GP25, Mega D22) carry their terminal in `where`. A
   * 6502 VIA pin (PA0..PB7) is the eater6502 part's via1.pa0..via1.pb7.
   */
  function terminalOf(p) {
    if (p.port !== undefined && p.port !== null && p.bit !== undefined)
      return "P" + p.port + "." + p.bit;
    if (p.portLetter)
      return "via1.p" + String(p.portLetter).toLowerCase() + p.bit;
    return String(p.where || p.pin || p.name).toLowerCase();
  }

  /**
   * The pin mode the drivers use: outputs push-pull; analog inputs high-Z;
   * 8051 inputs quasi-bidirectional (the weak pull-up); board-class inputs a
   * programmed pull (active-low -> pull-up, else pull-down).
   */
  function modeOf(p) {
    if (p.direction === "output") return "pushpull";
    if (p.direction === "analog") return "input";
    if (p.port !== undefined && p.port !== null) return "quasi";
    return p.activeLow ? "input-pullup" : "input-pulldown";
  }

  /**
   * The board terminal of a pin a PORT or PART declaration claims: an 8051
   * {port, bit} is P<port>.<bit>, a board-class {where} its own name — the
   * same mapping terminalOf gives a PIN.
   */
  function pinTerminal(pin) {
    if (pin.port !== undefined && pin.port !== null && pin.bit !== undefined)
      return "P" + pin.port + "." + pin.bit;
    return String(pin.where).toLowerCase();
  }

  /** A keypad declared in the board-class form (micro:bit/Pico `where`). */
  function genericKeypad(part) {
    return !!(part.rows && part.rows[0] && part.rows[0].where !== undefined);
  }

  /**
   * Arm every declared INPUT pin once per board instance, as the drivers do:
   * nothing else ever calls setPin on a read-only pin, so without this it has
   * no pin state and its net floats. The third argument is the pull's rail —
   * a quasi pin idles HIGH, which IS the 8051 weak pull-up. An INPUT PORT's
   * eight pins and a KEYPAD4X4's rows and columns are armed the same way:
   * 8051 pins quasi-high (the scanner's idle state), a board-class keypad's
   * columns pulled up and its rows released (the MicroPython scanner's).
   */
  const armed = typeof WeakSet === "function" ? new WeakSet() : null;
  function arm(runtime, b) {
    if (!armed || armed.has(b)) return;
    armed.add(b);
    for (const p of decls(runtime)) {
      if (p.direction === "output") continue;
      const m = modeOf(p);
      b.setPin(terminalOf(p), m, m === "quasi");
    }
    for (const w of portDecls(runtime)) {
      if (w.direction === "output") continue;
      for (let i = 0; i < 8; i++)
        b.setPin("P" + w.port + "." + i, "quasi", true);
    }
    for (const k of partDecls(runtime)) {
      if (k.type !== "keypad4x4") continue;
      const generic = genericKeypad(k);
      for (const r of k.rows) {
        if (generic) b.setPin(pinTerminal(r), "input", false);
        else b.setPin(pinTerminal(r), "quasi", true);
      }
      for (const c of k.cols) {
        if (generic) b.setPin(pinTerminal(c), "input-pullup", true);
        else b.setPin(pinTerminal(c), "quasi", true);
      }
    }
  }

  /** The attached board, armed, and the declaration of `name` — or nulls. */
  function attached(runtime, name) {
    const b = circuitBoard(runtime);
    if (!b) return { b: null, p: null };
    arm(runtime, b);
    const p = decls(runtime).find((d) => d.name === name) || null;
    return { b, p };
  }

  class STC12 {
    constructor(runtime) {
      this.runtime = runtime;
    }

    getInfo() {
      const family = deviceFamily(this.runtime);
      const is8051 = family === "8051";
      const isAVR = family === "avr" || family === "mega";
      const is6502 = family === "6502";
      const hasPWM = !is6502;
      const paletteName =
        family === "6502"
          ? Scratch.translate("6502 Pins")
          : family === "pico"
            ? Scratch.translate("Pico Pins")
            : family === "mega"
              ? Scratch.translate("Arduino Mega Pins")
              : family === "avr"
                ? Scratch.translate("Arduino Pins")
                : Scratch.translate("STC12 / 8051 Pins");
      const color1 = is6502
        ? "#B8860B"
        : family === "pico"
          ? "#8E44AD"
          : isAVR
            ? "#00878F"
            : "#3d7ea6";
      const color2 = is6502
        ? "#8B6914"
        : family === "pico"
          ? "#6C3483"
          : isAVR
            ? "#006B73"
            : "#2f6383";

      return {
        id: "stc12",
        name: paletteName,
        color1: color1,
        color2: color2,
        blocks: [
          {
            opcode: "setpin",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("turn [STATE] [PIN]"),
            arguments: {
              STATE: { type: Scratch.ArgumentType.STRING, menu: "states" },
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
            },
          },
          {
            opcode: "toggle",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("toggle [PIN]"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
            },
          },
          {
            opcode: "writepin",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PIN] to [VALUE]"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            },
          },
          {
            opcode: "read",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("read [PIN]"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
            },
          },
          {
            // The chip's own on-die sensor (sb3-creator `chip temperature`):
            // whole degrees C. The chip sits on the bench, so in the VM it
            // reads the bench temperature (bw-board board.temperatureC).
            opcode: "chiptemp",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("chip temperature"),
          },
          "---",
          {
            opcode: "setpwm",
            blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: !hasPWM,
            text: Scratch.translate("set [PIN] to [VALUE] percent"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "settone",
            blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: !is8051,
            text: Scratch.translate("set [PIN] to [VALUE] hz"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 440 },
            },
          },
          {
            opcode: "setport",
            blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: !is8051,
            text: Scratch.translate("set [PORT] to [VALUE]"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "ports" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "readport",
            blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: !is8051,
            text: Scratch.translate("read [PORT]"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "ports" },
            },
          },
          {
            opcode: "setpart",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PART] to [VALUE]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "print",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("print [VALUE]"),
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "hello",
              },
              MODE: { type: Scratch.ArgumentType.STRING, menu: "printModes" },
            },
          },
          "---",
          {
            opcode: "whenpin",
            blockType: Scratch.BlockType.HAT,
            text: Scratch.translate("when [PIN] [EDGE]"),
            isEdgeActivated: true,
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              EDGE: { type: Scratch.ArgumentType.STRING, menu: "edges" },
            },
          },
          "---",
          // ---- KEYPAD4X4 / SEVENSEG8 / LEDBANK8. Mirrors of the reference
          // copy (sb3-creator reference/extensions/stc12.js) and of the C the
          // emitter writes. They were added there on 2026-08-18 (4962d4d,
          // 952b623) and never ported here, so every one of them was an
          // undefined opcode in the bundle: a silent no-op in the VM and a
          // half-loaded workspace in the editor. See sb3-creator
          // test/STC12-CONFORMANCE-FINDING.md.
          //
          // Not device-gated: these hang off a PART declaration, and the
          // 'parts' menu is already driven by what the Code tab declared. A
          // board with no such PART simply offers no item to choose.
          {
            opcode: "keypad",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("key on [PART]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "whenkey",
            blockType: Scratch.BlockType.HAT,
            text: Scratch.translate("when key [KEY] [EDGE]"),
            isEdgeActivated: true,
            arguments: {
              KEY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              EDGE: { type: Scratch.ArgumentType.STRING, menu: "edges" },
            },
          },
          {
            opcode: "seg_shownum",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("show number [NUM] on [PART]"),
            arguments: {
              NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "seg_showdigit",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate(
              "show digit [DIGIT] = value [VALUE] on [PART]"
            ),
            arguments: {
              DIGIT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "seg_setsegs",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate(
              "set digit [DIGIT] to segments [SEGS] on [PART]"
            ),
            arguments: {
              DIGIT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              SEGS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "seg_clear",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("clear display [PART]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "led_on",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("turn on led [N] on [PART]"),
            arguments: {
              N: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "led_off",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("turn off led [N] on [PART]"),
            arguments: {
              N: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "led_set",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set leds to [VALUE] on [PART]"),
            arguments: {
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "led_only",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("light only led [N] on [PART]"),
            arguments: {
              N: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "tableindex",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("[TABLE] [ [INDEX] ]"),
            arguments: {
              TABLE: { type: Scratch.ArgumentType.STRING, menu: "tables" },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          // ---- MATRIX8X8: an 8x8 dot-matrix SCREEN that self-scans in the
          // Timer-0 ISR. All verbs write the RAM frame buffer only. STYLE and
          // DIR are FIELD menus (acceptReporters:false), the coordinates and
          // level/bits are numeric inputs — matching what sb3-creator emits.
          {
            opcode: "matrix_setpx",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate(
              "[STYLE] pixel [X] [Y] level [LEVEL] on [PART]"
            ),
            arguments: {
              STYLE: { type: Scratch.ArgumentType.STRING, menu: "pixelStyles" },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              LEVEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "matrix_row",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("draw row [Y] = [BITS] on [PART]"),
            arguments: {
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              BITS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 255 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "matrix_image",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("show image [TABLE] on [PART]"),
            arguments: {
              TABLE: { type: Scratch.ArgumentType.STRING, menu: "tables" },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "matrix_scroll",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("scroll [PART] [DIR]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
              DIR: { type: Scratch.ArgumentType.STRING, menu: "scrollDirs" },
            },
          },
          {
            opcode: "matrix_dim",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PART] brightness [LEVEL]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
              LEVEL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
            },
          },
          {
            opcode: "matrix_paint",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("paint [GRID] on [PART]"),
            arguments: {
              GRID: {
                type: "led8x8",
                defaultValue:
                  "0330033033333333333333333333333303333330003333000003300000000000",
              },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "matrix_clear",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("clear screen [PART]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "matrix_getpx",
            blockType: Scratch.BlockType.BOOLEAN,
            text: Scratch.translate("pixel [X] [Y] on [PART] is on"),
            arguments: {
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
        ],
        menus: {
          // acceptReporters:false is what makes these FIELDS rather than inputs,
          // which is how sb3-creator writes them.
          pins: { acceptReporters: false, items: "pinNames" },
          states: {
            acceptReporters: false,
            items: ["on", "off", "high", "low"],
          },
          ports: { acceptReporters: false, items: "portNames" },
          parts: { acceptReporters: false, items: "partNames" },
          printModes: { acceptReporters: false, items: ["text", "number"] },
          edges: { acceptReporters: false, items: ["pressed", "released"] },
          tables: { acceptReporters: false, items: "tableNames" },
          pixelStyles: {
            acceptReporters: false,
            items: ["light", "clear", "on", "off", "brightness"],
          },
          scrollDirs: {
            acceptReporters: false,
            items: ["left", "right", "up", "down"],
          },
        },
      };
    }

    /** Declared pins, or a placeholder so the palette is never an empty dropdown. */
    pinNames() {
      const names = decls(this.runtime).map((p) => p.name);
      if (names.length) return names;
      const family = deviceFamily(this.runtime);
      const hint =
        family === "6502"
          ? "(declare a PIN like PA0 or PB3 in the Code tab)"
          : family === "pico"
            ? "(declare a PIN like GP25 in the Code tab)"
            : family === "mega"
              ? "(declare a PIN like D22 or A8 in the Code tab)"
              : family === "avr"
                ? "(declare a PIN like D13 or A0 in the Code tab)"
                : "(declare a PIN in the Code tab)";
      return [{ text: hint, value: "" }];
    }

    portNames() {
      const names = portDecls(this.runtime).map((p) => p.name);
      return names.length
        ? names
        : [{ text: "(declare a PORT in the Code tab)", value: "" }];
    }

    partNames() {
      const names = partDecls(this.runtime).map((p) => p.name);
      return names.length
        ? names
        : [{ text: "(declare a PART in the Code tab)", value: "" }];
    }

    tableNames() {
      const names = tableDecls(this.runtime).map((t) => t.name);
      return names.length
        ? names
        : [{ text: "(declare a TABLE in the Code tab)", value: "" }];
    }

    setpin(args) {
      const pin = decls(this.runtime).find((p) => p.name === args.PIN);
      const state = String(args.STATE);
      // ACTIVE LOW is the whole point of the declaration: "on" writes a 0.
      const level =
        state === "on"
          ? pin && pin.activeLow
            ? 0
            : 1
          : state === "off"
            ? pin && pin.activeLow
              ? 1
              : 0
            : state === "high"
              ? 1
              : 0;
      this._drive(args.PIN, level);
    }

    toggle(args) {
      this._drive(args.PIN, this._level(args.PIN) ? 0 : 1);
    }

    writepin(args) {
      this._drive(args.PIN, Number(args.VALUE) ? 1 : 0);
    }

    /** Record the level, and drive it onto the circuit's pin if one is attached. */
    _drive(name, level) {
      board(this.runtime)[name] = level;
      const { b, p } = attached(this.runtime, name);
      if (b && p) b.setPin(terminalOf(p), modeOf(p), !!level);
    }

    /**
     * The raw level of a pin: the circuit's, when one is attached (an input
     * reads what the button did, not what the program last wrote), else the
     * program's own last write.
     */
    _level(name) {
      const { b, p } = attached(this.runtime, name);
      if (b && p && typeof b.readPin === "function")
        return Number(b.readPin(terminalOf(p))) ? 1 : 0;
      const m = board(this.runtime);
      return Object.prototype.hasOwnProperty.call(m, name) ? m[name] : 0;
    }

    read(args) {
      const { b, p } = attached(this.runtime, args.PIN);
      // An ANALOG pin reads volts from the board; the MCU scales to counts
      // (the drivers' rule, 5 V full scale).
      if (b && p && p.direction === "analog" && b.readAnalog) {
        const v = Number(b.readAnalog(terminalOf(p)));
        return isFinite(v)
          ? Math.max(0, Math.min(1023, Math.round((v / 5.0) * 1023)))
          : 0;
      }
      return this._level(args.PIN);
    }

    chiptemp() {
      const b = circuitBoard(this.runtime);
      const t = b ? Number(b.temperatureC) : NaN;
      return Math.round(isFinite(t) ? t : 25);
    }

    setpwm(args) {
      const pct = Number(args.VALUE);
      board(this.runtime)[args.PIN + "_pwm"] = pct;
      const { b, p } = attached(this.runtime, args.PIN);
      if (!b || !p) return;
      // The board switches the pin itself at the duty's edges (bw-board
      // setPwm), so an LED dims and a motor slows. A board without setPwm is
      // told nothing rather than a guess: a threshold would light a 25 % LED
      // at full or not at all.
      if (typeof b.setPwm === "function") b.setPwm(terminalOf(p), pct);
    }

    settone(args) {
      const hz = Number(args.VALUE);
      board(this.runtime)[args.PIN + "_tone"] = hz;
      const { b, p } = attached(this.runtime, args.PIN);
      if (b && p && typeof b.setTone === "function")
        b.setTone(terminalOf(p), hz);
    }

    /**
     * `set PORT to N`: the C is `P<n> = N`, all eight latches at once, so the
     * eight pins of the declared port are driven bit by bit (bit 0 = P<n>.0).
     * No ACTIVE LOW inversion, as in the C. An OUTPUT port is push-pull like
     * an OUTPUT PIN; writing an INPUT port sets its quasi latches.
     */
    setport(args) {
      const v = Number(args.VALUE) & 0xff;
      board(this.runtime)["port_" + args.PORT] = v;
      const w = portDecls(this.runtime).find((d) => d.name === args.PORT);
      const b = circuitBoard(this.runtime);
      if (!b || !w) return;
      arm(this.runtime, b);
      const mode = w.direction === "output" ? "pushpull" : "quasi";
      for (let i = 0; i < 8; i++)
        b.setPin("P" + w.port + "." + i, mode, !!((v >> i) & 1));
    }

    /** `read PORT`: the eight pins' levels from the circuit (the C reads P<n>). */
    readport(args) {
      const w = portDecls(this.runtime).find((d) => d.name === args.PORT);
      const b = circuitBoard(this.runtime);
      if (b && w && typeof b.readPin === "function") {
        arm(this.runtime, b);
        let v = 0;
        for (let i = 0; i < 8; i++)
          if (Number(b.readPin("P" + w.port + "." + i))) v |= 1 << i;
        return v;
      }
      const rec = board(this.runtime);
      const k = "port_" + args.PORT;
      return Object.prototype.hasOwnProperty.call(rec, k) ? rec[k] : 0;
    }

    /**
     * `set PART to N` on a 74HC595: the C's shift_out — latch low, then per
     * bit MSB first {clock low, the bit on DATA (inverted for ACTIVE LOW),
     * clock high}, latch high — on the three pins the declaration claims, so
     * the board's 595 model shifts and latches it. Any other PART has no
     * value to be set to (the C emits shift_out for a 595 only); the value
     * is recorded and nothing is driven.
     */
    setpart(args) {
      let v = Number(args.VALUE) & 0xff;
      board(this.runtime)["part_" + args.PART] = v;
      const part = partDecls(this.runtime).find((d) => d.name === args.PART);
      const b = circuitBoard(this.runtime);
      if (!b || !part || part.type !== "74hc595") return;
      arm(this.runtime, b);
      const data = pinTerminal(part.data);
      const clock = pinTerminal(part.clock);
      const latch = pinTerminal(part.latch);
      b.setPin(latch, "pushpull", false);
      for (let i = 0; i < 8; i++) {
        b.setPin(clock, "pushpull", false);
        let bit = v & 0x80 ? 1 : 0;
        if (part.activeLow) bit ^= 1;
        b.setPin(data, "pushpull", !!bit);
        v = (v << 1) & 0xff;
        b.setPin(clock, "pushpull", true);
      }
      b.setPin(latch, "pushpull", true);
    }

    // ---- MATRIX8X8: an 8x8 SCREEN. The editor keeps a simple 8-byte
    // threshold frame buffer per screen on the board (scr_<name>); a face
    // renderer reads it. bit7 of a row byte = the LEFT column, matching the C
    // driver and the image literals. Brightness is collapsed to on/off in this
    // preview (monochrome); the generated C carries the real 2-bit depth.
    //
    // NOT DRIVEN ONTO THE CIRCUIT, and named rather than faked: the screen
    // exists only as persistence of vision. The firmware scans one row per
    // Timer-0 tick (595 rows, port columns) and bw-board's matrix8x8 lights a
    // pixel by the fraction of each 20 ms window it was on. The VM has no tick
    // on board time, and a scan written in zero time is a zero-length window:
    // the model shows nothing. The other PART verbs below reach the circuit
    // because their models LATCH (sevenseg8, ledbank8, the 595) or are read
    // on demand (the keypad).
    _scr(part) {
      const b = board(this.runtime);
      const k = "scr_" + part;
      if (!Object.prototype.hasOwnProperty.call(b, k))
        b[k] = [0, 0, 0, 0, 0, 0, 0, 0];
      return b[k];
    }

    _scrpx(part, x, y, on) {
      x = Number(x) | 0;
      y = Number(y) | 0;
      if (x < 0 || x > 7 || y < 0 || y > 7) return;
      const buf = this._scr(part);
      const m = 0x80 >> x;
      if (on) buf[y] |= m;
      else buf[y] &= ~m & 0xff;
    }

    matrix_setpx(args) {
      const on =
        args.STYLE === "light" ||
        args.STYLE === "on" ||
        (args.STYLE === "brightness" && Number(args.LEVEL) > 0);
      this._scrpx(args.PART, args.X, args.Y, on);
    }

    matrix_row(args) {
      const y = Number(args.Y) | 0;
      if (y < 0 || y > 7) return;
      this._scr(args.PART)[y] = Number(args.BITS) & 0xff;
    }

    matrix_image(args) {
      // The image is the TABLE's values (8 row bytes), from the declaration
      // the Code tab made. This read `tab_<name>` off the record, which
      // nothing has ever written, so every image cleared the screen.
      const tbl = tableDecls(this.runtime).find((t) => t.name === args.TABLE);
      const img =
        tbl && Array.isArray(tbl.values)
          ? tbl.values
          : board(this.runtime)["tab_" + args.TABLE];
      const buf = this._scr(args.PART);
      for (let y = 0; y < 8; y++)
        buf[y] = Array.isArray(img) ? Number(img[y]) & 0xff : 0;
    }

    matrix_paint(args) {
      // The painted 8x8 grid (FieldLed8x8: 64 chars '0'..'3', row-major) blits
      // straight onto the sim buffer — 1-bit here (lit iff level>0); the C
      // emitter keeps per-pixel brightness via setpx. Front-end preview of what
      // the firmware will scan.
      const g = String(args.GRID || "");
      const buf = this._scr(args.PART);
      for (let y = 0; y < 8; y++) {
        let byte = 0;
        for (let x = 0; x < 8; x++) {
          if (g.charCodeAt(y * 8 + x) - 48 > 0) byte |= 0x80 >> x;
        }
        buf[y] = byte & 0xff;
      }
    }

    matrix_scroll(args) {
      const buf = this._scr(args.PART);
      if (args.DIR === "left")
        for (let y = 0; y < 8; y++) buf[y] = (buf[y] << 1) & 0xff;
      else if (args.DIR === "right")
        for (let y = 0; y < 8; y++) buf[y] = (buf[y] >> 1) & 0xff;
      else if (args.DIR === "up") {
        for (let y = 0; y < 7; y++) buf[y] = buf[y + 1];
        buf[7] = 0;
      } else {
        for (let y = 7; y > 0; y--) buf[y] = buf[y - 1];
        buf[0] = 0;
      }
    }

    matrix_dim(args) {
      board(this.runtime)["scrdim_" + args.PART] = Number(args.LEVEL);
    }

    matrix_clear(args) {
      const buf = this._scr(args.PART);
      for (let y = 0; y < 8; y++) buf[y] = 0;
    }

    matrix_getpx(args) {
      const x = Number(args.X) | 0,
        y = Number(args.Y) | 0;
      if (x < 0 || x > 7 || y < 0 || y > 7) return false;
      return (this._scr(args.PART)[y] & (0x80 >> x)) !== 0;
    }

    print(args) {
      // In the editor, print goes to the console. On hardware, it is the UART.
      const val =
        String(args.MODE) === "number"
          ? Number(args.VALUE)
          : String(args.VALUE);
      if (typeof console !== "undefined") console.log(val);
    }

    whenpin(args) {
      // Edge-triggered: returns true on the rising or falling edge of the
      // logical level (polarity-aware). isEdgeActivated makes scratch-vm
      // call this once per tick and fire the hat on a false→true transition.
      const pin = decls(this.runtime).find((p) => p.name === args.PIN);
      const raw = this._level(args.PIN);
      const level = pin && pin.activeLow ? !raw : !!raw;
      return args.EDGE === "pressed" ? level : !level;
    }

    // ---- KEYPAD4X4 / SEVENSEG8 / LEDBANK8 implementations. Byte-for-byte
    // the semantics of the reference copy and of the emitted C: the display
    // verbs write an 8-byte frame buffer, the LED verbs write a shadow byte.
    // On silicon the ISR pushes both to the pins every tick; here there is
    // no tick, so each verb pushes what CHANGED onto the circuit at once —
    // the board's sevenseg8 and ledbank8 models latch it — and the keypad is
    // scanned when it is read, as the C scanner does. These used to stop at
    // the buffers, and nothing read them: a wired A2 bench showed nothing.

    /**
     * The C scanner (bw_part_<name>_read): each row in turn driven low, the
     * four columns read, the first low column wins as row*4+col; -1 for no
     * key. 8051 rows go quasi-low then back to quasi-high; a board-class
     * keypad's row is driven low and released, its columns pulled up.
     */
    _scanKeypad(part, b) {
      arm(this.runtime, b);
      const generic = genericKeypad(part);
      const rows = part.rows.map(pinTerminal);
      const cols = part.cols.map(pinTerminal);
      const release = (t) =>
        generic ? b.setPin(t, "input", false) : b.setPin(t, "quasi", true);
      for (let r = 0; r < rows.length; r++) {
        b.setPin(rows[r], generic ? "pushpull" : "quasi", false);
        for (let c = 0; c < cols.length; c++) {
          if (!Number(b.readPin(cols[c]))) {
            release(rows[r]);
            return r * 4 + c;
          }
        }
        release(rows[r]);
      }
      return -1;
    }

    /** The key on a KEYPAD4X4 from the circuit, or null with none attached. */
    _keyOn(part) {
      const b = circuitBoard(this.runtime);
      if (!b || !part || typeof b.readPin !== "function") return null;
      return this._scanKeypad(part, b);
    }

    keypad(args) {
      // The scanned key 0..15, or -1 for none — same contract as the C
      // scanner (PART KEYPAD4X4). With no circuit, the record's
      // keypad_<name> answers (absent = "nothing pressed").
      const part = partDecls(this.runtime).find(
        (d) => d.name === args.PART && d.type === "keypad4x4"
      );
      const key = this._keyOn(part);
      if (key !== null) return key;
      const b = board(this.runtime);
      const k = "keypad_" + args.PART;
      return Object.prototype.hasOwnProperty.call(b, k) ? Number(b[k]) : -1;
    }

    whenkey(args) {
      // Edge hat on the sole KEYPAD4X4: true while the scanned key equals
      // KEY; isEdgeActivated turns the false-to-true transition into the
      // fire. The sole-keypad rule means the first declared one is the one.
      const part = partDecls(this.runtime).find((d) => d.type === "keypad4x4");
      let cur = this._keyOn(part);
      if (cur === null) {
        const b = board(this.runtime);
        const k = Object.keys(b).find((n) => n.indexOf("keypad_") === 0);
        cur = k ? Number(b[k]) : -1;
      }
      const held = cur === Number(args.KEY);
      return args.EDGE === "pressed" ? held : !held;
    }

    /**
     * Push a SEVENSEG8's frame buffer onto the circuit, digit by digit as the
     * ISR does: a digit's segments onto the segment port, then the 74HC138
     * address of that digit onto the three select pins.
     *
     * The board's sevenseg8 latches a digit when the address CHANGES and is
     * seen on two updates. So the digits are visited in GRAY-CODE order
     * (0 1 3 2 6 7 5 4, cyclic), one select bit flipped per step: there is
     * never an intermediate address to latch. Counting the address up instead
     * flips up to three pins, and where the select nets also carry other parts
     * (the A2's LED bank shares P2.2-P2.4) the model runs two updates per pin
     * write, sees an intermediate address twice and latches it with the wrong
     * segments: `12345678` showed `52547678`. Only changed digits are visited,
     * and the current address is reached by way of its neighbour. Common anode
     * inverts the segments, as the C does.
     */
    _segpush(name) {
      const part = partDecls(this.runtime).find(
        (d) => d.name === name && d.type === "sevenseg8"
      );
      const b = circuitBoard(this.runtime);
      if (!b || !part) return;
      arm(this.runtime, b);
      if (!this._segShown) this._segShown = {};
      let shown = this._segShown[name];
      if (!shown || shown.board !== b) {
        // A new board starts every digit blank at address 0.
        shown = { board: b, digits: new Array(8).fill(-1), sel: 0 };
        this._segShown[name] = shown;
      }
      const fb = this._segfb(name);
      const sel = part.selPins.map(pinTerminal);
      const GRAY = [0, 1, 3, 2, 6, 7, 5, 4];
      const step = (to) => {
        const byte = part.commonAnode ? ~fb[to] & 0xff : fb[to];
        for (let i = 0; i < 8; i++)
          b.setPin(
            "P" + part.segPort + "." + i,
            "pushpull",
            !!((byte >> i) & 1)
          );
        const k = Math.log2((shown.sel ^ to) & 7);
        // The one select pin that differs, then again: the second sighting.
        b.setPin(sel[k], "pushpull", !!((to >> k) & 1));
        b.setPin(sel[k], "pushpull", !!((to >> k) & 1));
        shown.sel = to;
        shown.digits[to] = fb[to];
      };
      const stale = (d) => shown.digits[d] !== fb[d];
      const at = GRAY.indexOf(shown.sel);
      if ([0, 1, 2, 3, 4, 5, 6, 7].every((d) => !stale(d) || d === shown.sel)) {
        // At most the current digit: out to a neighbour and back.
        if (!stale(shown.sel)) return;
        const here = shown.sel;
        step(GRAY[(at + 1) % 8]);
        step(here);
        return;
      }
      for (let i = 1; i <= 8; i++) {
        if (![0, 1, 2, 3, 4, 5, 6, 7].some(stale)) break;
        step(GRAY[(at + i) % 8]);
      }
    }

    /**
     * Push a LEDBANK8's shadow byte onto its port (inverted when ACTIVE LOW),
     * as the ISR does. On the A2 the port also carries a SEVENSEG8's select
     * pins: the write moves its address, as on silicon (the importer warns
     * the two cannot hold independent patterns), so that display is marked
     * stale and pushed again.
     */
    _ledpush(name) {
      const part = partDecls(this.runtime).find(
        (d) => d.name === name && d.type === "ledbank8"
      );
      const b = circuitBoard(this.runtime);
      if (!b || !part) return;
      arm(this.runtime, b);
      const shadow = this._bank(name);
      const byte = part.activeLow ? ~shadow & 0xff : shadow & 0xff;
      for (let i = 0; i < 8; i++)
        b.setPin("P" + part.ledPort + "." + i, "pushpull", !!((byte >> i) & 1));
      for (const ss of partDecls(this.runtime)) {
        if (ss.type !== "sevenseg8") continue;
        if (!(ss.selPins || []).some((p) => p.port === part.ledPort)) continue;
        const shown = this._segShown && this._segShown[ss.name];
        if (shown && shown.board === b) {
          shown.digits.fill(-1);
          shown.sel = ss.selPins.reduce(
            (a, p, k) => a | (((byte >> p.bit) & 1) << k),
            0
          );
        }
        this._segpush(ss.name);
      }
    }

    _segfb(part) {
      // 8-digit frame buffer, one segment byte per digit — the same shape
      // the C keeps in bw_<part>_fb. The board/circuit layer reads it.
      if (!this._segs) this._segs = {};
      if (!this._segs[part]) this._segs[part] = new Array(8).fill(0);
      return this._segs[part];
    }

    seg_shownum(args) {
      const FONT = [
        0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c,
        0x39, 0x5e, 0x79, 0x71,
      ];
      const fb = this._segfb(args.PART);
      fb.fill(0);
      let n = Number(args.NUM) | 0;
      const neg = n < 0;
      let u = Math.abs(n),
        i = 7;
      do {
        fb[i] = FONT[u % 10];
        u = Math.floor(u / 10);
        if (i === 0) break;
        i--;
      } while (u);
      if (neg && i > 0) fb[i - 1] = 0x40;
      this._segpush(args.PART);
    }

    seg_showdigit(args) {
      const FONT = [
        0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c,
        0x39, 0x5e, 0x79, 0x71,
      ];
      const d = Number(args.DIGIT) | 0;
      if (d < 0 || d > 7) return;
      this._segfb(args.PART)[d] = FONT[(Number(args.VALUE) | 0) & 0x0f];
      this._segpush(args.PART);
    }

    seg_setsegs(args) {
      const d = Number(args.DIGIT) | 0;
      if (d < 0 || d > 7) return;
      this._segfb(args.PART)[d] = Number(args.SEGS) & 0xff;
      this._segpush(args.PART);
    }

    seg_clear(args) {
      this._segfb(args.PART).fill(0);
      this._segpush(args.PART);
    }

    _bank(part) {
      // The shadow byte, exactly the C's bw_<part>_shadow.
      if (!this._banks) this._banks = {};
      if (!(part in this._banks)) this._banks[part] = 0;
      return this._banks[part];
    }

    led_on(args) {
      const n = Number(args.N) | 0;
      if (n < 0 || n > 7) return;
      this._banks[args.PART] = this._bank(args.PART) | (1 << n);
      this._ledpush(args.PART);
    }

    led_off(args) {
      const n = Number(args.N) | 0;
      if (n < 0 || n > 7) return;
      this._banks[args.PART] = this._bank(args.PART) & ~(1 << n);
      this._ledpush(args.PART);
    }

    led_set(args) {
      this._bank(args.PART);
      this._banks[args.PART] = Number(args.VALUE) & 0xff;
      this._ledpush(args.PART);
    }

    led_only(args) {
      const n = Number(args.N) | 0;
      this._bank(args.PART);
      this._banks[args.PART] = n < 0 || n > 7 ? 0 : 1 << n;
      this._ledpush(args.PART);
    }

    tableindex(args) {
      const tbl = tableDecls(this.runtime).find((t) => t.name === args.TABLE);
      if (!tbl || !tbl.values) return 0;
      const i = Math.max(
        0,
        Math.min(Number(args.INDEX) | 0, tbl.values.length - 1)
      );
      return tbl.values[i];
    }
  }

  Scratch.extensions.register(new STC12(Scratch.vm && Scratch.vm.runtime));
})(Scratch);
