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

  /** The board state this extension maintains, for whoever is watching. */
  function board(runtime) {
    if (!runtime._stc12Pins) runtime._stc12Pins = Object.create(null);
    return runtime._stc12Pins;
  }

  class STC12 {
    constructor(runtime) {
      this.runtime = runtime;
    }

    getInfo() {
      return {
        id: "stc12",
        name: Scratch.translate("STC12 / 8051 pins"),
        color1: "#3d7ea6",
        color2: "#2f6383",
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
          "---",
          {
            opcode: "setpwm",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PIN] to [VALUE] percent"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
            },
          },
          {
            opcode: "settone",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PIN] to [VALUE] hz"),
            arguments: {
              PIN: { type: Scratch.ArgumentType.STRING, menu: "pins" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 440 },
            },
          },
          {
            opcode: "setport",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set [PORT] to [VALUE]"),
            arguments: {
              PORT: { type: Scratch.ArgumentType.STRING, menu: "ports" },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "readport",
            blockType: Scratch.BlockType.REPORTER,
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
            opcode: "keypad",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("key on [PART]"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
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
            text: Scratch.translate("[STYLE] pixel [X] [Y] level [LEVEL] on [PART]"),
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
      return names.length
        ? names
        : [{ text: "(declare a PIN in the Code tab)", value: "" }];
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

    /** The live transport, if connected. */
    _live() {
      return this.runtime && this.runtime._stc12live;
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
      board(this.runtime)[args.PIN] = level;
      // Forward to the tethered target if connected.
      const live = this._live();
      if (live) live.drivePin(args.PIN, state);
    }

    toggle(args) {
      const b = board(this.runtime);
      b[args.PIN] = b[args.PIN] ? 0 : 1;
      const live = this._live();
      if (live) live.togglePin(args.PIN);
    }

    writepin(args) {
      board(this.runtime)[args.PIN] = Number(args.VALUE) ? 1 : 0;
      const live = this._live();
      if (live) live.writePinLevel(args.PIN, Number(args.VALUE));
    }

    read(args) {
      // If a live target is connected, read from the chip.
      const live = this._live();
      if (live) return live.readPin(args.PIN);
      const b = board(this.runtime);
      return Object.prototype.hasOwnProperty.call(b, args.PIN)
        ? b[args.PIN]
        : 0;
    }

    setpwm(args) {
      board(this.runtime)[args.PIN + "_pwm"] = Number(args.VALUE);
    }

    settone(args) {
      board(this.runtime)[args.PIN + "_tone"] = Number(args.VALUE);
    }

    setport(args) {
      board(this.runtime)["port_" + args.PORT] = Number(args.VALUE) & 0xff;
    }

    readport(args) {
      const b = board(this.runtime);
      const k = "port_" + args.PORT;
      return Object.prototype.hasOwnProperty.call(b, k) ? b[k] : 0;
    }

    setpart(args) {
      board(this.runtime)["part_" + args.PART] = Number(args.VALUE) & 0xff;
    }

    keypad(args) {
      // The scanned key 0..15, or -1 for none — same contract as the C
      // scanner (PART KEYPAD4X4). The circuit layer feeds keypad_<name>;
      // absent hardware reads as "nothing pressed".
      const b = board(this.runtime);
      const k = "keypad_" + args.PART;
      return Object.prototype.hasOwnProperty.call(b, k) ? Number(b[k]) : -1;
    }

    // ---- MATRIX8X8: an 8x8 SCREEN. The editor keeps a simple 8-byte
    // threshold frame buffer per screen on the board (scr_<name>); a face
    // renderer reads it. bit7 of a row byte = the LEFT column, matching the C
    // driver and the image literals. Brightness is collapsed to on/off in this
    // preview (monochrome); the generated C carries the real 2-bit depth.
    _scr(part) {
      const b = board(this.runtime);
      const k = "scr_" + part;
      if (!Object.prototype.hasOwnProperty.call(b, k)) b[k] = [0, 0, 0, 0, 0, 0, 0, 0];
      return b[k];
    }

    _scrpx(part, x, y, on) {
      x = Number(x) | 0; y = Number(y) | 0;
      if (x < 0 || x > 7 || y < 0 || y > 7) return;
      const buf = this._scr(part);
      const m = 0x80 >> x;
      if (on) buf[y] |= m; else buf[y] &= ~m & 0xff;
    }

    matrix_setpx(args) {
      const on = args.STYLE === "light" || args.STYLE === "on" ||
        (args.STYLE === "brightness" && Number(args.LEVEL) > 0);
      this._scrpx(args.PART, args.X, args.Y, on);
    }

    matrix_row(args) {
      const y = Number(args.Y) | 0;
      if (y < 0 || y > 7) return;
      this._scr(args.PART)[y] = Number(args.BITS) & 0xff;
    }

    matrix_image(args) {
      // The circuit layer feeds tab_<name> as an 8-byte array (the TABLE
      // values); blit it, or clear the screen if the table is absent.
      const img = board(this.runtime)["tab_" + args.TABLE];
      const buf = this._scr(args.PART);
      for (let y = 0; y < 8; y++) buf[y] = Array.isArray(img) ? (Number(img[y]) & 0xff) : 0;
    }

    matrix_scroll(args) {
      const buf = this._scr(args.PART);
      if (args.DIR === "left") for (let y = 0; y < 8; y++) buf[y] = (buf[y] << 1) & 0xff;
      else if (args.DIR === "right") for (let y = 0; y < 8; y++) buf[y] = (buf[y] >> 1) & 0xff;
      else if (args.DIR === "up") { for (let y = 0; y < 7; y++) buf[y] = buf[y + 1]; buf[7] = 0; }
      else { for (let y = 7; y > 0; y--) buf[y] = buf[y - 1]; buf[0] = 0; }
    }

    matrix_dim(args) {
      board(this.runtime)["scrdim_" + args.PART] = Number(args.LEVEL);
    }

    matrix_clear(args) {
      const buf = this._scr(args.PART);
      for (let y = 0; y < 8; y++) buf[y] = 0;
    }

    matrix_getpx(args) {
      const x = Number(args.X) | 0, y = Number(args.Y) | 0;
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
      const b = board(this.runtime);
      const raw = Object.prototype.hasOwnProperty.call(b, args.PIN)
        ? b[args.PIN]
        : 0;
      const level = pin && pin.activeLow ? !raw : !!raw;
      return args.EDGE === "pressed" ? level : !level;
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
