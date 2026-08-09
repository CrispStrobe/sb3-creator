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
    }

    toggle(args) {
      const b = board(this.runtime);
      b[args.PIN] = b[args.PIN] ? 0 : 1;
    }

    writepin(args) {
      board(this.runtime)[args.PIN] = Number(args.VALUE) ? 1 : 0;
    }

    read(args) {
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
