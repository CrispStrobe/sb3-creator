# sb3-creator — the BrickWright compiler

A **bidirectional** compiler between the representations a Scratch project can
take. It began as a one-way tool that turned pseudocode into a downloadable
`.sb3`; it is now six representations and five readers, and the round trips are
tested rather than hoped for.

**▶ Live editor: <https://crispstrobe.github.io/sb3-creator/>** — nothing to
install; write pseudocode, download the `.sb3`.

## What it converts

```
                    ┌──────────────┐
   pseudocode  ⇄    │              │  ⇄  Python        (host, Scratch runtime)
   Scratch blocks ⇄ │  BrickWright │  ⇄  JavaScript    (host, Scratch runtime)
   (.sb3)           │      IR      │  ⇄  C for the host (portable C99)
                    │              │  →  C for an 8051  (SDCC + <stc12.h>)
                    └──────────────┘  →  MicroPython    (micro:bit, Pico)
```

Five code generators — `generatePython`, `generateJavaScript`, `generateC`
(device), `generateHostC`, and pseudocode itself — and five readers that go the
other way: `cToPseudocode`, `cHostToPseudocode`, `pythonToPseudocode`,
`javascriptToPseudocode`, `micropythonToPseudocode`.

**The point of the readers is that generated code is not a dead end.** Edit the
C a program compiled to, import it back, and you get blocks again — a changed
`delay_ms(400)` returns as `wait 0.4 seconds`, with the whole program intact.

What makes that safe to act on is the second half: code the reader cannot
represent is **named** rather than dropped in silence. It used to drop quietly,
and a hand-added helper function would vanish with nothing reported — which is
worse than a limitation, because the program looked like it round-tripped. Now
each declined function, declaration and statement is reported by name. One
remaining gap is known and recorded rather than papered over: a bare struct
declaration with no uses still goes unreported, though every statement that
touches it warns.

## Two C targets, deliberately

| target | for | shape |
|---|---|---|
| **host C** | a Scratch program that happens to be written in C — sprites, lists, `join` | portable C99 with a tagged-union value type and a runtime shim generated from the same table the Python and JS targets use, so coverage cannot drift between them |
| **device C** | an 8051 with 248 bytes of stack | no allocation, no floats, statically allocated variables, and several `WHEN` scripts lowered to cooperative state machines over a 1 ms Timer-0 tick |

Which one you get is decided by the project, not by a flag: a program that
declares pins is a device program.

## Scale

| | |
|---|---|
| examples in the gallery | **74**, each parsed, compiled, round-tripped and simulated by the suite |
| tests | **~1500**, node's runner, no browser needed for the bulk |
| cross-cutting contracts in `reference/` | 12 |
| `sb3Creator.js` | ~7,400 lines |

`reference/` holds the documents more than one repo depends on — the simulation
contract, the C target's lowering rules, the debugger UI's capability matrix,
the component library the circuit simulator must support. They are contracts
rather than notes: other repos cite them instead of re-deriving them.

## 🚀 Quickstart

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

3.  **Compile from the command line** (no browser):
    ```bash
    node bin/sb3c.mjs my-game.txt my-game.sb3   # or: npx sb3c ...
    node bin/sb3c.mjs --check my-game.txt        # parse + integrity check only
    ```

4.  **Run the tests**:
    ```bash
    npm test
    ```
    Runs three suites, no browser required:
    - `test/unit.test.mjs` / `test/features.test.mjs` — per-feature block assertions.
    - `test/live.test.mjs` — compiles every example to a real `.sb3`, unzips it, and
      validates the project graph and that all referenced assets exist.
    - `test/vm.test.mjs` — loads every example into the **real headless Scratch VM**
      (`scratch-vm`) and executes it, verifying feature logic (custom blocks, operator
      precedence, list math, clone creation) by reading back runtime state.

    A separate **browser render suite** (opt-in, needs Chromium) runs the games with the
    real WebGL renderer so that `touching`/collision works, and writes gameplay
    screenshots to `test/browser/shots/`:
    ```bash
    npx playwright install chromium   # once
    npm run test:browser
    ```

