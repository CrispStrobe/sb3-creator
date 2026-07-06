// Name: Arrays & Vectors
// ID: arrays
// Description: Advanced manipulation of arrays, vectors, and tensors.
// By: CrispStrobe <https://github.com/CrispStrobe>
// License: MPL-2.0
(function (Scratch) {
  "use strict";

  // ============================================================================
  // INTERNATIONALIZATION (i18n)
  //
  // Same module-level locale pattern as ev3dev_py_transpile.js and
  // planetemaths.js: detect once at gallery-load time, listen for changes,
  // resolve block text via the module-level t(key) at every getInfo() call.
  // ============================================================================

  const translations = {
    en: {
      "arrays.name": "Arrays & Tensors",
      "arrays.create1D": "create 1D array [NAME] from JSON [JSON]",
      "arrays.create2D": "create 2D array [NAME] from JSON [JSON]",
      "arrays.createEmpty": "create empty array [NAME]",
      "arrays.createZeros": "create array [NAME] of zeros with shape [SHAPE]",
      "arrays.createRange": "create array [NAME] from [START] to [END]",
      "arrays.get": "get [NAME] at [INDEX]",
      "arrays.get2D": "get [NAME] at row [ROW] col [COL]",
      "arrays.getMulti": "get [NAME] at indices [INDICES]",
      "arrays.set": "set [NAME] at [INDEX] to [VALUE]",
      "arrays.set2D": "set [NAME] at row [ROW] col [COL] to [VALUE]",
      "arrays.setMulti": "set [NAME] at indices [INDICES] to [VALUE]",
      "arrays.push": "push [VALUE] to [NAME]",
      "arrays.pop": "pop from [NAME]",
      "arrays.insert": "insert [VALUE] at [INDEX] in [NAME]",
      "arrays.remove": "remove at [INDEX] from [NAME]",
      "arrays.length": "length of [NAME]",
      "arrays.shape": "shape of [NAME]",
      "arrays.contains": "[NAME] contains [VALUE]",
      "arrays.indexOf": "index of [VALUE] in [NAME]",
      "arrays.slice": "slice [NAME] from [START] to [END]",
      "arrays.getRow": "get row [ROW] from [NAME]",
      "arrays.getColumn": "get column [COL] from [NAME]",
      "arrays.map": "map [NAME] with function [FUNC]",
      "arrays.filter": "filter [NAME] with function [FUNC]",
      "arrays.reduce": "reduce [NAME] with function [FUNC] initial [INIT]",
      "arrays.sort": "sort [NAME] [ORDER]",
      "arrays.reverse": "reverse [NAME]",
      "arrays.sum": "sum of [NAME]",
      "arrays.mean": "mean of [NAME]",
      "arrays.min": "min of [NAME]",
      "arrays.max": "max of [NAME]",
      "arrays.transpose": "transpose [NAME]",
      "arrays.flatten": "flatten [NAME]",
      "arrays.reshape": "reshape [NAME] to [SHAPE]",
      "arrays.toJSON": "convert [NAME] to JSON",
      "arrays.toString": "convert [NAME] to string",
      "arrays.delete": "delete array [NAME]",
      "arrays.listAll": "list all arrays",
      "arrays.ascending": "ascending",
      "arrays.descending": "descending",
    },
    de: {
      "arrays.name": "Arrays & Tensoren",
      "arrays.create1D": "1D-Array [NAME] aus JSON [JSON] erstellen",
      "arrays.create2D": "2D-Array [NAME] aus JSON [JSON] erstellen",
      "arrays.createEmpty": "leeres Array [NAME] erstellen",
      "arrays.createZeros":
        "Array [NAME] aus Nullen mit Form [SHAPE] erstellen",
      "arrays.createRange": "Array [NAME] von [START] bis [END] erstellen",
      "arrays.get": "[NAME] an [INDEX]",
      "arrays.get2D": "[NAME] an Zeile [ROW] Spalte [COL]",
      "arrays.getMulti": "[NAME] an Indizes [INDICES]",
      "arrays.set": "[NAME] an [INDEX] auf [VALUE] setzen",
      "arrays.set2D": "[NAME] an Zeile [ROW] Spalte [COL] auf [VALUE] setzen",
      "arrays.setMulti": "[NAME] an Indizes [INDICES] auf [VALUE] setzen",
      "arrays.push": "[VALUE] an [NAME] anhängen",
      "arrays.pop": "letztes Element aus [NAME] entfernen",
      "arrays.insert": "[VALUE] an [INDEX] in [NAME] einfügen",
      "arrays.remove": "an [INDEX] aus [NAME] entfernen",
      "arrays.length": "Länge von [NAME]",
      "arrays.shape": "Form von [NAME]",
      "arrays.contains": "[NAME] enthält [VALUE]",
      "arrays.indexOf": "Index von [VALUE] in [NAME]",
      "arrays.slice": "Ausschnitt von [NAME] von [START] bis [END]",
      "arrays.getRow": "Zeile [ROW] aus [NAME]",
      "arrays.getColumn": "Spalte [COL] aus [NAME]",
      "arrays.map": "[NAME] mit Funktion [FUNC] abbilden",
      "arrays.filter": "[NAME] mit Funktion [FUNC] filtern",
      "arrays.reduce":
        "[NAME] mit Funktion [FUNC] und Startwert [INIT] reduzieren",
      "arrays.sort": "[NAME] [ORDER] sortieren",
      "arrays.reverse": "[NAME] umkehren",
      "arrays.sum": "Summe von [NAME]",
      "arrays.mean": "Mittelwert von [NAME]",
      "arrays.min": "Minimum von [NAME]",
      "arrays.max": "Maximum von [NAME]",
      "arrays.transpose": "[NAME] transponieren",
      "arrays.flatten": "[NAME] abflachen",
      "arrays.reshape": "[NAME] zu [SHAPE] umformen",
      "arrays.toJSON": "[NAME] zu JSON konvertieren",
      "arrays.toString": "[NAME] zu Zeichenkette konvertieren",
      "arrays.delete": "Array [NAME] löschen",
      "arrays.listAll": "alle Arrays auflisten",
      "arrays.ascending": "aufsteigend",
      "arrays.descending": "absteigend",
    },
    fr: {
      "arrays.name": "Tableaux et Tenseurs",
      "arrays.create1D": "créer tableau 1D [NAME] depuis JSON [JSON]",
      "arrays.create2D": "créer tableau 2D [NAME] depuis JSON [JSON]",
      "arrays.createEmpty": "créer tableau vide [NAME]",
      "arrays.createZeros": "créer tableau [NAME] de zéros avec forme [SHAPE]",
      "arrays.createRange": "créer tableau [NAME] de [START] à [END]",
      "arrays.get": "obtenir [NAME] à [INDEX]",
      "arrays.get2D": "obtenir [NAME] à ligne [ROW] colonne [COL]",
      "arrays.getMulti": "obtenir [NAME] aux indices [INDICES]",
      "arrays.set": "définir [NAME] à [INDEX] = [VALUE]",
      "arrays.set2D": "définir [NAME] à ligne [ROW] colonne [COL] = [VALUE]",
      "arrays.setMulti": "définir [NAME] aux indices [INDICES] = [VALUE]",
      "arrays.push": "ajouter [VALUE] à [NAME]",
      "arrays.pop": "retirer dernier élément de [NAME]",
      "arrays.insert": "insérer [VALUE] à [INDEX] dans [NAME]",
      "arrays.remove": "supprimer à [INDEX] de [NAME]",
      "arrays.length": "longueur de [NAME]",
      "arrays.shape": "forme de [NAME]",
      "arrays.contains": "[NAME] contient [VALUE]",
      "arrays.indexOf": "index de [VALUE] dans [NAME]",
      "arrays.slice": "extraire [NAME] de [START] à [END]",
      "arrays.getRow": "ligne [ROW] de [NAME]",
      "arrays.getColumn": "colonne [COL] de [NAME]",
      "arrays.map": "appliquer fonction [FUNC] à [NAME]",
      "arrays.filter": "filtrer [NAME] avec fonction [FUNC]",
      "arrays.reduce": "réduire [NAME] avec fonction [FUNC] initial [INIT]",
      "arrays.sort": "trier [NAME] [ORDER]",
      "arrays.reverse": "inverser [NAME]",
      "arrays.sum": "somme de [NAME]",
      "arrays.mean": "moyenne de [NAME]",
      "arrays.min": "minimum de [NAME]",
      "arrays.max": "maximum de [NAME]",
      "arrays.transpose": "transposer [NAME]",
      "arrays.flatten": "aplatir [NAME]",
      "arrays.reshape": "remodeler [NAME] en [SHAPE]",
      "arrays.toJSON": "convertir [NAME] en JSON",
      "arrays.toString": "convertir [NAME] en chaîne",
      "arrays.delete": "supprimer tableau [NAME]",
      "arrays.listAll": "lister tous les tableaux",
      "arrays.ascending": "croissant",
      "arrays.descending": "décroissant",
    },
  };

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
    let lastKnownLocale = null;
    setInterval(() => {
      try {
        if (window.ReduxStore?.getState) {
          const locale = window.ReduxStore.getState().locales?.locale;
          if (locale && locale !== lastKnownLocale) {
            lastKnownLocale = locale;
            const lower = locale.toLowerCase();
            const newLang = lower.startsWith("de")
              ? "de"
              : lower.startsWith("fr")
                ? "fr"
                : "en";
            if (newLang !== currentLang) currentLang = newLang;
          }
        }
      } catch (e) {
        /* ignore */
      }
    }, 1000);
  }

  function t(key, defaultValue) {
    const tr = translations[currentLang];
    if (tr && tr[key]) return tr[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return defaultValue !== undefined ? defaultValue : key;
  }

  // Storage for arrays (keyed by name)
  const arrays = {};
  let _nextTempId = 0;

  class ArrayExtension {
    getInfo() {
      return {
        id: "arrays",
        name: t("arrays.name"),
        color1: "#FF6680",
        color2: "#FF4D6A",
        color3: "#FF3355",
        blocks: [
          {
            opcode: "create1D",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.create1D"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              JSON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[1,2,3,4,5]",
              },
            },
          },
          {
            opcode: "create2D",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.create2D"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              JSON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[[1,2],[3,4]]",
              },
            },
          },
          {
            opcode: "createEmpty",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.createEmpty"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "createZeros",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.createZeros"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "zeros",
              },
              SHAPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[3,3]",
              },
            },
          },
          {
            opcode: "createRange",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.createRange"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "range",
              },
              START: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              END: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 },
            },
          },
          "---",
          {
            opcode: "get",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.get"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
            },
          },
          {
            opcode: "get2D",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.get2D"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "getMulti",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.getMulti"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tensor",
              },
              INDICES: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[0,1,2]",
              },
            },
          },
          "---",
          {
            opcode: "set",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.set"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "set2D",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.set2D"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "setMulti",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.setMulti"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tensor",
              },
              INDICES: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[0,1,2]",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          "---",
          {
            opcode: "push",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.push"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "pop",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.pop"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "insert",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.insert"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "42" },
            },
          },
          {
            opcode: "remove",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.remove"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          "---",
          {
            opcode: "length",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.length"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "shape",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.shape"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "contains",
            blockType: Scratch.BlockType.BOOLEAN,
            text: t("arrays.contains"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "5" },
            },
          },
          {
            opcode: "indexOf",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.indexOf"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: "5" },
            },
          },
          "---",
          {
            opcode: "slice",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.slice"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              START: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              END: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
            },
          },
          {
            opcode: "getRow",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.getRow"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              ROW: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          {
            opcode: "getColumn",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.getColumn"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
              COL: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
            },
          },
          "---",
          {
            opcode: "map",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.map"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x => x * 2",
              },
            },
          },
          {
            opcode: "filter",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.filter"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "x => x > 5",
              },
            },
          },
          {
            opcode: "reduce",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.reduce"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              FUNC: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "(acc,x) => acc+x",
              },
              INIT: { type: Scratch.ArgumentType.STRING, defaultValue: "0" },
            },
          },
          {
            opcode: "sort",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.sort"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              ORDER: { type: Scratch.ArgumentType.STRING, menu: "sortOrder" },
            },
          },
          {
            opcode: "reverse",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.reverse"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          "---",
          {
            opcode: "sum",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.sum"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "mean",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.mean"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "min",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.min"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "max",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.max"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          "---",
          {
            opcode: "transpose",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.transpose"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "flatten",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.flatten"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "matrix",
              },
            },
          },
          {
            opcode: "reshape",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.reshape"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
              SHAPE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[3,3]",
              },
            },
          },
          "---",
          {
            opcode: "toJSON",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.toJSON"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "toString",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.toString"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "delete",
            blockType: Scratch.BlockType.COMMAND,
            text: t("arrays.delete"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "myArray",
              },
            },
          },
          {
            opcode: "listAll",
            blockType: Scratch.BlockType.REPORTER,
            text: t("arrays.listAll"),
          },
        ],
        menus: {
          sortOrder: {
            acceptReporters: true,
            items: [
              { text: t("arrays.ascending"), value: "ascending" },
              { text: t("arrays.descending"), value: "descending" },
            ],
          },
        },
      };
    }

    // Helper to parse value (try number, then JSON, then string)
    parseValue(val) {
      if (val === "") return "";
      const num = Number(val);
      if (!isNaN(num)) return num;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    // Create arrays
    create1D(args) {
      try {
        arrays[args.NAME] = JSON.parse(args.JSON);
      } catch (e) {
        arrays[args.NAME] = [];
      }
    }

    create2D(args) {
      try {
        arrays[args.NAME] = JSON.parse(args.JSON);
      } catch (e) {
        arrays[args.NAME] = [[]];
      }
    }

    createEmpty(args) {
      arrays[args.NAME] = [];
    }

    createZeros(args) {
      try {
        const shape = JSON.parse(args.SHAPE);
        const createNDArray = (dims, index = 0) => {
          if (index === dims.length - 1) {
            return new Array(dims[index]).fill(0);
          }
          return new Array(dims[index])
            .fill(null)
            .map(() => createNDArray(dims, index + 1));
        };
        arrays[args.NAME] = createNDArray(shape);
      } catch (e) {
        arrays[args.NAME] = [];
      }
    }

    createRange(args) {
      const start = Number(args.START);
      const end = Number(args.END);
      const arr = [];
      for (let i = start; i <= end; i++) {
        arr.push(i);
      }
      arrays[args.NAME] = arr;
    }

    // Get/Set operations
    get(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      const idx = Number(args.INDEX);
      return JSON.stringify(arr[idx]);
    }

    get2D(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[args.ROW]) return "";
      return arr[args.ROW][args.COL];
    }

    getMulti(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      try {
        const indices = JSON.parse(args.INDICES);
        let result = arr;
        for (const idx of indices) {
          result = result[idx];
        }
        return typeof result === "object" ? JSON.stringify(result) : result;
      } catch (e) {
        return "";
      }
    }

    set(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      const idx = Number(args.INDEX);
      arr[idx] = this.parseValue(args.VALUE);
    }

    set2D(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      if (!arr[args.ROW]) arr[args.ROW] = [];
      arr[args.ROW][args.COL] = this.parseValue(args.VALUE);
    }

    setMulti(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      try {
        const indices = JSON.parse(args.INDICES);
        let target = arr;
        for (let i = 0; i < indices.length - 1; i++) {
          target = target[indices[i]];
        }
        target[indices[indices.length - 1]] = this.parseValue(args.VALUE);
      } catch (e) {
        // ignore
      }
    }

    // Array operations
    push(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.push(this.parseValue(args.VALUE));
    }

    pop(args) {
      const arr = arrays[args.NAME];
      if (!arr || arr.length === 0) return "";
      return arr.pop();
    }

    insert(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.splice(Number(args.INDEX), 0, this.parseValue(args.VALUE));
    }

    remove(args) {
      const arr = arrays[args.NAME];
      if (!arr) return;
      arr.splice(Number(args.INDEX), 1);
    }

    // Info operations
    length(args) {
      const arr = arrays[args.NAME];
      return arr ? arr.length : 0;
    }

    shape(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";

      const getShape = (a) => {
        if (!Array.isArray(a)) return [];
        const shape = [a.length];
        if (a.length > 0 && Array.isArray(a[0])) {
          return shape.concat(getShape(a[0]));
        }
        return shape;
      };

      return JSON.stringify(getShape(arr));
    }

    contains(args) {
      const arr = arrays[args.NAME];
      if (!arr) return false;
      const val = this.parseValue(args.VALUE);
      return arr.includes(val);
    }

    indexOf(args) {
      const arr = arrays[args.NAME];
      if (!arr) return -1;
      const val = this.parseValue(args.VALUE);
      return arr.indexOf(val);
    }

    // Slicing and selection
    slice(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const result = arr.slice(Number(args.START), Number(args.END));
      return JSON.stringify(result);
    }

    getRow(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[args.ROW]) return "[]";
      return JSON.stringify(arr[args.ROW]);
    }

    getColumn(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const col = Number(args.COL);
      const result = arr.map((row) => row[col]);
      return JSON.stringify(result);
    }

    // Functional operations
    map(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        // new Function instead of eval: still compiles user JS (this is the
        // feature — user-typed arrow functions for map/filter/reduce blocks)
        // but the resulting fn only sees globals, not this method's locals.
        // eslint-disable-next-line no-new-func
        const func = new Function(`return (${args.FUNC});`)();
        const result = arr.map(func);
        return JSON.stringify(result);
      } catch (e) {
        return "[]";
      }
    }

    filter(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        // eslint-disable-next-line no-new-func
        const func = new Function(`return (${args.FUNC});`)();
        const result = arr.filter(func);
        return JSON.stringify(result);
      } catch (e) {
        return "[]";
      }
    }

    reduce(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "";
      try {
        // eslint-disable-next-line no-new-func
        const func = new Function(`return (${args.FUNC});`)();
        const init = this.parseValue(args.INIT);
        return arr.reduce(func, init);
      } catch (e) {
        return "";
      }
    }

    sort(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const sorted = [...arr].sort((a, b) => {
        if (args.ORDER === "ascending") return a - b;
        return b - a;
      });
      return JSON.stringify(sorted);
    }

    reverse(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      return JSON.stringify([...arr].reverse());
    }

    // Math operations
    sum(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return flatten(arr).reduce((sum, x) => sum + Number(x || 0), 0);
    }

    mean(args) {
      const arr = arrays[args.NAME];
      if (!arr || arr.length === 0) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      const flat = flatten(arr);
      return flat.reduce((sum, x) => sum + Number(x || 0), 0) / flat.length;
    }

    min(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return Math.min(...flatten(arr).map(Number));
    }

    max(args) {
      const arr = arrays[args.NAME];
      if (!arr) return 0;
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return Math.max(...flatten(arr).map(Number));
    }

    // Advanced operations
    transpose(args) {
      const arr = arrays[args.NAME];
      if (!arr || !arr[0]) return "[]";
      const result = arr[0].map((_, i) => arr.map((row) => row[i]));
      return JSON.stringify(result);
    }

    flatten(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
      return JSON.stringify(flatten(arr));
    }

    reshape(args) {
      const arr = arrays[args.NAME];
      if (!arr) return "[]";
      try {
        const shape = JSON.parse(args.SHAPE);
        const flatten = (a) => (Array.isArray(a) ? a.flatMap(flatten) : [a]);
        const flat = flatten(arr);

        const reshape = (data, dims, index = 0) => {
          if (index === dims.length - 1) {
            return data.splice(0, dims[index]);
          }
          const result = [];
          for (let i = 0; i < dims[index]; i++) {
            result.push(reshape(data, dims, index + 1));
          }
          return result;
        };

        return JSON.stringify(reshape([...flat], shape));
      } catch (e) {
        return "[]";
      }
    }

    // Utility
    toJSON(args) {
      const arr = arrays[args.NAME];
      return arr ? JSON.stringify(arr) : "[]";
    }

    toString(args) {
      const arr = arrays[args.NAME];
      return arr ? arr.toString() : "";
    }

    delete(args) {
      delete arrays[args.NAME];
    }

    listAll() {
      return JSON.stringify(Object.keys(arrays));
    }
  }

  Scratch.extensions.register(new ArrayExtension());
})(Scratch);
