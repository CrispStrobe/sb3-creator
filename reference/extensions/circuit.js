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
      "circuit.needsSim": "needs the simulator",
      "circuit.noNets": "(no nets available)",
      "circuit.noParts": "(no parts available)",
      "circuit.noLeds": "(no LEDs available)",
      "circuit.noBuzzers": "(no buzzers available)",
      "circuit.noControls": "(no controls available)",
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
      "circuit.needsSim": "braucht den Simulator",
      "circuit.noNets": "(keine Netze vorhanden)",
      "circuit.noParts": "(keine Bauteile vorhanden)",
      "circuit.noLeds": "(keine LEDs vorhanden)",
      "circuit.noBuzzers": "(keine Summer vorhanden)",
      "circuit.noControls": "(keine Bedienelemente vorhanden)",
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
      "circuit.needsSim": "nécessite le simulateur",
      "circuit.noNets": "(aucun réseau disponible)",
      "circuit.noParts": "(aucun composant disponible)",
      "circuit.noLeds": "(aucune LED disponible)",
      "circuit.noBuzzers": "(aucun buzzer disponible)",
      "circuit.noControls": "(aucun contrôle disponible)",
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

  // Use the VM's translation registry, matching STC12 Live. Do not derive the
  // block language from navigator.language: the browser language is not the
  // BrickWright language selected by the user. The embedded translations remain
  // useful defaults for hosts that do not provide a catalog.
  // Every string gets its OWN Scratch.translate call with a literal id and
  // default, because the gallery extracts l10n by evaluating these at build
  // time (development/parse-extension-translations.js) and a call whose
  // argument is a variable cannot be evaluated — it fails the production build
  // outright. stc12live.js already writes them this way.
  //
  // The table keeps t(key) working for the call sites, and is generated from
  // the en block above so the two cannot disagree.
  const TRANSLATED = {
    "circuit.name": () =>
      Scratch.translate({ id: "circuit.name", default: "Circuit" }),
    "circuit.voltage": () =>
      Scratch.translate({ id: "circuit.voltage", default: "voltage at [NET]" }),
    "circuit.current": () =>
      Scratch.translate({
        id: "circuit.current",
        default: "current through [PART]",
      }),
    "circuit.resistance": () =>
      Scratch.translate({
        id: "circuit.resistance",
        default: "resistance between [A] and [B]",
      }),
    "circuit.brightness": () =>
      Scratch.translate({
        id: "circuit.brightness",
        default: "brightness of [PART]",
      }),
    "circuit.tone": () =>
      Scratch.translate({ id: "circuit.tone", default: "tone of [PART]" }),
    "circuit.setcontrol": () =>
      Scratch.translate({
        id: "circuit.setcontrol",
        default: "set [CONTROL] to [VALUE]",
      }),
    "circuit.power": () =>
      Scratch.translate({ id: "circuit.power", default: "turn power [STATE]" }),
    "circuit.on": () => Scratch.translate({ id: "circuit.on", default: "on" }),
    "circuit.off": () =>
      Scratch.translate({ id: "circuit.off", default: "off" }),
    "circuit.needsSim": () =>
      Scratch.translate({
        id: "circuit.needsSim",
        default: "needs the simulator",
      }),
    "circuit.noNets": () =>
      Scratch.translate({
        id: "circuit.noNets",
        default: "(no nets available)",
      }),
    "circuit.noParts": () =>
      Scratch.translate({
        id: "circuit.noParts",
        default: "(no parts available)",
      }),
    "circuit.noLeds": () =>
      Scratch.translate({
        id: "circuit.noLeds",
        default: "(no LEDs available)",
      }),
    "circuit.noBuzzers": () =>
      Scratch.translate({
        id: "circuit.noBuzzers",
        default: "(no buzzers available)",
      }),
    "circuit.noControls": () =>
      Scratch.translate({
        id: "circuit.noControls",
        default: "(no controls available)",
      }),
  };

  function t(key) {
    const translated = TRANSLATED[key];
    if (translated) return translated();
    // A key with no entry still resolves, so adding one to the tables above
    // without regenerating degrades to English rather than to the raw key.
    return translations.en[key] || key;
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
  // DEBUG-CONTROL-MODEL.md).  stc12live writes runtime.stc12liveCapabilities
  // on connect — NO READER EXISTS YET; the palette layer in brickwright-lite
  // needs to consult it and suppress these five reporters when a hardware
  // target is connected.  Do not "fix" NaN back to a string — the string
  // silently becomes 0 in every numeric context, which is the failure mode
  // this project refuses to ship.
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

    // ---- target detection ---------------------------------------------------

    /** Is a hardware target connected? If so, simulation-only blocks are greyed. */
    _isHardwareTarget() {
      return !!(this._runtime && this._runtime.stc12liveCapabilities);
    }

    // ---- getInfo ----------------------------------------------------------

    getInfo() {
      const hw = this._isHardwareTarget();
      // Simulation-only blocks are hidden when a hardware target is connected.
      // They return NaN anyway, but greying them with a reason is honest;
      // leaving them in the palette is the trap PARTS-TO-BLOCKS.md refuses.
      const simOnly = hw ? ` [${t("circuit.needsSim")}]` : "";

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
            hideFromPalette: hw,
            text: t("circuit.voltage") + simOnly,
            arguments: {
              NET: { type: Scratch.ArgumentType.STRING, menu: "nets" },
            },
          },
          {
            opcode: "branchcurrent",
            blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: hw,
            text: t("circuit.current") + simOnly,
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "parts" },
            },
          },
          {
            opcode: "resistance",
            blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: hw,
            text: t("circuit.resistance") + simOnly,
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, menu: "nets" },
              B: { type: Scratch.ArgumentType.STRING, menu: "nets" },
            },
          },
          {
            opcode: "ledbrightness",
            blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: hw,
            text: t("circuit.brightness") + simOnly,
            arguments: {
              PART: { type: Scratch.ArgumentType.STRING, menu: "leds" },
            },
          },
          {
            opcode: "buzzertone",
            blockType: Scratch.BlockType.REPORTER,
            hideFromPalette: hw,
            text: t("circuit.tone") + simOnly,
            arguments: {
              PART: {
                type: Scratch.ArgumentType.STRING,
                menu: "buzzers",
              },
            },
          },
          "---",
          {
            opcode: "setcontrol",
            blockType: Scratch.BlockType.COMMAND,
            hideFromPalette: hw,
            text: t("circuit.setcontrol") + simOnly,
            arguments: {
              CONTROL: {
                type: Scratch.ArgumentType.STRING,
                menu: "controls",
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
          // Resolve element IDs from the active board, like STC12 resolves
          // pin IDs from runtime declarations. Values remain stable IDs.
          nets: { acceptReporters: false, items: "netNames" },
          parts: { acceptReporters: false, items: "partNames" },
          leds: { acceptReporters: false, items: "ledNames" },
          buzzers: { acceptReporters: false, items: "buzzerNames" },
          controls: { acceptReporters: false, items: "controlNames" },
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

    // ---- dynamic menus ---------------------------------------------------

    _items(method, emptyKey, include = () => true) {
      const board = this.board;
      let values = [];
      try {
        if (board && typeof board[method] === "function")
          values = board[method]();
        else if (board && method === "getNets" && Array.isArray(board.nets))
          values = board.nets;
      } catch (e) {
        values = [];
      }
      const ids = values
        .filter(include)
        .map((value) => (typeof value === "string" ? value : value && value.id))
        .filter((value) => typeof value === "string" && value.length > 0);
      return ids.length
        ? ids.map((value) => ({ text: value, value }))
        : [{ text: t(emptyKey), value: "" }];
    }

    netNames() {
      // Breadboard strip nets are implementation details. A seated component
      // creates n-col-t*/n-col-b* nodes even when no jumper or wire connects
      // it to the circuit, so exposing them makes the menu mostly noise.
      return this._items("getNets", "circuit.noNets", (value) => {
        const id = typeof value === "string" ? value : value && value.id;
        return !/^n-col-[bt]d+$/.test(id || "");
      });
    }
    partNames() {
      return this._items("getParts", "circuit.noParts");
    }
    ledNames() {
      return this._items("getLeds", "circuit.noLeds");
    }
    buzzerNames() {
      return this._items("getBuzzers", "circuit.noBuzzers");
    }
    controlNames() {
      return this._items("getControls", "circuit.noControls");
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
