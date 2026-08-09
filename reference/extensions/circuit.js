// Name: Circuit
// ID: circuit
// Description: Board instruments and controls for the circuit simulator.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // INTERNATIONALIZATION
  // ============================================================================

  const translations = {
    en: {
      "circuit.name": "Circuit",
      "circuit.voltage": "voltage at [NET]",
      "circuit.current": "current through [PART]",
      "circuit.resistance": "resistance between [A] and [B]",
      "circuit.brightness": "brightness of [PART]",
      "circuit.tone": "tone of [PART]",
      "circuit.setcontrol": "set [CONTROL] to [VALUE]",
      "circuit.power": "turn power [STATE]",
      "circuit.on": "on",
      "circuit.off": "off",
    },
    de: {
      "circuit.name": "Schaltkreis",
      "circuit.voltage": "Spannung an [NET]",
      "circuit.current": "Strom durch [PART]",
      "circuit.resistance": "Widerstand zwischen [A] und [B]",
      "circuit.brightness": "Helligkeit von [PART]",
      "circuit.tone": "Ton von [PART]",
      "circuit.setcontrol": "setze [CONTROL] auf [VALUE]",
      "circuit.power": "Strom [STATE]",
      "circuit.on": "ein",
      "circuit.off": "aus",
    },
    fr: {
      "circuit.name": "Circuit",
      "circuit.voltage": "tension à [NET]",
      "circuit.current": "courant à travers [PART]",
      "circuit.resistance": "résistance entre [A] et [B]",
      "circuit.brightness": "luminosité de [PART]",
      "circuit.tone": "ton de [PART]",
      "circuit.setcontrol": "mettre [CONTROL] à [VALUE]",
      "circuit.power": "alimentation [STATE]",
      "circuit.on": "marche",
      "circuit.off": "arrêt",
    },
  };

  // ===== LANGUAGE DETECTION =====

  function detectLanguage() {
    const candidates = [];
    try {
      if (typeof window !== "undefined" && window.ReduxStore?.getState) {
        candidates.push(window.ReduxStore.getState().locales?.locale);
      }
    } catch (e) {
      /* ignore */
    }
    try {
      candidates.push(localStorage.getItem("tw:language"));
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof Scratch !== "undefined" && Scratch.vm?.runtime?.getLocale) {
        candidates.push(Scratch.vm.runtime.getLocale());
      }
    } catch (e) {
      /* ignore */
    }
    try {
      candidates.push(document.documentElement.lang);
    } catch (e) {
      /* ignore */
    }
    try {
      candidates.push(navigator.language);
    } catch (e) {
      /* ignore */
    }
    for (const c of candidates) {
      if (typeof c !== "string" || !c) continue;
      const lower = c.toLowerCase();
      if (lower.startsWith("de")) return "de";
      if (lower.startsWith("fr")) return "fr";
      if (lower.startsWith("en")) return "en";
    }
    return "en";
  }

  let currentLang = detectLanguage();

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "tw:language") {
        const newLang = detectLanguage();
        if (newLang !== currentLang) currentLang = newLang;
      }
    });
  }

  function t(key) {
    const tr = translations[currentLang];
    if (tr && tr[key]) return tr[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return key;
  }

  // ============================================================================
  // CIRCUIT EXTENSION
  //
  // Seven blocks from boundary B of simulation-contract.md.  The Board instance
  // is injected via setBoard() — the adapter pattern the LEGO extensions use for
  // their transports.  Without a board, reporters return a reason string and
  // commands are no-ops.
  //
  // THE RULE: refuse visibly, never fabricate a plausible value.
  //
  //   No board attached  → NaN              (all five reporters)
  //   Board, power on    → 'requires-power-off'    (resistance only)
  //
  // A voltmeter that reads 0 V when disconnected is worse than one that reads
  // nothing: 0 V is a perfectly ordinary measurement (a grounded net reads it),
  // so the no-board case would be indistinguishable from a real result.
  //
  // NaN is a STOPGAP: it shows visibly wrong in reporter bubbles and does not
  // cast to 0 in JavaScript arithmetic, but Scratch's Cast.toNumber still maps
  // it to 0 and the "say" block shows "NaN" instead of a reason.  The real fix
  // is greying out unavailable blocks per target (PARTS-TO-BLOCKS.md, §7 of
  // DEBUG-CONTROL-MODEL.md) — stc12live publishes its capabilities on
  // runtime.stc12liveCapabilities for the palette layer to read.  Do not
  // "fix" NaN back to a string — the string silently becomes 0 in every
  // numeric context, which is the failure mode this project refuses to ship.
  //
  // Three constraints (../stc/docs/PARTS-TO-BLOCKS.md):
  //
  // 1. Meter reporters sample at display rate (~60 Hz), not per edge.
  //    branchCurrent on a PWM pin at 7.2K edges/sec would saturate the MNA
  //    solver at 7.0K ops/sec — a real multimeter integrates and shows one
  //    number, and so does this.
  //
  // 2. resistance teaches by refusing: it returns 'requires-power-off' on a
  //    live circuit, and 'needs the simulator' when no board is attached.
  //    Two distinct refusals, because they mean different things.
  //
  // 3. Most reporters are simulation-only.  On real hardware the methods
  //    return a reason string rather than a bogus number.
  // ============================================================================

  class CircuitExtension {
    constructor() {
      /** @type {import('../../reference/simulation-contract').Board | null} */
      this._board = null;

      // Capture the VM runtime so we can read vm.runtime.circuitBoard lazily.
      // The host (bw-circuit-ui circuit-tab.jsx) writes circuitBoard on
      // onBoardReady; we read it per-call so rebuilds are picked up without
      // a second handshake.
      /** @type {object | null} */
      this._runtime =
        typeof Scratch !== "undefined" && Scratch.vm && Scratch.vm.runtime
          ? Scratch.vm.runtime
          : null;

      // Display-rate cache.  Meter reporters read from here; the cache is
      // invalidated at ~60 Hz so the board is never called more than once
      // per frame per quantity.
      this._cache = {};
      this._lastSample = 0;
    }

    // ---- board resolution -------------------------------------------------
    // Two attach points, one lazy and one explicit:
    //
    //   1. vm.runtime.circuitBoard — written by the host (circuit-tab.jsx),
    //      read lazily per reporter call. This is the editor path: the Board
    //      is rebuilt whenever the netlist changes, so a value captured at
    //      construction would go stale.
    //
    //   2. setBoard() / clearBoard() — the explicit override. This is what
    //      tests use (attach a mock Board), and what an embedder uses when
    //      there is no VM.
    //
    // The explicit override wins when set; otherwise we fall back to the
    // runtime property.

    /** The current Board, or null. Lazy read from vm.runtime.circuitBoard. */
    get board() {
      return (
        this._board || (this._runtime && this._runtime.circuitBoard) || null
      );
    }

    /** Explicitly attach a Board (overrides the runtime fallback). */
    setBoard(board) {
      this._board = board;
      this._cache = {};
    }

    /** Detach the explicit Board. Reverts to vm.runtime.circuitBoard if set. */
    clearBoard() {
      this._board = null;
      this._cache = {};
    }

    // ---- getInfo ----------------------------------------------------------

    getInfo() {
      return {
        id: "circuit",
        name: t("circuit.name"),
        color1: "#4A90D9",
        color2: "#357ABD",
        color3: "#2A6496",
        blocks: [
          {
            opcode: "nodevoltage",
            blockType: Scratch.BlockType.REPORTER,
            text: t("circuit.voltage"),
            arguments: {
              NET: { type: Scratch.ArgumentType.STRING, defaultValue: "vcc" },
            },
          },
          {
            opcode: "branchcurrent",
            blockType: Scratch.BlockType.REPORTER,
            text: t("circuit.current"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, defaultValue: "led1" },
            },
          },
          {
            opcode: "resistance",
            blockType: Scratch.BlockType.REPORTER,
            text: t("circuit.resistance"),
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "net1" },
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "net2" },
            },
          },
          {
            opcode: "ledbrightness",
            blockType: Scratch.BlockType.REPORTER,
            text: t("circuit.brightness"),
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, defaultValue: "led1" },
            },
          },
          {
            opcode: "buzzertone",
            blockType: Scratch.BlockType.REPORTER,
            text: t("circuit.tone"),
            arguments: {
              PART: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "buzzer1",
              },
            },
          },
          "---",
          {
            opcode: "setcontrol",
            blockType: Scratch.BlockType.COMMAND,
            text: t("circuit.setcontrol"),
            arguments: {
              CONTROL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "pot1",
              },
              VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "setpower",
            blockType: Scratch.BlockType.COMMAND,
            text: t("circuit.power"),
            arguments: {
              STATE: {
                type: Scratch.ArgumentType.STRING,
                menu: "ON_OFF",
                defaultValue: "on",
              },
            },
          },
        ],
        menus: {
          ON_OFF: {
            acceptReporters: false,
            items: [
              { text: t("circuit.on"), value: "on" },
              { text: t("circuit.off"), value: "off" },
            ],
          },
        },
      };
    }

    // ---- display-rate sampling --------------------------------------------
    //
    // Meter reporters call the board at most once per ~16 ms frame.  Between
    // frames, repeated reads of the same quantity return the cached value.
    // A real multimeter integrates and shows one number; so does this.

    _invalidateIfStale() {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (now - this._lastSample >= 16) {
        this._cache = {};
        this._lastSample = now;
      }
    }

    _cachedCall(key, fn) {
      this._invalidateIfStale();
      if (key in this._cache) return this._cache[key];
      const val = fn();
      this._cache[key] = val;
      return val;
    }

    // ---- reporters --------------------------------------------------------

    nodevoltage({ NET }) {
      if (!this.board) return NaN; // stopgap — greying is the real fix
      return this._cachedCall(`voltage:${NET}`, () =>
        this.board.nodeVoltage(String(NET))
      );
    }

    branchcurrent({ PART }) {
      if (!this.board) return NaN;
      return this._cachedCall(`current:${PART}`, () =>
        this.board.branchCurrent(String(PART), "a")
      );
    }

    resistance({ A, B }) {
      if (!this.board) return NaN;
      return this._cachedCall(`resistance:${A}:${B}`, () =>
        this.board.resistance(String(A), String(B))
      );
    }

    ledbrightness({ PART }) {
      if (!this.board) return NaN;
      return this._cachedCall(`brightness:${PART}`, () =>
        this.board.ledBrightness(String(PART))
      );
    }

    buzzertone({ PART }) {
      if (!this.board) return NaN;
      return this._cachedCall(`tone:${PART}`, () => {
        const r = this.board.buzzerTone(String(PART));
        return r && r.on ? r.hz : 0;
      });
    }

    // ---- commands ---------------------------------------------------------
    // Commands are not cached — they are user intent, not measurements.

    setcontrol({ CONTROL, VALUE }) {
      if (this.board) this.board.setControl(String(CONTROL), Number(VALUE));
    }

    setpower({ STATE }) {
      if (this.board) this.board.setPower(String(STATE) === "on");
    }
  }

  Scratch.extensions.register(new CircuitExtension());
})(Scratch);
