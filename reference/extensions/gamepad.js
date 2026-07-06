// Name: Gamepad
// ID: universalgamepad
// Description: Use game controllers to control your project.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Universal Gamepad extension must run unsandboxed");
  }

  console.log("🎮 [Gamepad] Extension loading...");

  // ===== TRANSLATIONS =====

  const translations = {
    en: {
      extensionName: "Universal Gamepad",
      // Connection blocks
      isConnected: "gamepad connected?",
      getControllerInfo: "controller name",
      getControllerCount: "number of controllers",
      // Button blocks
      whenButtonPressed: "when [BUTTON] pressed",
      isButtonPressed: "[BUTTON] pressed?",
      isAnyButtonPressed: "any button pressed?",
      // Stick blocks
      getStickValue: "[STICK] stick [AXIS]",
      getStickDirection: "[STICK] stick direction",
      getStickMagnitude: "[STICK] stick strength",
      // Cursor blocks
      getCursorX: "cursor x",
      getCursorY: "cursor y",
      setCursorPosition: "set cursor to x: [X] y: [Y]",
      resetCursor: "reset cursor to center",
      setCursorSensitivity: "set cursor sensitivity to [SENSITIVITY]",
      // Vibration blocks
      vibrate: "vibrate for [DURATION] ms at [INTENSITY]%",
      vibratePattern: "vibrate weak:[WEAK]% strong:[STRONG]% for [DURATION]ms",
      stopVibration: "stop vibration",
      // Config blocks
      setDeadzone: "set stick deadzone to [DEADZONE]",
      // Debug blocks
      showDebugInfo: "show gamepad debug info",
      getDebugStats: "debug: [STAT]",
      // Menus
      left: "left",
      right: "right",
      x: "x",
      y: "y",
      polls: "polls",
      buttonPresses: "button presses",
      errors: "errors",
      lastActivity: "last activity",
    },
    de: {
      extensionName: "Universelles Gamepad",
      // Connection blocks
      isConnected: "Gamepad verbunden?",
      getControllerInfo: "Controller-Name",
      getControllerCount: "Anzahl der Controller",
      // Button blocks
      whenButtonPressed: "wenn [BUTTON] gedrückt",
      isButtonPressed: "[BUTTON] gedrückt?",
      isAnyButtonPressed: "irgendeine Taste gedrückt?",
      // Stick blocks
      getStickValue: "[STICK] Stick [AXIS]",
      getStickDirection: "[STICK] Stick Richtung",
      getStickMagnitude: "[STICK] Stick Stärke",
      // Cursor blocks
      getCursorX: "Cursor x",
      getCursorY: "Cursor y",
      setCursorPosition: "setze Cursor auf x: [X] y: [Y]",
      resetCursor: "Cursor zur Mitte zurücksetzen",
      setCursorSensitivity: "setze Cursor-Empfindlichkeit auf [SENSITIVITY]",
      // Vibration blocks
      vibrate: "vibriere für [DURATION] ms bei [INTENSITY]%",
      vibratePattern:
        "vibriere schwach:[WEAK]% stark:[STRONG]% für [DURATION]ms",
      stopVibration: "Vibration stoppen",
      // Config blocks
      setDeadzone: "setze Stick-Deadzone auf [DEADZONE]",
      // Debug blocks
      showDebugInfo: "zeige Gamepad Debug-Info",
      getDebugStats: "Debug: [STAT]",
      // Menus
      left: "links",
      right: "rechts",
      x: "x",
      y: "y",
      polls: "Abfragen",
      buttonPresses: "Tastendrücke",
      errors: "Fehler",
      lastActivity: "letzte Aktivität",
    },
  };

  // ===== LANGUAGE DETECTION =====

  /**
   * Detect language using multiple methods with comprehensive logging
   * @returns {string} Detected language code ('en' or 'de')
   */
  function detectLanguage() {
    const results = {};
    let finalLanguage = "en"; // Default fallback

    console.log("🌍 [Gamepad] === LANGUAGE DETECTION DEBUG ===");

    // Method 1: navigator.language
    try {
      results.navigatorLanguage = navigator.language;
      console.log("🌍 [Gamepad] 1. navigator.language:", navigator.language);
    } catch (e) {
      results.navigatorLanguage = "error: " + e.message;
      console.log("🌍 [Gamepad] 1. navigator.language: ERROR", e.message);
    }

    // Method 2: navigator.languages array
    try {
      results.navigatorLanguages = navigator.languages;
      console.log("🌍 [Gamepad] 2. navigator.languages:", navigator.languages);
    } catch (e) {
      results.navigatorLanguages = "error: " + e.message;
      console.log("🌍 [Gamepad] 2. navigator.languages: ERROR", e.message);
    }

    // Method 3: TurboWarp localStorage settings
    try {
      const twSettings = localStorage.getItem("tw:language");
      results.turboWarpLocalStorage = twSettings;
      console.log(
        "🌍 [Gamepad] 3. TurboWarp localStorage (tw:language):",
        twSettings
      );
    } catch (e) {
      results.turboWarpLocalStorage = "error: " + e.message;
      console.log("🌍 [Gamepad] 3. TurboWarp localStorage: ERROR", e.message);
    }

    // Method 4: Scratch VM locale (if available)
    try {
      if (typeof Scratch !== "undefined" && Scratch.vm && Scratch.vm.runtime) {
        const vmLocale = Scratch.vm.runtime.getLocale
          ? Scratch.vm.runtime.getLocale()
          : null;
        results.scratchVMLocale = vmLocale;
        console.log("🌍 [Gamepad] 4. Scratch VM locale:", vmLocale);
      } else {
        results.scratchVMLocale = null;
        console.log("🌍 [Gamepad] 4. Scratch VM locale: NOT AVAILABLE");
      }
    } catch (e) {
      results.scratchVMLocale = "error: " + e.message;
      console.log("🌍 [Gamepad] 4. Scratch VM locale: ERROR", e.message);
    }

    // Method 5: Check document.documentElement.lang
    try {
      const htmlLang = document.documentElement.lang;
      results.documentLang = htmlLang;
      console.log(
        "🌍 [Gamepad] 5. document.documentElement.lang:",
        htmlLang || "(empty)"
      );
    } catch (e) {
      results.documentLang = "error: " + e.message;
      console.log(
        "🌍 [Gamepad] 5. document.documentElement.lang: ERROR",
        e.message
      );
    }

    // Method 6: Check URL parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") || urlParams.get("locale");
      results.urlParameter = urlLang;
      console.log(
        "🌍 [Gamepad] 6. URL parameter (lang/locale):",
        urlLang || "(none)"
      );
    } catch (e) {
      results.urlParameter = "error: " + e.message;
      console.log("🌍 [Gamepad] 6. URL parameter: ERROR", e.message);
    }

    // Method 7: Check for Scratch translate object
    try {
      if (
        typeof window !== "undefined" &&
        window.scratchTranslate &&
        window.scratchTranslate.locale
      ) {
        results.scratchTranslate = window.scratchTranslate.locale;
        console.log(
          "🌍 [Gamepad] 7. window.scratchTranslate.locale:",
          window.scratchTranslate.locale
        );
      } else {
        results.scratchTranslate = "not available";
        console.log("🌍 [Gamepad] 7. window.scratchTranslate: NOT AVAILABLE");
      }
    } catch (e) {
      results.scratchTranslate = "error: " + e.message;
      console.log("🌍 [Gamepad] 7. window.scratchTranslate: ERROR", e.message);
    }

    // Method 8: Check Redux store (TurboWarp uses Redux)
    try {
      if (
        typeof window !== "undefined" &&
        window.ReduxStore &&
        window.ReduxStore.getState
      ) {
        const state = window.ReduxStore.getState();
        const reduxLocale = state.locales?.locale;
        results.reduxStore = reduxLocale;
        console.log("🌍 [Gamepad] 8. Redux store locale:", reduxLocale);
      } else {
        results.reduxStore = "not available";
        console.log("🌍 [Gamepad] 8. Redux store: NOT AVAILABLE");
      }
    } catch (e) {
      results.reduxStore = "error: " + e.message;
      console.log("🌍 [Gamepad] 8. Redux store: ERROR", e.message);
    }

    // Method 9: Check global window._locale (some Scratch forks use this)
    try {
      if (typeof window !== "undefined" && window._locale) {
        results.windowLocale = window._locale;
        console.log("🌍 [Gamepad] 9. window._locale:", window._locale);
      } else {
        results.windowLocale = "not available";
        console.log("🌍 [Gamepad] 9. window._locale: NOT AVAILABLE");
      }
    } catch (e) {
      results.windowLocale = "error: " + e.message;
      console.log("🌍 [Gamepad] 9. window._locale: ERROR", e.message);
    }

    // Method 10: Check meta tags
    try {
      const metaLang = document.querySelector(
        'meta[http-equiv="content-language"]'
      );
      const metaContent = metaLang ? metaLang.getAttribute("content") : null;
      results.metaTag = metaContent;
      console.log(
        "🌍 [Gamepad] 10. Meta tag content-language:",
        metaContent || "(none)"
      );
    } catch (e) {
      results.metaTag = "error: " + e.message;
      console.log("🌍 [Gamepad] 10. Meta tag: ERROR", e.message);
    }

    console.log("\n🌍 [Gamepad] === ALL DETECTION RESULTS ===");
    console.log(JSON.stringify(results, null, 2));

    // Decision logic - Priority order
    console.log("\n🌍 [Gamepad] === DECISION LOGIC ===");

    // Priority 1: Redux store (most reliable for TurboWarp)
    if (
      results.reduxStore &&
      typeof results.reduxStore === "string" &&
      !results.reduxStore.includes("error") &&
      results.reduxStore !== "not available"
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using Redux store locale:",
        results.reduxStore
      );
      finalLanguage = results.reduxStore.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 2: TurboWarp localStorage
    else if (
      results.turboWarpLocalStorage &&
      typeof results.turboWarpLocalStorage === "string" &&
      !results.turboWarpLocalStorage.includes("error") &&
      results.turboWarpLocalStorage !== "not available"
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using TurboWarp localStorage:",
        results.turboWarpLocalStorage
      );
      finalLanguage = results.turboWarpLocalStorage
        .toLowerCase()
        .startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 3: Scratch VM locale
    else if (
      results.scratchVMLocale &&
      typeof results.scratchVMLocale === "string" &&
      !results.scratchVMLocale.includes("error")
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using Scratch VM locale:",
        results.scratchVMLocale
      );
      finalLanguage = results.scratchVMLocale.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 4: document.documentElement.lang
    else if (
      results.documentLang &&
      typeof results.documentLang === "string" &&
      results.documentLang !== "" &&
      !results.documentLang.includes("error")
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using document.documentElement.lang:",
        results.documentLang
      );
      finalLanguage = results.documentLang.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 5: URL parameter
    else if (
      results.urlParameter &&
      typeof results.urlParameter === "string" &&
      !results.urlParameter.includes("error")
    ) {
      console.log("🌍 [Gamepad] ✓ Using URL parameter:", results.urlParameter);
      finalLanguage = results.urlParameter.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 6: navigator.language
    else if (
      results.navigatorLanguage &&
      typeof results.navigatorLanguage === "string" &&
      !results.navigatorLanguage.includes("error")
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using navigator.language:",
        results.navigatorLanguage
      );
      finalLanguage = results.navigatorLanguage.toLowerCase().startsWith("de")
        ? "de"
        : "en";
    }
    // Priority 7: First entry in navigator.languages
    else if (
      results.navigatorLanguages &&
      Array.isArray(results.navigatorLanguages) &&
      results.navigatorLanguages.length > 0
    ) {
      console.log(
        "🌍 [Gamepad] ✓ Using navigator.languages[0]:",
        results.navigatorLanguages[0]
      );
      finalLanguage = results.navigatorLanguages[0]
        .toLowerCase()
        .startsWith("de")
        ? "de"
        : "en";
    }
    // Fallback: Default to English
    else {
      console.log("🌍 [Gamepad] ✗ No locale detected, using default: en");
      finalLanguage = "en";
    }

    console.log("\n🌍 [Gamepad] === FINAL DECISION ===");
    console.log("🌍 [Gamepad] Selected language:", finalLanguage);
    console.log("🌍 [Gamepad] ================================\n");

    // Store results for debugging
    if (typeof window !== "undefined") {
      window._gamepadLanguageDetection = {
        timestamp: new Date().toISOString(),
        results: results,
        finalLanguage: finalLanguage,
      };
      console.log(
        "🌍 [Gamepad] Debug info stored in: window._gamepadLanguageDetection"
      );
    }

    return finalLanguage;
  }

  // Detect language
  let currentLang = detectLanguage();

  // Translation helper function
  function t(key) {
    const translated =
      translations[currentLang]?.[key] || translations["en"][key] || key;
    return translated;
  }

  // Watch for language changes
  if (typeof window !== "undefined") {
    // Listen for localStorage changes (for TurboWarp language switches)
    window.addEventListener("storage", (e) => {
      if (e.key === "tw:language") {
        console.log("🌍 [Gamepad] TurboWarp language changed, re-detecting...");
        const newLang = detectLanguage();
        if (newLang !== currentLang) {
          currentLang = newLang;
          console.log("🌍 [Gamepad] Language updated to:", currentLang);
          console.warn(
            "🌍 [Gamepad] Extension translations will apply after reload"
          );
        }
      }
    });

    // Watch for Redux state changes
    let lastKnownLocale = null;
    setInterval(() => {
      try {
        if (window.ReduxStore && window.ReduxStore.getState) {
          const state = window.ReduxStore.getState();
          const currentLocale = state.locales?.locale;

          if (currentLocale && currentLocale !== lastKnownLocale) {
            lastKnownLocale = currentLocale;
            console.log("🌍 [Gamepad] Redux locale changed to:", currentLocale);

            const newLang = currentLocale.toLowerCase().startsWith("de")
              ? "de"
              : "en";
            if (newLang !== currentLang) {
              currentLang = newLang;
              console.log(
                "🌍 [Gamepad] Extension language updated to:",
                currentLang
              );
              console.warn(
                "🌍 [Gamepad] Extension translations will apply after reload"
              );
            }
          }
        }
      } catch (e) {
        // Silently fail
      }
    }, 1000);
  }

  // ===== GAMEPAD ICON (SVG, base64 encoded) =====

  // Simple gamepad icon that definitely works
  const gamepadIcon =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzUgMTVoLTZsLTMtNWgtMTJsLTMgNUg1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDZjMS4xIDAgMi0uOSAyLTJWMjBoMTJ2OWMwIDEuMS45IDIgMiAyaDZjMS4xIDAgMi0uOSAyLTJWMTdjMC0xLjEtLjktMi0yLTJ6bS0yNSA5SDd2LTNoM3Yzem0wLTVIN3YtM2gzdjN6bTUtMmgtM3YzaC0zdi0zSDd2LTNoM3YtM2gzdjNoM3Yzem0xMy01YTIgMiAwIDEgMSAwIDQgMiAyIDAgMCAxIDAtNHptNCAzYTIgMiAwIDEgMSAwIDQgMiAyIDAgMCAxIDAtNHoiLz48L3N2Zz4=";

  // Universal button mappings
  const GAMEPAD_BUTTONS = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    SELECT: 8,
    START: 9,
    LS: 10,
    RS: 11,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15,
    HOME: 16,
  };

  // ===== MAIN EXTENSION CLASS =====

  class UniversalGamepad {
    constructor() {
      console.log("🎮 [Gamepad] Constructor called");

      this.activeController = null;
      this.previousButtons = [];
      this.allGamepads = {};
      this.lastPollTime = 0;
      this.pollInterval = 16; // ~60fps

      this.virtualCursor = {
        x: 0,
        y: 0,
        maxX: 240,
        minX: -240,
        maxY: 180,
        minY: -180,
        sensitivity: 2,
      };

      this.config = {
        deadzone: 0.15,
        debug: true,
        vibrationEnabled: true,
      };

      this.stats = {
        pollCount: 0,
        buttonPresses: 0,
        lastActivity: null,
        errors: 0,
      };

      this._setupEventListeners();
      this._startPolling();

      console.log("🎮 [Gamepad] Extension initialized successfully");
      console.log("🎮 [Gamepad] Language:", currentLang);
      console.log("🎮 [Gamepad] Extension name:", t("extensionName"));
    }

    getInfo() {
      console.log("🎮 [Gamepad] getInfo() called, language:", currentLang);

      return {
        id: "universalgamepad",
        name: t("extensionName"),
        color1: "#4C97FF",
        color2: "#3373CC",
        color3: "#2D5AA6",
        menuIconURI: gamepadIcon,
        blockIconURI: gamepadIcon,
        blocks: [
          {
            opcode: "isConnected",
            text: t("isConnected"),
            blockType: Scratch.BlockType.BOOLEAN,
          },
          {
            opcode: "getControllerInfo",
            text: t("getControllerInfo"),
            blockType: Scratch.BlockType.REPORTER,
          },
          {
            opcode: "getControllerCount",
            text: t("getControllerCount"),
            blockType: Scratch.BlockType.REPORTER,
          },
          "---",
          {
            opcode: "whenButtonPressed",
            text: t("whenButtonPressed"),
            blockType: Scratch.BlockType.HAT,
            arguments: {
              BUTTON: {
                type: Scratch.ArgumentType.STRING,
                menu: "BUTTONS",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "isButtonPressed",
            text: t("isButtonPressed"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              BUTTON: {
                type: Scratch.ArgumentType.STRING,
                menu: "BUTTONS",
                defaultValue: "A",
              },
            },
          },
          {
            opcode: "isAnyButtonPressed",
            text: t("isAnyButtonPressed"),
            blockType: Scratch.BlockType.BOOLEAN,
          },
          "---",
          {
            opcode: "getStickValue",
            text: t("getStickValue"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STICK: {
                type: Scratch.ArgumentType.STRING,
                menu: "STICKS",
                defaultValue: "left",
              },
              AXIS: {
                type: Scratch.ArgumentType.STRING,
                menu: "AXES",
                defaultValue: "x",
              },
            },
          },
          {
            opcode: "getStickDirection",
            text: t("getStickDirection"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STICK: {
                type: Scratch.ArgumentType.STRING,
                menu: "STICKS",
                defaultValue: "left",
              },
            },
          },
          {
            opcode: "getStickMagnitude",
            text: t("getStickMagnitude"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STICK: {
                type: Scratch.ArgumentType.STRING,
                menu: "STICKS",
                defaultValue: "left",
              },
            },
          },
          "---",
          {
            opcode: "getCursorX",
            text: t("getCursorX"),
            blockType: Scratch.BlockType.REPORTER,
          },
          {
            opcode: "getCursorY",
            text: t("getCursorY"),
            blockType: Scratch.BlockType.REPORTER,
          },
          {
            opcode: "setCursorPosition",
            text: t("setCursorPosition"),
            blockType: Scratch.BlockType.COMMAND,
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0,
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0,
              },
            },
          },
          {
            opcode: "resetCursor",
            text: t("resetCursor"),
            blockType: Scratch.BlockType.COMMAND,
          },
          {
            opcode: "setCursorSensitivity",
            text: t("setCursorSensitivity"),
            blockType: Scratch.BlockType.COMMAND,
            arguments: {
              SENSITIVITY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2,
              },
            },
          },
          "---",
          {
            opcode: "vibrate",
            text: t("vibrate"),
            blockType: Scratch.BlockType.COMMAND,
            arguments: {
              DURATION: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 200,
              },
              INTENSITY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 50,
              },
            },
          },
          {
            opcode: "vibratePattern",
            text: t("vibratePattern"),
            blockType: Scratch.BlockType.COMMAND,
            arguments: {
              WEAK: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30,
              },
              STRONG: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 70,
              },
              DURATION: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 200,
              },
            },
          },
          {
            opcode: "stopVibration",
            text: t("stopVibration"),
            blockType: Scratch.BlockType.COMMAND,
          },
          "---",
          {
            opcode: "setDeadzone",
            text: t("setDeadzone"),
            blockType: Scratch.BlockType.COMMAND,
            arguments: {
              DEADZONE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0.15,
              },
            },
          },
          "---",
          {
            opcode: "showDebugInfo",
            text: t("showDebugInfo"),
            blockType: Scratch.BlockType.COMMAND,
          },
          {
            opcode: "getDebugStats",
            text: t("getDebugStats"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STAT: {
                type: Scratch.ArgumentType.STRING,
                menu: "STATS",
                defaultValue: "polls",
              },
            },
          },
        ],
        menus: {
          BUTTONS: {
            acceptReporters: true,
            items: [
              "A",
              "B",
              "X",
              "Y",
              "LB",
              "RB",
              "LT",
              "RT",
              "SELECT",
              "START",
              "LS",
              "RS",
              "UP",
              "DOWN",
              "LEFT",
              "RIGHT",
              "HOME",
            ],
          },
          STICKS: {
            acceptReporters: true,
            items: [
              { text: t("left"), value: "left" },
              { text: t("right"), value: "right" },
            ],
          },
          AXES: {
            acceptReporters: true,
            items: [
              { text: t("x"), value: "x" },
              { text: t("y"), value: "y" },
            ],
          },
          STATS: {
            acceptReporters: true,
            items: [
              { text: t("polls"), value: "polls" },
              { text: t("buttonPresses"), value: "button presses" },
              { text: t("errors"), value: "errors" },
              { text: t("lastActivity"), value: "last activity" },
            ],
          },
        },
      };
    }

    _setupEventListeners() {
      console.log("🎮 [Gamepad] Setting up event listeners");

      try {
        window.addEventListener("gamepadconnected", (e) => {
          console.log("🎮 [Gamepad] ✅ Controller connected:", e.gamepad.id);
          console.log("🎮 [Gamepad]    Index:", e.gamepad.index);
          console.log("🎮 [Gamepad]    Buttons:", e.gamepad.buttons.length);
          console.log("🎮 [Gamepad]    Axes:", e.gamepad.axes.length);
          console.log("🎮 [Gamepad]    Mapping:", e.gamepad.mapping);

          this.allGamepads[e.gamepad.index] = e.gamepad;

          if (!this.activeController) {
            this.activeController = e.gamepad;
            console.log("🎮 [Gamepad] Set as active controller");
          }
        });

        window.addEventListener("gamepaddisconnected", (e) => {
          console.log("🎮 [Gamepad] ❌ Controller disconnected:", e.gamepad.id);

          delete this.allGamepads[e.gamepad.index];

          if (
            this.activeController &&
            this.activeController.index === e.gamepad.index
          ) {
            this.activeController = null;
            const remaining = Object.values(this.allGamepads);
            if (remaining.length > 0) {
              this.activeController = remaining[0];
              console.log(
                "🎮 [Gamepad] Switched to controller:",
                this.activeController.id
              );
            }
          }
        });
      } catch (error) {
        console.error(
          "🎮 [Gamepad] ❌ Error setting up event listeners:",
          error
        );
        this.stats.errors++;
      }
    }

    _startPolling() {
      this._pollGamepads();
    }

    _pollGamepads() {
      try {
        const now = performance.now();

        if (now - this.lastPollTime < this.pollInterval) {
          requestAnimationFrame(() => this._pollGamepads());
          return;
        }

        this.lastPollTime = now;
        this.stats.pollCount++;

        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

        if (this.activeController) {
          const freshGamepad = gamepads[this.activeController.index];
          if (freshGamepad) {
            this.activeController = freshGamepad;
            this._updateVirtualCursor(freshGamepad);
          } else {
            this.activeController = null;
          }
        } else {
          for (const gamepad of gamepads) {
            if (gamepad) {
              this.activeController = gamepad;
              console.log(
                "🎮 [Gamepad] 🔄 Auto-detected controller:",
                gamepad.id
              );
              break;
            }
          }
        }

        if (this.activeController) {
          for (let i = 0; i < this.activeController.buttons.length; i++) {
            if (this.activeController.buttons[i].pressed) {
              if (!this.previousButtons[i]) {
                this.stats.buttonPresses++;
                this.stats.lastActivity = new Date().toISOString();
              }
            }
          }
        }
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ Polling error:", error);
        this.stats.errors++;
      }

      requestAnimationFrame(() => this._pollGamepads());
    }

    _updateVirtualCursor(gamepad) {
      if (!gamepad || gamepad.axes.length < 4) return;

      try {
        const rightX = this._normalizeAxis(gamepad.axes[2]);
        const rightY = this._normalizeAxis(gamepad.axes[3]);

        if (Math.abs(rightX) > 0.01 || Math.abs(rightY) > 0.01) {
          this.virtualCursor.x += rightX * this.virtualCursor.sensitivity;
          this.virtualCursor.y -= rightY * this.virtualCursor.sensitivity;

          this.virtualCursor.x = Math.max(
            this.virtualCursor.minX,
            Math.min(this.virtualCursor.maxX, this.virtualCursor.x)
          );
          this.virtualCursor.y = Math.max(
            this.virtualCursor.minY,
            Math.min(this.virtualCursor.maxY, this.virtualCursor.y)
          );
        }
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ Cursor update error:", error);
        this.stats.errors++;
      }
    }

    _normalizeAxis(value) {
      if (typeof value !== "number" || isNaN(value)) return 0;

      const deadzone = this.config.deadzone;
      if (Math.abs(value) < deadzone) return 0;

      const sign = value < 0 ? -1 : 1;
      const normalized = (Math.abs(value) - deadzone) / (1 - deadzone);

      return sign * Math.min(1, normalized);
    }

    _getButtonIndex(buttonName) {
      const index = GAMEPAD_BUTTONS[buttonName];
      if (index === undefined) {
        console.warn("🎮 [Gamepad] ⚠️ Unknown button:", buttonName);
        return null;
      }
      return index;
    }

    _isButtonPressed(buttonIndex) {
      if (!this.activeController || buttonIndex === null) return false;

      try {
        const button = this.activeController.buttons[buttonIndex];
        return button ? button.pressed : false;
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ Button check error:", error);
        this.stats.errors++;
        return false;
      }
    }

    _getStickAxes(stick) {
      const stickMap = {
        left: { x: 0, y: 1 },
        right: { x: 2, y: 3 },
      };

      const stickLower = String(stick).toLowerCase();
      const axes = stickMap[stickLower];

      if (!axes) {
        console.warn("🎮 [Gamepad] ⚠️ Unknown stick:", stick);
        return null;
      }

      return axes;
    }

    // Block implementations
    isConnected() {
      return !!this.activeController;
    }

    getControllerInfo() {
      if (!this.activeController) return "No controller";
      return this.activeController.id || "Unknown controller";
    }

    getControllerCount() {
      try {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        return Array.from(gamepads).filter((g) => g !== null).length;
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ Error counting controllers:", error);
        this.stats.errors++;
        return 0;
      }
    }

    whenButtonPressed(args) {
      if (!this.activeController) return false;

      const buttonIndex = this._getButtonIndex(args.BUTTON);
      if (buttonIndex === null) return false;

      try {
        const wasPressed = this.previousButtons[buttonIndex] || false;
        const isPressed = this._isButtonPressed(buttonIndex);
        this.previousButtons[buttonIndex] = isPressed;

        const triggered = !wasPressed && isPressed;
        if (triggered) {
          console.log(`🎮 [Gamepad] 🔘 Button ${args.BUTTON} pressed (HAT)`);
        }

        return triggered;
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ whenButtonPressed error:", error);
        this.stats.errors++;
        return false;
      }
    }

    isButtonPressed(args) {
      if (!this.activeController) return false;

      const buttonIndex = this._getButtonIndex(args.BUTTON);
      if (buttonIndex === null) return false;

      try {
        const isPressed = this._isButtonPressed(buttonIndex);
        this.previousButtons[buttonIndex] = isPressed;
        return isPressed;
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ isButtonPressed error:", error);
        this.stats.errors++;
        return false;
      }
    }

    isAnyButtonPressed() {
      if (!this.activeController) return false;

      try {
        for (let i = 0; i < this.activeController.buttons.length; i++) {
          if (this.activeController.buttons[i].pressed) return true;
        }
        return false;
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ isAnyButtonPressed error:", error);
        this.stats.errors++;
        return false;
      }
    }

    getStickValue(args) {
      if (!this.activeController) return 0;

      const stickAxes = this._getStickAxes(args.STICK);
      if (!stickAxes) return 0;

      const axis = String(args.AXIS).toLowerCase();
      const axisIndex = stickAxes[axis];

      if (axisIndex === undefined) return 0;

      try {
        const rawValue = this.activeController.axes[axisIndex];
        if (rawValue === undefined) return 0;

        const normalizedValue = this._normalizeAxis(rawValue);
        return Math.round(normalizedValue * 100);
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ getStickValue error:", error);
        this.stats.errors++;
        return 0;
      }
    }

    getStickDirection(args) {
      if (!this.activeController) return 0;

      const stickAxes = this._getStickAxes(args.STICK);
      if (!stickAxes) return 0;

      try {
        const xRaw = this.activeController.axes[stickAxes.x];
        const yRaw = this.activeController.axes[stickAxes.y];

        if (xRaw === undefined || yRaw === undefined) return 0;

        const x = this._normalizeAxis(xRaw);
        const y = this._normalizeAxis(yRaw);

        if (x === 0 && y === 0) return 0;

        const radians = Math.atan2(-y, x);
        const degrees = ((radians * 180) / Math.PI + 360) % 360;

        return Math.round(degrees);
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ getStickDirection error:", error);
        this.stats.errors++;
        return 0;
      }
    }

    getStickMagnitude(args) {
      if (!this.activeController) return 0;

      const stickAxes = this._getStickAxes(args.STICK);
      if (!stickAxes) return 0;

      try {
        const xRaw = this.activeController.axes[stickAxes.x];
        const yRaw = this.activeController.axes[stickAxes.y];

        if (xRaw === undefined || yRaw === undefined) return 0;

        const x = this._normalizeAxis(xRaw);
        const y = this._normalizeAxis(yRaw);

        const magnitude = Math.sqrt(x * x + y * y);
        return Math.min(100, Math.round(magnitude * 100));
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ getStickMagnitude error:", error);
        this.stats.errors++;
        return 0;
      }
    }

    getCursorX() {
      return Math.round(this.virtualCursor.x);
    }

    getCursorY() {
      return Math.round(this.virtualCursor.y);
    }

    setCursorPosition(args) {
      try {
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);

        this.virtualCursor.x = Math.max(
          this.virtualCursor.minX,
          Math.min(this.virtualCursor.maxX, x)
        );
        this.virtualCursor.y = Math.max(
          this.virtualCursor.minY,
          Math.min(this.virtualCursor.maxY, y)
        );

        console.log(
          `🎮 [Gamepad] 🖱️ Cursor set to (${this.virtualCursor.x.toFixed(1)}, ${this.virtualCursor.y.toFixed(1)})`
        );
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ setCursorPosition error:", error);
        this.stats.errors++;
      }
    }

    resetCursor() {
      this.virtualCursor.x = 0;
      this.virtualCursor.y = 0;
      console.log("🎮 [Gamepad] 🖱️ Cursor reset");
    }

    setCursorSensitivity(args) {
      try {
        const sensitivity = Scratch.Cast.toNumber(args.SENSITIVITY);
        if (sensitivity <= 0) {
          console.warn("🎮 [Gamepad] ⚠️ Invalid sensitivity");
          return;
        }

        this.virtualCursor.sensitivity = sensitivity;
        console.log(`🎮 [Gamepad] 🖱️ Sensitivity: ${sensitivity}`);
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ setCursorSensitivity error:", error);
        this.stats.errors++;
      }
    }

    vibrate(args) {
      if (!this.activeController || !this.config.vibrationEnabled) return;

      try {
        const duration = Math.max(0, Scratch.Cast.toNumber(args.DURATION));
        const intensity =
          Math.max(0, Math.min(100, Scratch.Cast.toNumber(args.INTENSITY))) /
          100;

        if (!this.activeController.vibrationActuator) {
          console.log("🎮 [Gamepad] ⚠️ Vibration not supported");
          return;
        }

        this.activeController.vibrationActuator
          .playEffect("dual-rumble", {
            duration: duration,
            weakMagnitude: intensity,
            strongMagnitude: intensity,
          })
          .then(() => {
            console.log(
              `🎮 [Gamepad] 📳 Vibration: ${duration}ms at ${Math.round(intensity * 100)}%`
            );
          })
          .catch((error) => {
            console.error("🎮 [Gamepad] ❌ Vibration failed:", error);
            this.stats.errors++;
          });
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ vibrate error:", error);
        this.stats.errors++;
      }
    }

    vibratePattern(args) {
      if (!this.activeController || !this.config.vibrationEnabled) return;

      try {
        const weak =
          Math.max(0, Math.min(100, Scratch.Cast.toNumber(args.WEAK))) / 100;
        const strong =
          Math.max(0, Math.min(100, Scratch.Cast.toNumber(args.STRONG))) / 100;
        const duration = Math.max(0, Scratch.Cast.toNumber(args.DURATION));

        if (!this.activeController.vibrationActuator) {
          console.log("🎮 [Gamepad] ⚠️ Vibration not supported");
          return;
        }

        this.activeController.vibrationActuator
          .playEffect("dual-rumble", {
            duration: duration,
            weakMagnitude: weak,
            strongMagnitude: strong,
          })
          .then(() => {
            console.log(
              `🎮 [Gamepad] 📳 Pattern: weak=${Math.round(weak * 100)}% strong=${Math.round(strong * 100)}% ${duration}ms`
            );
          })
          .catch((error) => {
            console.error("🎮 [Gamepad] ❌ Pattern vibration failed:", error);
            this.stats.errors++;
          });
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ vibratePattern error:", error);
        this.stats.errors++;
      }
    }

    stopVibration() {
      if (!this.activeController) return;

      try {
        if (this.activeController.vibrationActuator) {
          this.activeController.vibrationActuator.reset();
          console.log("🎮 [Gamepad] 📳 Vibration stopped");
        }
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ stopVibration error:", error);
        this.stats.errors++;
      }
    }

    setDeadzone(args) {
      try {
        const deadzone = Scratch.Cast.toNumber(args.DEADZONE);

        if (deadzone < 0 || deadzone > 1) {
          console.warn("🎮 [Gamepad] ⚠️ Deadzone must be 0-1");
          return;
        }

        this.config.deadzone = deadzone;
        console.log(`🎮 [Gamepad] ⚙️ Deadzone: ${deadzone}`);
      } catch (error) {
        console.error("🎮 [Gamepad] ❌ setDeadzone error:", error);
        this.stats.errors++;
      }
    }

    getDebugStats(args) {
      const stat = String(args.STAT).toLowerCase();

      switch (stat) {
        case "polls":
          return this.stats.pollCount;
        case "button presses":
          return this.stats.buttonPresses;
        case "errors":
          return this.stats.errors;
        case "last activity":
          return this.stats.lastActivity || "never";
        default:
          return "unknown stat";
      }
    }

    showDebugInfo() {
      console.log("");
      console.log(
        "═══════════════════════════════════════════════════════════"
      );
      console.log("🎮 UNIVERSAL GAMEPAD - DEBUG INFORMATION");
      console.log(
        "═══════════════════════════════════════════════════════════"
      );
      console.log("");

      // Language info
      console.log("🌍 LANGUAGE:");
      console.log(`   Current: ${currentLang}`);
      console.log(`   Extension name: ${t("extensionName")}`);
      if (window._gamepadLanguageDetection) {
        console.log(
          `   Detection results available in: window._gamepadLanguageDetection`
        );
      }

      console.log("");
      console.log("🔍 CONNECTION:");
      console.log(`   Connected: ${this.isConnected() ? "✅" : "❌"}`);
      console.log(`   Controllers: ${this.getControllerCount()}`);

      if (this.activeController) {
        console.log("");
        console.log("📱 ACTIVE CONTROLLER:");
        console.log(`   Name: ${this.activeController.id}`);
        console.log(`   Index: ${this.activeController.index}`);
        console.log(`   Buttons: ${this.activeController.buttons.length}`);
        console.log(`   Axes: ${this.activeController.axes.length}`);
        console.log(`   Mapping: ${this.activeController.mapping}`);
        console.log(
          `   Vibration: ${this.activeController.vibrationActuator ? "✅" : "❌"}`
        );

        console.log("");
        console.log("🎮 BUTTONS:");
        let anyPressed = false;
        Object.entries(GAMEPAD_BUTTONS).forEach(([name, index]) => {
          if (this.activeController.buttons[index]) {
            const button = this.activeController.buttons[index];
            if (button.pressed || button.value > 0) {
              console.log(
                `   ${name.padEnd(8)} [${index}]: PRESSED (${button.value.toFixed(2)})`
              );
              anyPressed = true;
            }
          }
        });
        if (!anyPressed) console.log("   (none pressed)");

        console.log("");
        console.log("🕹️  STICKS:");
        const sticks = [
          { name: "Left X ", index: 0 },
          { name: "Left Y ", index: 1 },
          { name: "Right X", index: 2 },
          { name: "Right Y", index: 3 },
        ];

        sticks.forEach((stick) => {
          if (this.activeController.axes[stick.index] !== undefined) {
            const raw = this.activeController.axes[stick.index];
            const normalized = this._normalizeAxis(raw);
            const scaled = Math.round(normalized * 100);

            if (Math.abs(normalized) > 0.01) {
              console.log(
                `   ${stick.name}: ${scaled.toString().padStart(4)} (raw: ${raw.toFixed(3)})`
              );
            } else {
              console.log(`   ${stick.name}:    0 (deadzone)`);
            }
          }
        });

        console.log("");
        console.log("🖱️  CURSOR:");
        console.log(
          `   Position: (${this.virtualCursor.x.toFixed(1)}, ${this.virtualCursor.y.toFixed(1)})`
        );
        console.log(`   Sensitivity: ${this.virtualCursor.sensitivity}`);
      }

      console.log("");
      console.log("⚙️  CONFIG:");
      console.log(`   Deadzone: ${this.config.deadzone}`);
      console.log(`   Debug: ${this.config.debug}`);
      console.log(`   Vibration: ${this.config.vibrationEnabled}`);

      console.log("");
      console.log("📊 STATS:");
      console.log(`   Polls: ${this.stats.pollCount.toLocaleString()}`);
      console.log(`   Button presses: ${this.stats.buttonPresses}`);
      console.log(`   Errors: ${this.stats.errors}`);
      console.log(`   Last activity: ${this.stats.lastActivity || "never"}`);

      console.log("");
      console.log(
        "═══════════════════════════════════════════════════════════"
      );
      console.log("");
    }
  }

  Scratch.extensions.register(new UniversalGamepad());
  console.log("🎮 [Gamepad] Extension registered successfully");
  console.log(
    "🎮 [Gamepad] To view language detection: window._gamepadLanguageDetection"
  );
})(Scratch);