---

## 🧩 Language

The compiler lives in [`src/utils/sb3Creator.js`](src/utils/sb3Creator.js). Open the
in-app **Syntax Reference** for the full list; highlights:

- **Structure:** `SPRITE Name:`, `STAGE:`, `# comments`, and explicit scoping with
  `GLOBAL x`, `LOCAL x`, `LIST items` (overrides the legacy magic-name defaults).
- **Assets:** `COSTUME frame2` adds an animation frame, `BACKDROP night` a stage backdrop,
  and `SOUND jump 660` a generated tone (frequency optional). Parser warnings are tagged
  with their source line number, and typo'd sprite references are flagged.
- **Events:** `WHEN flag clicked:`, `WHEN <key> key pressed:`, `WHEN sprite clicked:`,
  `WHEN I receive "msg":`, `WHEN I start as a clone:`.
- **Control:** `FOREVER`, `REPEAT n`, `REPEAT UNTIL cond`, `IF … THEN` / `ELSE`,
  `wait until cond`, `stop all | this script | other scripts in sprite`.
- **Clones & messaging:** `create clone of myself|Sprite`, `delete this clone`,
  `broadcast "m"`, `broadcast "m" and wait`.
- **Expressions:** parentheses and correct precedence, `+ - * /`, `mod`,
  `pick random a to b`, `round`, `sqrt of`, `abs of`, `join`, `letter n of`,
  `length of`, and reporters like `x position`, `size`, `timer`, `answer`,
  `item n of list`, `x position of Sprite` (sensing-of), `current year`, `day of week`.
- **Conditions:** `< <= > >= =`, `and` / `or` / `not`, `touching X`,
  `touching color #hex`, `key X pressed?`, `mouse down?`, `list contains v`.
- **Lists:** `add`, `delete n of`, `delete all of`, `insert … at … of`,
  `replace item … of … with …`, `show/hide list`.
- **Custom blocks:** `DEFINE [FAST] name (arg) <boolArg>:` defines a reusable block
  (FAST = run without screen refresh); call it by name, e.g. `draw box 3 4`. Parameters
  are usable in the body.
- **Music:** `play note`, `play drum`, `rest for … beats`, `set/change tempo`.

Example games in the dropdown include **snake**, a clone-based **snake_pro**,
**breakout**, **bomberman**, and a list-and-custom-block **tetris**.

See [`PLAN.md`](PLAN.md) for the full list of bugs fixed and features added.

---

## 🌐 Deployment

The live editor is published by the `pages` job in
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) on every push to `main`, and only
after lint, the unit/VM suites and the WebGL browser tests pass — so the page cannot be
replaced by a build that does not work. It used to be a manual `npm run deploy` to a
`gh-pages` branch, which is how it ended up close to a year behind `main`.

The instructions below are for deploying your *own* copy.

### Vercel (Recommended)

1.  **Push to GitHub**: Create a new repository on GitHub and push your code.
2.  **Import to Vercel**: Log in to your Vercel account, choose "Add New... -> Project", and select your GitHub repository.
3.  **Deploy**: Vercel will automatically detect the correct settings for a Vite project. Click "Deploy".

### GitHub Pages

1.  **Update `package.json`**:
    Open `package.json` and edit the `homepage` field to match your GitHub Pages URL format:
    ```json
    "homepage": "https://crispstrobe.github.io/sb3-creator/",
    ```

2.  **Run the Deploy Script**:
    In your terminal, run the following command:
    ```bash
    npm run deploy
    ```
    This will build the project and deploy it to the `gh-pages` branch on your repository.

3.  **Enable GitHub Pages**:
    In your GitHub repository settings, navigate to the "Pages" section and set the source to deploy from the `gh-pages` branch.

## Licence

MPL-2.0 — see [LICENSE](LICENSE).

Attribution is required, and changes to these files stay open. The code may
still be combined into a larger work distributed under other terms, which is
what keeps app-store distribution possible.
