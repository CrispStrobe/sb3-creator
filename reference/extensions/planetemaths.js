// Name: Planète Maths
// ID: planetemaths
// Description: Additional advanced math operations.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // Debug logging utility
  const DEBUG = true;
  const log = (...args) => {
    if (DEBUG) console.log("[PlaneteMaths]", ...args);
  };
  const error = (...args) => {
    console.error("[PlaneteMaths ERROR]", ...args);
  };

  // Translation data
  const translations = {
    en: {
      "pm.title": "Maths",
      "pm.add": "[NUM1] + [NUM2]",
      "pm.substract": "[NUM1] - [NUM2]",
      "pm.multiply": "[NUM1] x [NUM2]",
      "pm.divide": "[NUM1] / [NUM2]",
      "pm.pow": "[NUM1] ^ [NUM2]",
      "pm.mathop": "[OPERATOR] of [NUM1]",
      "pm.angleconvert": "convert [NUM1] from [FROM] to [TO]",
      "pm.mathopdiv": "[OPERATOR] of [NUM1] divided by [NUM2]",
      "pm.mathop2": "[OPERATOR] of [NUM1] and [NUM2]",
      "pm.multiple": "[NUM1] is a [choix1] of [NUM2]",
      "pm.arrondis": "[TYPE] [NUM1] to [CHIFFRE]",
      "pm.pentiere": "[choix1] digit of [NUM1]",
      "pm.pdecimale": "[choix1] digit of [NUM1]",
      "pm.sommechiffres": "sum of digits of [NUM1]",
      "pm.factorial": "factorial of [NUM1]",
      "pm.pi": "π",
      "pm.e": "e",
      "pm.oppose": "- [NUM1]",
      "pm.inverse": "1 / [NUM1]",
      "pm.pourcent": "[NUM1] %",
      "pm.random": "pick random [NUM1] to [NUM2]",
      "pm.gt": "[NUM1] < [NUM2]",
      "pm.gte": "[NUM1] ≤ [NUM2]",
      "pm.equals": "[NUM1] = [NUM2]",
      "pm.lt": "[NUM1] > [NUM2]",
      "pm.lte": "[NUM1] ≥ [NUM2]",
      "pm.min": "minimum of [NUM1] and [NUM2]",
      "pm.max": "maximum of [NUM1] and [NUM2]",
      "pm.and": "[OPERAND1] and [OPERAND2]",
      "pm.or": "[OPERAND1] or [OPERAND2]",
      "pm.not": "not [OPERAND1]",
      "pm.join": "join [STRING1] [STRING2]",
      "pm.letterof": "letter [LETTER] of [STRING]",
      "pm.length": "length of [STRING]",
      "pm.contains": "[STRING1] contains [STRING2] ?",
      "pm.extract": "extract characters from [NUM1] to [NUM2] of [STRING]",
      "text.c1": "units",
      "text.c2": "tens",
      "text.c3": "hundreds",
      "text.c4": "thousands",
      "text.c5": "tens of thousands",
      "text.c6": "hundreds of thousands",
      "text.c7": "millions",
      "text.c8": "tens of millions",
      "text.c9": "hundreds of millions",
      "text.c10": "billions",
      "text.c11": "tens of billions",
      "text.c12": "hundreds of billions",
      "text.d1": "tenths",
      "text.d2": "hundredths",
      "text.d3": "thousandths",
      "text.d4": "ten thousandths",
      "text.d5": "hundred thousandths",
      "text.d6": "millionths",
      "text.a0": "the unit",
      "text.a1": "tenth",
      "text.a2": "hundredth",
      "text.a3": "thousandth",
      "text.a4": "ten thousandth",
      "text.a5": "hundred thousandth",
      "text.a6": "millionth",
      "text.sqrt": "√",
      "text.abs": "abs",
      "text.sign": "sign",
      "text.floor": "floor",
      "text.ceil": "ceil",
      "text.ln": "ln",
      "text.log": "log",
      "text.exp": "e^",
      "text.pow10": "10^",
      "text.cos": "cos",
      "text.sin": "sin",
      "text.tan": "tan",
      "text.sec": "sec",
      "text.csc": "csc",
      "text.cot": "cot",
      "text.acos": "arccos",
      "text.asin": "arcsin",
      "text.atan": "arctan",
      "text.asec": "arcsec",
      "text.acsc": "arccsc",
      "text.acot": "arccot",
      "text.sinh": "sinh",
      "text.cosh": "cosh",
      "text.tanh": "tanh",
      "text.asinh": "arcsinh",
      "text.acosh": "arccosh",
      "text.atanh": "arctanh",
      "text.degrees": "degrees",
      "text.radians": "radians",
      "text.pgcd": "GCD",
      "text.ppcm": "LCM",
      "text.reste": "remainder",
      "text.quotient": "quotient",
      "text.vad": "Approximate value by defect of",
      "text.vae": "Approximate value by excess of",
      "text.arrondi": "Round",
      "text.multiple": "multiple",
      "text.diviseur": "divider",
    },
    de: {
      "pm.title": "Mathe",
      "pm.add": "[NUM1] + [NUM2]",
      "pm.substract": "[NUM1] - [NUM2]",
      "pm.multiply": "[NUM1] x [NUM2]",
      "pm.divide": "[NUM1] / [NUM2]",
      "pm.pow": "[NUM1] ^ [NUM2]",
      "pm.mathop": "[OPERATOR] von [NUM1]",
      "pm.angleconvert": "konvertiere [NUM1] von [FROM] zu [TO]",
      "pm.mathopdiv": "[OPERATOR] der Division von [NUM1] durch [NUM2]",
      "pm.mathop2": "[OPERATOR] von [NUM1] und [NUM2]",
      "pm.multiple": "[NUM1] ist ein [choix1] von [NUM2]",
      "pm.arrondis": "[TYPE] von [NUM1] auf [CHIFFRE]",
      "pm.pentiere": "[choix1] Ziffer von [NUM1]",
      "pm.pdecimale": "[choix1] Ziffer von [NUM1]",
      "pm.sommechiffres": "Quersumme von [NUM1]",
      "pm.factorial": "Fakultät von [NUM1]",
      "pm.pi": "π",
      "pm.e": "e",
      "pm.oppose": "- [NUM1]",
      "pm.inverse": "1 / [NUM1]",
      "pm.pourcent": "[NUM1] %",
      "pm.random": "Zufallszahl von [NUM1] bis [NUM2]",
      "pm.gt": "[NUM1] < [NUM2]",
      "pm.gte": "[NUM1] ≤ [NUM2]",
      "pm.equals": "[NUM1] = [NUM2]",
      "pm.lt": "[NUM1] > [NUM2]",
      "pm.lte": "[NUM1] ≥ [NUM2]",
      "pm.min": "Minimum von [NUM1] und [NUM2]",
      "pm.max": "Maximum von [NUM1] und [NUM2]",
      "pm.and": "[OPERAND1] und [OPERAND2]",
      "pm.or": "[OPERAND1] oder [OPERAND2]",
      "pm.not": "nicht [OPERAND1]",
      "pm.join": "verbinde [STRING1] und [STRING2]",
      "pm.letterof": "Zeichen [LETTER] von [STRING]",
      "pm.length": "Länge von [STRING]",
      "pm.contains": "[STRING1] enthält [STRING2] ?",
      "pm.extract": "Zeichen [NUM1] bis [NUM2] aus [STRING]",
      "text.c1": "Einer",
      "text.c2": "Zehner",
      "text.c3": "Hunderter",
      "text.c4": "Tausender",
      "text.c5": "Zehntausender",
      "text.c6": "Hunderttausender",
      "text.c7": "Millionen",
      "text.c8": "Zehnmillionen",
      "text.c9": "Hundertmillionen",
      "text.c10": "Milliarden",
      "text.c11": "Zehnmilliarden",
      "text.c12": "Hundertmilliarden",
      "text.d1": "Zehntel",
      "text.d2": "Hundertstel",
      "text.d3": "Tausendstel",
      "text.d4": "Zehntausendstel",
      "text.d5": "Hunderttausendstel",
      "text.d6": "Millionstel",
      "text.a0": "die Einerstelle",
      "text.a1": "die Zehntelstelle",
      "text.a2": "die Hundertstelstelle",
      "text.a3": "die Tausendstelstelle",
      "text.a4": "die Zehntausendstelstelle",
      "text.a5": "die Hunderttausendstelstelle",
      "text.a6": "die Millionstelstelle",
      "text.sqrt": "√",
      "text.abs": "Betrag",
      "text.sign": "Vorzeichen",
      "text.floor": "Abrunden",
      "text.ceil": "Aufrunden",
      "text.ln": "ln",
      "text.log": "log",
      "text.exp": "e^",
      "text.pow10": "10^",
      "text.cos": "cos",
      "text.sin": "sin",
      "text.tan": "tan",
      "text.sec": "sec",
      "text.csc": "csc",
      "text.cot": "cot",
      "text.acos": "arccos",
      "text.asin": "arcsin",
      "text.atan": "arctan",
      "text.asec": "arcsec",
      "text.acsc": "arccsc",
      "text.acot": "arccot",
      "text.sinh": "sinh",
      "text.cosh": "cosh",
      "text.tanh": "tanh",
      "text.asinh": "arsinh",
      "text.acosh": "arcosh",
      "text.atanh": "artanh",
      "text.degrees": "Grad",
      "text.radians": "Radiant",
      "text.pgcd": "ggT",
      "text.ppcm": "kgV",
      "text.reste": "Rest",
      "text.quotient": "Quotient",
      "text.vad": "Abgerundeter Wert von",
      "text.vae": "Aufgerundeter Wert von",
      "text.arrondi": "Runde",
      "text.multiple": "Vielfaches",
      "text.diviseur": "Teiler",
    },
    fr: {
      "pm.title": "Maths",
      "pm.add": "[NUM1] + [NUM2]",
      "pm.substract": "[NUM1] - [NUM2]",
      "pm.multiply": "[NUM1] x [NUM2]",
      "pm.divide": "[NUM1] / [NUM2]",
      "pm.pow": "[NUM1] ^ [NUM2]",
      "pm.mathop": "[OPERATOR] de [NUM1]",
      "pm.angleconvert": "convertir [NUM1] de [FROM] en [TO]",
      "pm.mathopdiv": "[OPERATOR] de [NUM1] divisé par [NUM2]",
      "pm.mathop2": "[OPERATOR] de [NUM1] et [NUM2]",
      "pm.multiple": "[NUM1] est un [choix1] de [NUM2]",
      "pm.arrondis": "[TYPE] de [NUM1] [CHIFFRE]",
      "pm.pentiere": "chiffre des [choix1] de [NUM1]",
      "pm.pdecimale": "chiffre des [choix1] de [NUM1]",
      "pm.sommechiffres": "somme des chiffres de [NUM1]",
      "pm.factorial": "factorielle de [NUM1]",
      "pm.pi": "π",
      "pm.e": "e",
      "pm.oppose": "- [NUM1]",
      "pm.inverse": "1 / [NUM1]",
      "pm.pourcent": "[NUM1] %",
      "pm.random": "nombre aléatoire entre [NUM1] et [NUM2]",
      "pm.gt": "[NUM1] < [NUM2]",
      "pm.gte": "[NUM1] ≤ [NUM2]",
      "pm.equals": "[NUM1] = [NUM2]",
      "pm.lt": "[NUM1] > [NUM2]",
      "pm.lte": "[NUM1] ≥ [NUM2]",
      "pm.min": "minimum de [NUM1] et [NUM2]",
      "pm.max": "maximum de [NUM1] et [NUM2]",
      "pm.and": "[OPERAND1] et [OPERAND2]",
      "pm.or": "[OPERAND1] ou [OPERAND2]",
      "pm.not": "non [OPERAND1]",
      "pm.join": "regrouper [STRING1] et [STRING2]",
      "pm.letterof": "lettre [LETTER] de [STRING]",
      "pm.length": "longueur de [STRING]",
      "pm.contains": "[STRING1] contient [STRING2] ?",
      "pm.extract": "extraire caractères [NUM1] à [NUM2] de [STRING]",
      "text.c1": "unités",
      "text.c2": "dizaines",
      "text.c3": "centaines",
      "text.c4": "unités de mille",
      "text.c5": "dizaines de mille",
      "text.c6": "centaines de mille",
      "text.c7": "unités de millions",
      "text.c8": "dizaines de millions",
      "text.c9": "centaines de millions",
      "text.c10": "unités de milliards",
      "text.c11": "dizaines de milliards",
      "text.c12": "centaines de milliards",
      "text.d1": "dixièmes",
      "text.d2": "centièmes",
      "text.d3": "millièmes",
      "text.d4": "dix-millièmes",
      "text.d5": "cent-millièmes",
      "text.d6": "millionièmes",
      "text.a0": "à l'unité",
      "text.a1": "au dixième",
      "text.a2": "au centième",
      "text.a3": "au millième",
      "text.a4": "au dix-millième",
      "text.a5": "au cent-millième",
      "text.a6": "au millionième",
      "text.sqrt": "√",
      "text.abs": "valeur absolue",
      "text.sign": "signe",
      "text.floor": "plancher",
      "text.ceil": "plafond",
      "text.ln": "ln",
      "text.log": "log",
      "text.exp": "e^",
      "text.pow10": "10^",
      "text.cos": "cos",
      "text.sin": "sin",
      "text.tan": "tan",
      "text.sec": "sec",
      "text.csc": "csc",
      "text.cot": "cot",
      "text.acos": "arccos",
      "text.asin": "arcsin",
      "text.atan": "arctan",
      "text.asec": "arcsec",
      "text.acsc": "arccsc",
      "text.acot": "arccot",
      "text.sinh": "sinh",
      "text.cosh": "cosh",
      "text.tanh": "tanh",
      "text.asinh": "argsinh",
      "text.acosh": "argcosh",
      "text.atanh": "argtanh",
      "text.degrees": "degrés",
      "text.radians": "radians",
      "text.pgcd": "PGCD",
      "text.ppcm": "PPCM",
      "text.reste": "reste",
      "text.quotient": "quotient",
      "text.vad": "valeur approchée par défaut de",
      "text.vae": "valeur approchée par excès de",
      "text.arrondi": "arrondi de",
      "text.multiple": "multiple",
      "text.diviseur": "diviseur",
    },
  };

  /**
   * Comprehensive language detection using multiple methods
   * @returns {string} Detected language code
   */
  function detectLanguage() {
    const results = {};
    let finalLanguage = "en"; // Default fallback

    console.log("=== PLANETEMATHS LANGUAGE DETECTION DEBUG ===");

    // Method 1: navigator.language
    try {
      results.navigatorLanguage = navigator.language;
      console.log("1. navigator.language:", navigator.language);
    } catch (e) {
      results.navigatorLanguage = "error: " + e.message;
      console.log("1. navigator.language: ERROR", e.message);
    }

    // Method 2: navigator.languages array
    try {
      results.navigatorLanguages = navigator.languages;
      console.log("2. navigator.languages:", navigator.languages);
    } catch (e) {
      results.navigatorLanguages = "error: " + e.message;
      console.log("2. navigator.languages: ERROR", e.message);
    }

    // Method 3: TurboWarp localStorage settings
    try {
      const twSettings = localStorage.getItem("tw:language");
      results.turboWarpLocalStorage = twSettings;
      console.log("3. TurboWarp localStorage (tw:language):", twSettings);
    } catch (e) {
      results.turboWarpLocalStorage = "error: " + e.message;
      console.log("3. TurboWarp localStorage: ERROR", e.message);
    }

    // Method 4: Scratch VM locale (if available)
    try {
      if (typeof Scratch !== "undefined" && Scratch.vm && Scratch.vm.runtime) {
        const vmLocale = Scratch.vm.runtime.getLocale
          ? Scratch.vm.runtime.getLocale()
          : null;
        results.scratchVMLocale = vmLocale;
        console.log("4. Scratch VM locale:", vmLocale);
      } else {
        results.scratchVMLocale = null;
        console.log("4. Scratch VM locale: NOT AVAILABLE");
      }
    } catch (e) {
      results.scratchVMLocale = "error: " + e.message;
      console.log("4. Scratch VM locale: ERROR", e.message);
    }

    // Method 5: Check document.documentElement.lang
    try {
      const htmlLang = document.documentElement.lang;
      results.documentLang = htmlLang || "";
      console.log("5. document.documentElement.lang:", htmlLang);
    } catch (e) {
      results.documentLang = "error: " + e.message;
      console.log("5. document.documentElement.lang: ERROR", e.message);
    }

    // Method 6: Check URL parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") || urlParams.get("locale");
      results.urlParameter = urlLang;
      console.log("6. URL parameter (lang/locale):", urlLang);
    } catch (e) {
      results.urlParameter = "error: " + e.message;
      console.log("6. URL parameter: ERROR", e.message);
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
          "7. window.scratchTranslate.locale:",
          window.scratchTranslate.locale
        );
      } else {
        results.scratchTranslate = "not available";
        console.log("7. window.scratchTranslate: NOT AVAILABLE");
      }
    } catch (e) {
      results.scratchTranslate = "error: " + e.message;
      console.log("7. window.scratchTranslate: ERROR", e.message);
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
        console.log("8. Redux store locale:", reduxLocale);
      } else {
        results.reduxStore = "not available";
        console.log("8. Redux store: NOT AVAILABLE");
      }
    } catch (e) {
      results.reduxStore = "error: " + e.message;
      console.log("8. Redux store: ERROR", e.message);
    }

    // Method 9: Check global window._locale (some Scratch forks use this)
    try {
      if (typeof window !== "undefined" && window._locale) {
        results.windowLocale = window._locale;
        console.log("9. window._locale:", window._locale);
      } else {
        results.windowLocale = "not available";
        console.log("9. window._locale: NOT AVAILABLE");
      }
    } catch (e) {
      results.windowLocale = "error: " + e.message;
      console.log("9. window._locale: ERROR", e.message);
    }

    // Method 10: Check meta tags
    try {
      const metaLang = document.querySelector(
        'meta[http-equiv="content-language"]'
      );
      const metaContent = metaLang ? metaLang.getAttribute("content") : null;
      results.metaTag = metaContent;
      console.log("10. Meta tag content-language:", metaContent);
    } catch (e) {
      results.metaTag = "error: " + e.message;
      console.log("10. Meta tag: ERROR", e.message);
    }

    console.log("\n=== ALL DETECTION RESULTS ===");
    console.log(JSON.stringify(results, null, 2));

    // Helper function to extract language code
    const extractLangCode = (locale) => {
      if (!locale || typeof locale !== "string") return null;
      const lower = locale.toLowerCase();

      // Check for German
      if (lower.startsWith("de")) return "de";
      // Check for French
      if (lower.startsWith("fr")) return "fr";
      // Default to English
      return "en";
    };

    // Decision logic - Priority order
    console.log("\n=== DECISION LOGIC ===");

    // Priority 1: Redux store (most reliable for TurboWarp)
    if (
      results.reduxStore &&
      typeof results.reduxStore === "string" &&
      !results.reduxStore.includes("error") &&
      results.reduxStore !== "not available"
    ) {
      console.log("✓ Using Redux store locale:", results.reduxStore);
      finalLanguage = extractLangCode(results.reduxStore);
    }
    // Priority 2: TurboWarp localStorage
    else if (
      results.turboWarpLocalStorage &&
      typeof results.turboWarpLocalStorage === "string" &&
      !results.turboWarpLocalStorage.includes("error") &&
      results.turboWarpLocalStorage !== "null"
    ) {
      console.log(
        "✓ Using TurboWarp localStorage:",
        results.turboWarpLocalStorage
      );
      finalLanguage = extractLangCode(results.turboWarpLocalStorage);
    }
    // Priority 3: Scratch VM locale
    else if (
      results.scratchVMLocale &&
      typeof results.scratchVMLocale === "string" &&
      !results.scratchVMLocale.includes("error") &&
      results.scratchVMLocale !== "null"
    ) {
      console.log("✓ Using Scratch VM locale:", results.scratchVMLocale);
      finalLanguage = extractLangCode(results.scratchVMLocale);
    }
    // Priority 4: URL parameter
    else if (
      results.urlParameter &&
      typeof results.urlParameter === "string" &&
      !results.urlParameter.includes("error")
    ) {
      console.log("✓ Using URL parameter:", results.urlParameter);
      finalLanguage = extractLangCode(results.urlParameter);
    }
    // Priority 5: document.documentElement.lang
    else if (
      results.documentLang &&
      typeof results.documentLang === "string" &&
      results.documentLang !== "" &&
      !results.documentLang.includes("error")
    ) {
      console.log(
        "✓ Using document.documentElement.lang:",
        results.documentLang
      );
      finalLanguage = extractLangCode(results.documentLang);
    }
    // Priority 6: window._locale
    else if (
      results.windowLocale &&
      typeof results.windowLocale === "string" &&
      !results.windowLocale.includes("error") &&
      results.windowLocale !== "not available"
    ) {
      console.log("✓ Using window._locale:", results.windowLocale);
      finalLanguage = extractLangCode(results.windowLocale);
    }
    // Priority 7: scratchTranslate
    else if (
      results.scratchTranslate &&
      typeof results.scratchTranslate === "string" &&
      !results.scratchTranslate.includes("error") &&
      results.scratchTranslate !== "not available"
    ) {
      console.log("✓ Using window.scratchTranslate:", results.scratchTranslate);
      finalLanguage = extractLangCode(results.scratchTranslate);
    }
    // Priority 8: navigator.language
    else if (
      results.navigatorLanguage &&
      typeof results.navigatorLanguage === "string" &&
      !results.navigatorLanguage.includes("error")
    ) {
      console.log("✓ Using navigator.language:", results.navigatorLanguage);
      finalLanguage = extractLangCode(results.navigatorLanguage);
    }
    // Priority 9: First entry in navigator.languages
    else if (
      results.navigatorLanguages &&
      Array.isArray(results.navigatorLanguages) &&
      results.navigatorLanguages.length > 0
    ) {
      console.log(
        "✓ Using navigator.languages[0]:",
        results.navigatorLanguages[0]
      );
      finalLanguage = extractLangCode(results.navigatorLanguages[0]);
    }
    // Priority 10: Meta tag
    else if (
      results.metaTag &&
      typeof results.metaTag === "string" &&
      !results.metaTag.includes("error")
    ) {
      console.log("✓ Using meta tag:", results.metaTag);
      finalLanguage = extractLangCode(results.metaTag);
    }
    // Fallback: Default to English
    else {
      console.log("✗ No locale detected, using default: en");
      finalLanguage = "en";
    }

    console.log("\n=== FINAL DECISION ===");
    console.log("Selected language:", finalLanguage);
    console.log("================================\n");

    // Store results for debugging
    if (typeof window !== "undefined") {
      window._planeteMathsLanguageDetection = {
        timestamp: new Date().toISOString(),
        results: results,
        finalLanguage: finalLanguage,
      };
      console.log(
        "Debug info stored in: window._planeteMathsLanguageDetection"
      );
    }

    return finalLanguage;
  }

  // ============================================================================
  // MODULE-LEVEL LOCALE STATE
  //
  // Keeps the active language outside the class so getInfo() (and any other
  // call site) reads the current value at call time, and so language-change
  // listeners are registered exactly once when the gallery .js is loaded —
  // not once per `new PlaneteMaths()`. This mirrors the working pattern used
  // by ev3dev_py_transpile.js.
  // ============================================================================

  let currentLang = detectLanguage();

  if (typeof window !== "undefined") {
    // TurboWarp persists the editor language to localStorage under tw:language;
    // a `storage` event fires for changes made in *other* tabs.
    window.addEventListener("storage", (e) => {
      if (e.key === "tw:language") {
        const newLang = detectLanguage();
        if (newLang !== currentLang) {
          currentLang = newLang;
          console.log("[PlaneteMaths] currentLang →", currentLang);
        }
      }
    });

    // For changes made in the same tab, watch the Redux store directly.
    let lastKnownLocale = null;
    setInterval(() => {
      try {
        if (window.ReduxStore && window.ReduxStore.getState) {
          const locale = window.ReduxStore.getState().locales?.locale;
          if (locale && locale !== lastKnownLocale) {
            lastKnownLocale = locale;
            const lower = locale.toLowerCase();
            const newLang = lower.startsWith("de")
              ? "de"
              : lower.startsWith("fr")
                ? "fr"
                : "en";
            if (newLang !== currentLang) {
              currentLang = newLang;
              console.log(
                "[PlaneteMaths] Redux locale changed → currentLang =",
                currentLang
              );
            }
          }
        }
      } catch (e) {
        // ReduxStore may not be exposed; ignore.
      }
    }, 1000);
  }

  // Module-level translation lookup — reads currentLang at call time so each
  // getInfo() invocation reflects the latest detected language.
  function t(key, defaultValue) {
    try {
      const tr = translations[currentLang];
      if (tr && tr[key]) return tr[key];
      if (translations.en && translations.en[key]) return translations.en[key];
      return defaultValue !== undefined ? defaultValue : key;
    } catch (e) {
      return defaultValue !== undefined ? defaultValue : key;
    }
  }

  // Utility functions for type casting
  const Cast = {
    toNumber: function (value) {
      try {
        if (typeof value === "number") {
          if (isNaN(value)) {
            log("toNumber: NaN detected, returning 0");
            return 0;
          }
          return value;
        }
        const num = Number(value);
        if (isNaN(num)) {
          log(`toNumber: Could not convert "${value}" to number, returning 0`);
          return 0;
        }
        return num;
      } catch (e) {
        error("toNumber error:", e);
        return 0;
      }
    },

    toString: function (value) {
      try {
        return String(value);
      } catch (e) {
        error("toString error:", e);
        return "";
      }
    },

    toBoolean: function (value) {
      try {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          return !(
            value === "" ||
            value === "0" ||
            value.toLowerCase() === "false"
          );
        }
        return Boolean(value);
      } catch (e) {
        error("toBoolean error:", e);
        return false;
      }
    },

    compare: function (v1, v2) {
      try {
        let n1 = Cast.toNumber(v1);
        let n2 = Cast.toNumber(v2);
        if (n1 < n2) return -1;
        if (n1 > n2) return 1;
        return 0;
      } catch (e) {
        error("compare error:", e);
        return 0;
      }
    },

    isInt: function (value) {
      try {
        return Number.isInteger(Cast.toNumber(value));
      } catch (e) {
        error("isInt error:", e);
        return false;
      }
    },
  };

  // MathUtil for Scratch-compatible tan function
  const MathUtil = {
    tan: function (deg) {
      try {
        deg = deg % 360;
        if (deg === 90 || deg === -270) return Infinity;
        if (deg === -90 || deg === 270) return -Infinity;
        return parseFloat(Math.tan((Math.PI * deg) / 180).toFixed(10));
      } catch (e) {
        error("MathUtil.tan error:", e);
        return 0;
      }
    },
  };

  class PlaneteMaths {
    constructor() {
      log("Extension initialized, currentLang:", currentLang);
    }

    // Delegates to the module-level `t()`. Kept as a method so the existing
    // `this._translate(...)` call sites in getInfo() don't need to change.
    _translate(key, defaultValue) {
      return t(key, defaultValue);
    }

    getInfo() {
      log("getInfo() called, currentLang:", currentLang);
      return {
        id: "planetemaths",
        name: this._translate("pm.title", "Maths"),
        color1: "#4879b7",
        color2: "#3d6699",
        color3: "#325580",
        blocks: [
          {
            opcode: "add",
            text: this._translate("pm.add", "[NUM1] + [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "substract",
            text: this._translate("pm.substract", "[NUM1] - [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "multiply",
            text: this._translate("pm.multiply", "[NUM1] x [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "divide",
            text: this._translate("pm.divide", "[NUM1] / [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          "---",
          {
            opcode: "pow",
            text: this._translate("pm.pow", "[NUM1] ^ [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          "---",
          {
            opcode: "mathop",
            text: this._translate("pm.mathop", "[OPERATOR] of [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              OPERATOR: {
                type: Scratch.ArgumentType.STRING,
                menu: "LIST_MATHOP",
                defaultValue: "sqrt",
              },
            },
          },
          {
            opcode: "angleconvert",
            text: this._translate(
              "pm.angleconvert",
              "convert [NUM1] from [FROM] to [TO]"
            ),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "90" },
              FROM: {
                type: Scratch.ArgumentType.STRING,
                menu: "ANGLE_UNITS",
                defaultValue: "degrees",
              },
              TO: {
                type: Scratch.ArgumentType.STRING,
                menu: "ANGLE_UNITS",
                defaultValue: "radians",
              },
            },
          },
          "---",
          {
            opcode: "mathopdiv",
            text: this._translate(
              "pm.mathopdiv",
              "[OPERATOR] of [NUM1] divided by [NUM2]"
            ),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              OPERATOR: {
                type: Scratch.ArgumentType.STRING,
                menu: "LIST_MATHOPDIV",
                defaultValue: "reste",
              },
            },
          },
          {
            opcode: "mathop2",
            text: this._translate(
              "pm.mathop2",
              "[OPERATOR] of [NUM1] and [NUM2]"
            ),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              OPERATOR: {
                type: Scratch.ArgumentType.STRING,
                menu: "LIST_MATHOP2",
                defaultValue: "pgcd",
              },
            },
          },
          {
            opcode: "multiple",
            text: this._translate(
              "pm.multiple",
              "[NUM1] is a [choix1] of [NUM2]"
            ),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              choix1: {
                type: Scratch.ArgumentType.STRING,
                menu: "MULTIPLE_DIVISEUR",
                defaultValue: "multiple",
              },
            },
          },
          "---",
          {
            opcode: "arrondis",
            text: this._translate("pm.arrondis", "[TYPE] [NUM1] to [CHIFFRE]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "ARRONDIS",
                defaultValue: "arrondi",
              },
              CHIFFRE: {
                type: Scratch.ArgumentType.STRING,
                menu: "CHIFFRE_ARRONDIS",
                defaultValue: "0",
              },
            },
          },
          "---",
          {
            opcode: "chiffre_pentiere",
            text: this._translate("pm.pentiere", "[choix1] digit of [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              choix1: {
                type: Scratch.ArgumentType.STRING,
                menu: "PARTIE_ENTIERE",
                defaultValue: "0",
              },
            },
          },
          {
            opcode: "chiffre_pdecimale",
            text: this._translate("pm.pdecimale", "[choix1] digit of [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              choix1: {
                type: Scratch.ArgumentType.STRING,
                menu: "PARTIE_DECIMALE",
                defaultValue: "1",
              },
            },
          },
          {
            opcode: "sommechiffres",
            text: this._translate(
              "pm.sommechiffres",
              "sum of digits of [NUM1]"
            ),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "factorial",
            text: this._translate("pm.factorial", "factorial of [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "5" },
            },
          },
          "---",
          {
            opcode: "nombre_pi",
            text: this._translate("pm.pi", "π"),
            blockType: Scratch.BlockType.REPORTER,
          },
          {
            opcode: "nombre_e",
            text: this._translate("pm.e", "e"),
            blockType: Scratch.BlockType.REPORTER,
          },
          {
            opcode: "oppose",
            text: this._translate("pm.oppose", "- [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "inverse",
            text: this._translate("pm.inverse", "1 / [NUM1]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "pourcent",
            text: this._translate("pm.pourcent", "[NUM1] %"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          "---",
          {
            opcode: "random",
            text: this._translate("pm.random", "pick random [NUM1] to [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "10" },
            },
          },
          "---",
          {
            opcode: "gt",
            text: this._translate("pm.gt", "[NUM1] < [NUM2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "50" },
            },
          },
          {
            opcode: "gte",
            text: this._translate("pm.gte", "[NUM1] ≤ [NUM2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "50" },
            },
          },
          {
            opcode: "equals",
            text: this._translate("pm.equals", "[NUM1] = [NUM2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "50" },
            },
          },
          {
            opcode: "lt",
            text: this._translate("pm.lt", "[NUM1] > [NUM2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "50" },
            },
          },
          {
            opcode: "lte",
            text: this._translate("pm.lte", "[NUM1] ≥ [NUM2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "50" },
            },
          },
          {
            opcode: "min",
            text: this._translate("pm.min", "minimum of [NUM1] and [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          {
            opcode: "max",
            text: this._translate("pm.max", "maximum of [NUM1] and [NUM2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "" },
            },
          },
          "---",
          {
            opcode: "and",
            text: this._translate("pm.and", "[OPERAND1] and [OPERAND2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              OPERAND1: { type: Scratch.ArgumentType.BOOLEAN },
              OPERAND2: { type: Scratch.ArgumentType.BOOLEAN },
            },
          },
          {
            opcode: "or",
            text: this._translate("pm.or", "[OPERAND1] or [OPERAND2]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              OPERAND1: { type: Scratch.ArgumentType.BOOLEAN },
              OPERAND2: { type: Scratch.ArgumentType.BOOLEAN },
            },
          },
          {
            opcode: "not",
            text: this._translate("pm.not", "not [OPERAND1]"),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              OPERAND1: { type: Scratch.ArgumentType.BOOLEAN },
            },
          },
          "---",
          {
            opcode: "join",
            text: this._translate("pm.join", "join [STRING1] [STRING2]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STRING1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Planète ",
              },
              STRING2: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Maths",
              },
            },
          },
          {
            opcode: "letterOf",
            text: this._translate("pm.letterof", "letter [LETTER] of [STRING]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Maths",
              },
              LETTER: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1" },
            },
          },
          {
            opcode: "length",
            text: this._translate("pm.length", "length of [STRING]"),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Maths",
              },
            },
          },
          {
            opcode: "contains",
            text: this._translate(
              "pm.contains",
              "[STRING1] contains [STRING2] ?"
            ),
            blockType: Scratch.BlockType.BOOLEAN,
            arguments: {
              STRING1: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Maths",
              },
              STRING2: { type: Scratch.ArgumentType.STRING, defaultValue: "s" },
            },
          },
          {
            opcode: "extract",
            text: this._translate(
              "pm.extract",
              "extract characters from [NUM1] to [NUM2] of [STRING]"
            ),
            blockType: Scratch.BlockType.REPORTER,
            arguments: {
              STRING: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Planète Maths",
              },
              NUM1: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1" },
              NUM2: { type: Scratch.ArgumentType.NUMBER, defaultValue: "7" },
            },
          },
        ],
        menus: {
          PARTIE_ENTIERE: {
            acceptReporters: true,
            items: [
              { text: this._translate("text.c1", "units"), value: "0" },
              { text: this._translate("text.c2", "tens"), value: "1" },
              { text: this._translate("text.c3", "hundreds"), value: "2" },
              { text: this._translate("text.c4", "thousands"), value: "3" },
              {
                text: this._translate("text.c5", "tens of thousands"),
                value: "4",
              },
              {
                text: this._translate("text.c6", "hundreds of thousands"),
                value: "5",
              },
              { text: this._translate("text.c7", "millions"), value: "6" },
              {
                text: this._translate("text.c8", "tens of millions"),
                value: "7",
              },
              {
                text: this._translate("text.c9", "hundreds of millions"),
                value: "8",
              },
              { text: this._translate("text.c10", "billions"), value: "9" },
              {
                text: this._translate("text.c11", "tens of billions"),
                value: "10",
              },
              {
                text: this._translate("text.c12", "hundreds of billions"),
                value: "11",
              },
            ],
          },
          PARTIE_DECIMALE: {
            acceptReporters: true,
            items: [
              { text: this._translate("text.d1", "tenths"), value: "1" },
              { text: this._translate("text.d2", "hundredths"), value: "2" },
              { text: this._translate("text.d3", "thousandths"), value: "3" },
              {
                text: this._translate("text.d4", "ten thousandths"),
                value: "4",
              },
              {
                text: this._translate("text.d5", "hundred thousandths"),
                value: "5",
              },
              { text: this._translate("text.d6", "millionths"), value: "6" },
            ],
          },
          CHIFFRE_ARRONDIS: {
            acceptReporters: true,
            items: [
              { text: this._translate("text.a0", "the unit"), value: "0" },
              { text: this._translate("text.a1", "tenth"), value: "1" },
              { text: this._translate("text.a2", "hundredth"), value: "2" },
              { text: this._translate("text.a3", "thousandth"), value: "3" },
              {
                text: this._translate("text.a4", "ten thousandth"),
                value: "4",
              },
              {
                text: this._translate("text.a5", "hundred thousandth"),
                value: "5",
              },
              { text: this._translate("text.a6", "millionth"), value: "6" },
            ],
          },
          LIST_MATHOP: {
            acceptReporters: true,
            items: [
              { text: this._translate("text.sqrt", "√"), value: "sqrt" },
              { text: this._translate("text.abs", "abs"), value: "abs" },
              { text: this._translate("text.sign", "sign"), value: "sign" },
              { text: this._translate("text.floor", "floor"), value: "floor" },
              { text: this._translate("text.ceil", "ceil"), value: "ceil" },
              { text: this._translate("text.ln", "ln"), value: "ln" },
              { text: this._translate("text.log", "log"), value: "log" },
              { text: this._translate("text.exp", "e^"), value: "exp" },
              { text: this._translate("text.pow10", "10^"), value: "10^" },
              { text: this._translate("text.sin", "sin"), value: "sin" },
              { text: this._translate("text.cos", "cos"), value: "cos" },
              { text: this._translate("text.tan", "tan"), value: "tan" },
              { text: this._translate("text.sec", "sec"), value: "sec" },
              { text: this._translate("text.csc", "csc"), value: "csc" },
              { text: this._translate("text.cot", "cot"), value: "cot" },
              { text: this._translate("text.asin", "arcsin"), value: "asin" },
              { text: this._translate("text.acos", "arccos"), value: "acos" },
              { text: this._translate("text.atan", "arctan"), value: "atan" },
              { text: this._translate("text.asec", "arcsec"), value: "asec" },
              { text: this._translate("text.acsc", "arccsc"), value: "acsc" },
              { text: this._translate("text.acot", "arccot"), value: "acot" },
              { text: this._translate("text.sinh", "sinh"), value: "sinh" },
              { text: this._translate("text.cosh", "cosh"), value: "cosh" },
              { text: this._translate("text.tanh", "tanh"), value: "tanh" },
              {
                text: this._translate("text.asinh", "arcsinh"),
                value: "asinh",
              },
              {
                text: this._translate("text.acosh", "arccosh"),
                value: "acosh",
              },
              {
                text: this._translate("text.atanh", "arctanh"),
                value: "atanh",
              },
            ],
          },
          ANGLE_UNITS: {
            acceptReporters: true,
            items: [
              {
                text: this._translate("text.degrees", "degrees"),
                value: "degrees",
              },
              {
                text: this._translate("text.radians", "radians"),
                value: "radians",
              },
            ],
          },
          LIST_MATHOP2: {
            acceptReporters: true,
            items: [
              { text: this._translate("text.pgcd", "GCD"), value: "pgcd" },
              { text: this._translate("text.ppcm", "LCM"), value: "ppcm" },
            ],
          },
          LIST_MATHOPDIV: {
            acceptReporters: true,
            items: [
              {
                text: this._translate("text.reste", "remainder"),
                value: "reste",
              },
              {
                text: this._translate("text.quotient", "quotient"),
                value: "quotient",
              },
            ],
          },
          ARRONDIS: {
            acceptReporters: true,
            items: [
              {
                text: this._translate(
                  "text.vad",
                  "Approximate value by defect of"
                ),
                value: "vad",
              },
              {
                text: this._translate(
                  "text.vae",
                  "Approximate value by excess of"
                ),
                value: "vae",
              },
              {
                text: this._translate("text.arrondi", "Round"),
                value: "arrondi",
              },
            ],
          },
          MULTIPLE_DIVISEUR: {
            acceptReporters: true,
            items: [
              {
                text: this._translate("text.multiple", "multiple"),
                value: "multiple",
              },
              {
                text: this._translate("text.diviseur", "divider"),
                value: "diviseur",
              },
            ],
          },
        },
      };
    }

    // Basic arithmetic operations
    add(args) {
      try {
        const result = Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
        log(`add(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("add error:", e);
        return 0;
      }
    }

    substract(args) {
      try {
        const result = Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
        log(`substract(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("substract error:", e);
        return 0;
      }
    }

    multiply(args) {
      try {
        const result = Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
        log(`multiply(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("multiply error:", e);
        return 0;
      }
    }

    divide(args) {
      try {
        const num2 = Cast.toNumber(args.NUM2);
        if (num2 === 0) {
          error("Division by zero");
          return Infinity;
        }
        const result = Cast.toNumber(args.NUM1) / num2;
        log(`divide(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("divide error:", e);
        return 0;
      }
    }

    pow(args) {
      try {
        const result = Math.pow(
          Cast.toNumber(args.NUM1),
          Cast.toNumber(args.NUM2)
        );
        log(`pow(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("pow error:", e);
        return 0;
      }
    }

    // Comparison operations
    gt(args) {
      try {
        const result = Cast.compare(args.NUM1, args.NUM2) < 0;
        log(`gt(${args.NUM1} < ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("gt error:", e);
        return false;
      }
    }

    gte(args) {
      try {
        const result = Cast.compare(args.NUM1, args.NUM2) <= 0;
        log(`gte(${args.NUM1} ≤ ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("gte error:", e);
        return false;
      }
    }

    equals(args) {
      try {
        const result = Cast.compare(args.NUM1, args.NUM2) === 0;
        log(`equals(${args.NUM1} = ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("equals error:", e);
        return false;
      }
    }

    lt(args) {
      try {
        const result = Cast.compare(args.NUM1, args.NUM2) > 0;
        log(`lt(${args.NUM1} > ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("lt error:", e);
        return false;
      }
    }

    lte(args) {
      try {
        const result = Cast.compare(args.NUM1, args.NUM2) >= 0;
        log(`lte(${args.NUM1} ≥ ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("lte error:", e);
        return false;
      }
    }

    min(args) {
      try {
        const result = Math.min(
          Cast.toNumber(args.NUM1),
          Cast.toNumber(args.NUM2)
        );
        log(`min(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("min error:", e);
        return 0;
      }
    }

    max(args) {
      try {
        const result = Math.max(
          Cast.toNumber(args.NUM1),
          Cast.toNumber(args.NUM2)
        );
        log(`max(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("max error:", e);
        return 0;
      }
    }

    // Unary operations
    oppose(args) {
      try {
        const result = -1 * Cast.toNumber(args.NUM1);
        log(`oppose(${args.NUM1}) = ${result}`);
        return result;
      } catch (e) {
        error("oppose error:", e);
        return 0;
      }
    }

    inverse(args) {
      try {
        const num = Cast.toNumber(args.NUM1);
        if (num === 0) {
          error("Inverse of zero");
          return Infinity;
        }
        const result = 1 / num;
        log(`inverse(${args.NUM1}) = ${result}`);
        return result;
      } catch (e) {
        error("inverse error:", e);
        return 0;
      }
    }

    pourcent(args) {
      try {
        const result = Cast.toNumber(args.NUM1) / 100;
        log(`pourcent(${args.NUM1}) = ${result}`);
        return result;
      } catch (e) {
        error("pourcent error:", e);
        return 0;
      }
    }

    // Random
    random(args) {
      try {
        const nFrom = Cast.toNumber(args.NUM1);
        const nTo = Cast.toNumber(args.NUM2);
        const low = nFrom <= nTo ? nFrom : nTo;
        const high = nFrom <= nTo ? nTo : nFrom;

        if (low === high) {
          log(`random(${args.NUM1}, ${args.NUM2}) = ${low} (same value)`);
          return low;
        }

        let result;
        if (Cast.isInt(args.NUM1) && Cast.isInt(args.NUM2)) {
          result = low + Math.floor(Math.random() * (high + 1 - low));
        } else {
          result = Math.random() * (high - low) + low;
        }

        log(`random(${args.NUM1}, ${args.NUM2}) = ${result}`);
        return result;
      } catch (e) {
        error("random error:", e);
        return 0;
      }
    }

    // Boolean operations
    and(args) {
      try {
        const result =
          Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
        log(`and(${args.OPERAND1}, ${args.OPERAND2}) = ${result}`);
        return result;
      } catch (e) {
        error("and error:", e);
        return false;
      }
    }

    or(args) {
      try {
        const result =
          Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
        log(`or(${args.OPERAND1}, ${args.OPERAND2}) = ${result}`);
        return result;
      } catch (e) {
        error("or error:", e);
        return false;
      }
    }

    not(args) {
      try {
        const result = !Cast.toBoolean(args.OPERAND1);
        log(`not(${args.OPERAND1}) = ${result}`);
        return result;
      } catch (e) {
        error("not error:", e);
        return false;
      }
    }

    // Advanced math operations
    mathop(args) {
      try {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n = Cast.toNumber(args.NUM1);

        log(`mathop(${operator}, ${args.NUM1})`);

        let result;
        switch (operator) {
          // Basic functions
          case "sqrt":
            if (n < 0) {
              error("Square root of negative number");
              return NaN;
            }
            result = Math.sqrt(n);
            break;
          case "abs":
            result = Math.abs(n);
            break;
          case "sign":
            result = Math.sign(n);
            break;
          case "floor":
            result = Math.floor(n);
            break;
          case "ceil":
            result = Math.ceil(n);
            break;

          // Logarithms and exponentials
          case "ln":
            if (n <= 0) {
              error("Natural log of non-positive number");
              return -Infinity;
            }
            result = Math.log(n);
            break;
          case "log":
            if (n <= 0) {
              error("Log of non-positive number");
              return -Infinity;
            }
            result = Math.log10(n);
            break;
          case "exp":
            result = Math.exp(n);
            break;
          case "10^":
            result = Math.pow(10, n);
            break;

          // Standard trigonometric functions (input in degrees)
          case "sin":
            result = parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
            break;
          case "cos":
            result = parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
            break;
          case "tan":
            result = MathUtil.tan(n);
            break;
          case "sec":
            result = 1 / parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
            break;
          case "csc":
            result = 1 / parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
            break;
          case "cot":
            result = 1 / MathUtil.tan(n);
            break;

          // Inverse trigonometric functions (output in degrees)
          case "asin":
            if (n < -1 || n > 1) {
              error("arcsin input out of range [-1, 1]");
              return NaN;
            }
            result = (Math.asin(n) * 180) / Math.PI;
            break;
          case "acos":
            if (n < -1 || n > 1) {
              error("arccos input out of range [-1, 1]");
              return NaN;
            }
            result = (Math.acos(n) * 180) / Math.PI;
            break;
          case "atan":
            result = (Math.atan(n) * 180) / Math.PI;
            break;
          case "asec":
            if (n > -1 && n < 1) {
              error("arcsec input out of valid range");
              return NaN;
            }
            result = (Math.acos(1 / n) * 180) / Math.PI;
            break;
          case "acsc":
            if (n > -1 && n < 1) {
              error("arccsc input out of valid range");
              return NaN;
            }
            result = (Math.asin(1 / n) * 180) / Math.PI;
            break;
          case "acot":
            result = (Math.atan(1 / n) * 180) / Math.PI;
            break;

          // Hyperbolic functions
          case "sinh":
            result = Math.sinh(n);
            break;
          case "cosh":
            result = Math.cosh(n);
            break;
          case "tanh":
            result = Math.tanh(n);
            break;

          // Inverse hyperbolic functions
          case "asinh":
            result = Math.asinh(n);
            break;
          case "acosh":
            if (n < 1) {
              error("arccosh input must be >= 1");
              return NaN;
            }
            result = Math.acosh(n);
            break;
          case "atanh":
            if (n <= -1 || n >= 1) {
              error("arctanh input must be in (-1, 1)");
              return NaN;
            }
            result = Math.atanh(n);
            break;

          default:
            error(`Unknown operator: ${operator}`);
            return 0;
        }

        log(`mathop result: ${result}`);
        return result;
      } catch (e) {
        error("mathop error:", e);
        return 0;
      }
    }

    angleconvert(args) {
      try {
        const value = Cast.toNumber(args.NUM1);
        const from = Cast.toString(args.FROM).toLowerCase();
        const to = Cast.toString(args.TO).toLowerCase();

        log(`angleconvert(${value} from ${from} to ${to})`);

        if (from === to) {
          return value;
        }

        let result;
        if (from === "degrees" && to === "radians") {
          result = (value * Math.PI) / 180;
        } else if (from === "radians" && to === "degrees") {
          result = (value * 180) / Math.PI;
        } else {
          error(`Unknown angle conversion: ${from} to ${to}`);
          return value;
        }

        log(`angleconvert result: ${result}`);
        return result;
      } catch (e) {
        error("angleconvert error:", e);
        return 0;
      }
    }

    mathop2(args) {
      try {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n1 = Cast.toNumber(args.NUM1);
        const n2 = Cast.toNumber(args.NUM2);

        log(`mathop2(${operator}, ${args.NUM1}, ${args.NUM2})`);

        if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
          error("mathop2 requires integer inputs");
          return "";
        }

        let result;
        switch (operator) {
          case "pgcd":
            result = this._pgcd(n1, n2);
            break;
          case "ppcm": {
            const gcd = this._pgcd(n1, n2);
            if (gcd === 0) {
              result = 0;
            } else {
              result = Math.abs(n1 * n2) / gcd;
            }
            break;
          }
          default:
            error(`Unknown operator: ${operator}`);
            return "";
        }

        log(`mathop2 result: ${result}`);
        return result;
      } catch (e) {
        error("mathop2 error:", e);
        return "";
      }
    }

    mathopdiv(args) {
      try {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n1 = Cast.toNumber(args.NUM1);
        const n2 = Cast.toNumber(args.NUM2);

        log(`mathopdiv(${operator}, ${args.NUM1}, ${args.NUM2})`);

        if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
          error("mathopdiv requires integer inputs");
          return "";
        }

        if (n2 === 0) {
          error("Division by zero in mathopdiv");
          return "";
        }

        const remainder = n1 % n2;
        let result;

        switch (operator) {
          case "reste":
            result = remainder;
            break;
          case "quotient":
            result = (n1 - remainder) / n2;
            break;
          default:
            error(`Unknown operator: ${operator}`);
            return "";
        }

        log(`mathopdiv result: ${result}`);
        return result;
      } catch (e) {
        error("mathopdiv error:", e);
        return "";
      }
    }

    arrondis(args) {
      try {
        const type = Cast.toString(args.TYPE).toLowerCase();
        const n1 = Cast.toNumber(args.NUM1);
        const c = Cast.toNumber(args.CHIFFRE);
        const factor = Math.pow(10, c);

        log(`arrondis(${type}, ${args.NUM1}, ${args.CHIFFRE})`);

        let result;
        switch (type) {
          case "vad":
            result = Math.floor(n1 * factor) / factor;
            break;
          case "vae":
            result = Math.ceil(n1 * factor) / factor;
            break;
          case "arrondi":
            result = Math.round(n1 * factor) / factor;
            break;
          default:
            error(`Unknown rounding type: ${type}`);
            return 0;
        }

        log(`arrondis result: ${result}`);
        return result;
      } catch (e) {
        error("arrondis error:", e);
        return 0;
      }
    }

    chiffre_pentiere(args) {
      try {
        const num = Cast.toNumber(args.NUM1);
        const pos = Cast.toNumber(args.choix1);

        log(`chiffre_pentiere(${args.NUM1}, ${args.choix1})`);

        const result =
          Math.floor(num / Math.pow(10, pos)) -
          Math.floor(num / Math.pow(10, pos + 1)) * 10;

        log(`chiffre_pentiere result: ${result}`);
        return result;
      } catch (e) {
        error("chiffre_pentiere error:", e);
        return 0;
      }
    }

    chiffre_pdecimale(args) {
      try {
        const num = Cast.toNumber(args.NUM1);
        const pos = Cast.toNumber(args.choix1);

        log(`chiffre_pdecimale(${args.NUM1}, ${args.choix1})`);

        const result =
          Math.floor(num * Math.pow(10, pos)) -
          Math.floor(num * Math.pow(10, pos - 1)) * 10;

        log(`chiffre_pdecimale result: ${result}`);
        return result;
      } catch (e) {
        error("chiffre_pdecimale error:", e);
        return 0;
      }
    }

    multiple(args) {
      try {
        const type = Cast.toString(args.choix1).toLowerCase();
        const n1 = Cast.toNumber(args.NUM1);
        const n2 = Cast.toNumber(args.NUM2);

        log(`multiple(${type}, ${args.NUM1}, ${args.NUM2})`);

        if (!Number.isInteger(n1) || !Number.isInteger(n2)) {
          error("multiple requires integer inputs");
          return false;
        }

        if (n2 === 0 && type === "multiple") {
          error("Cannot check if number is multiple of 0");
          return false;
        }

        if (n1 === 0 && type === "diviseur") {
          error("Cannot check if 0 is a divisor");
          return false;
        }

        let result;
        switch (type) {
          case "multiple":
            result = n1 % n2 === 0;
            break;
          case "diviseur":
            result = n2 % n1 === 0;
            break;
          default:
            error(`Unknown type: ${type}`);
            return false;
        }

        log(`multiple result: ${result}`);
        return result;
      } catch (e) {
        error("multiple error:", e);
        return false;
      }
    }

    sommechiffres(args) {
      try {
        let value = Math.abs(Cast.toNumber(args.NUM1));

        log(`sommechiffres(${args.NUM1})`);

        if (!Number.isInteger(value)) {
          error("sommechiffres requires integer input");
          return "";
        }

        let somme = 0;
        while (value) {
          somme += value % 10;
          value = Math.floor(value / 10);
        }

        log(`sommechiffres result: ${somme}`);
        return somme;
      } catch (e) {
        error("sommechiffres error:", e);
        return "";
      }
    }

    factorial(args) {
      try {
        const n = Cast.toNumber(args.NUM1);

        log(`factorial(${args.NUM1})`);

        if (!Number.isInteger(n)) {
          error("Factorial requires integer input");
          return "";
        }

        if (n < 0) {
          error("Factorial of negative number");
          return "";
        }

        if (n === 0 || n === 1) {
          return 1;
        }

        if (n > 170) {
          log("Factorial too large, returning Infinity");
          return Infinity;
        }

        let result = 1;
        for (let i = 2; i <= n; i++) {
          result *= i;
        }

        log(`factorial result: ${result}`);
        return result;
      } catch (e) {
        error("factorial error:", e);
        return "";
      }
    }

    // Helper function for GCD
    _pgcd(a, b) {
      try {
        if (b === 0) {
          return Math.abs(a);
        }
        return this._pgcd(b, a % b);
      } catch (e) {
        error("_pgcd error:", e);
        return 0;
      }
    }

    // Constants
    nombre_pi() {
      log("nombre_pi() = Math.PI");
      return Math.PI;
    }

    nombre_e() {
      log("nombre_e() = Math.E");
      return Math.E;
    }

    // String operations
    join(args) {
      try {
        const result =
          Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
        log(`join("${args.STRING1}", "${args.STRING2}") = "${result}"`);
        return result;
      } catch (e) {
        error("join error:", e);
        return "";
      }
    }

    letterOf(args) {
      try {
        const index = Cast.toNumber(args.LETTER) - 1;
        const str = Cast.toString(args.STRING);

        log(`letterOf(${args.LETTER}, "${args.STRING}")`);

        if (index < 0 || index >= str.length) {
          log("letterOf: index out of bounds");
          return "";
        }

        const result = str.charAt(index);
        log(`letterOf result: "${result}"`);
        return result;
      } catch (e) {
        error("letterOf error:", e);
        return "";
      }
    }

    length(args) {
      try {
        const result = Cast.toString(args.STRING).length;
        log(`length("${args.STRING}") = ${result}`);
        return result;
      } catch (e) {
        error("length error:", e);
        return 0;
      }
    }

    contains(args) {
      try {
        const str1 = Cast.toString(args.STRING1).toLowerCase();
        const str2 = Cast.toString(args.STRING2).toLowerCase();
        const result = str1.includes(str2);

        log(`contains("${args.STRING1}", "${args.STRING2}") = ${result}`);
        return result;
      } catch (e) {
        error("contains error:", e);
        return false;
      }
    }

    extract(args) {
      try {
        const from = Cast.toNumber(args.NUM1) - 1;
        const to = Cast.toNumber(args.NUM2) - from;
        const str = Cast.toString(args.STRING);

        log(`extract(${args.NUM1}, ${args.NUM2}, "${args.STRING}")`);

        let result;
        if (to < 0) {
          const rts = this._reverseString(str);
          result = rts.substr(rts.length - from - 1, 2 - to);
        } else {
          result = str.substr(from, to);
        }

        log(`extract result: "${result}"`);
        return result;
      } catch (e) {
        error("extract error:", e);
        return "";
      }
    }

    _reverseString(str) {
      try {
        if (str === "") return "";
        return this._reverseString(str.substr(1)) + str.charAt(0);
      } catch (e) {
        error("_reverseString error:", e);
        return "";
      }
    }
  }

  Scratch.extensions.register(new PlaneteMaths());
})(Scratch);
