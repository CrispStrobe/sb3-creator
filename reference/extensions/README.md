# Pinned extension sources (read-only reference)

These are **canonical copies** of Brickwright's gallery extensions, the **source of truth** for
their opcodes and semantics when mapping them to Python/JavaScript in the codegen
(`src/utils/sb3Creator.js` — `pyRep`/`jsRep`/`pyCond`/`jsCond`).

Origin: **github.com/CrispStrobe/extensions** → `extensions/CrispStrobe/*.js`.
The fork loads the registry at runtime from
`crispstrobe.github.io/extensions/generated-metadata/extensions-v0.json`
(`extension-library.jsx`; URL = `https://crispstrobe.github.io/extensions/${slug}.js`).

| file | id | name | codegen |
|------|----|------|---------|
| `planetemaths.js` | `planetemaths` | Planète Maths | ✅ mapped (pure math) |
| `arrays.js` | `arrays` | Arrays & Vectors | ⏳ next (named-array registry) |
| `gamepad.js` | `gamepad` | Gamepad | ⏳ runtime input (shim) |

**Gotcha:** in `planetemaths.js` the boolean opcode *names* are misnomers — `gt` computes
`Cast.compare(NUM1, NUM2) < 0`, i.e. **NUM1 < NUM2**. Always map by the method body, not the
opcode name or the (localized) display label.

To refresh: re-fetch from the repo above. Do not edit these by hand.
