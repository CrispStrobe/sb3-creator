# SB3 Creator

This project converts a custom pseudocode language into a downloadable Scratch 3.0 (`.sb3`) project file. It's built with React and Vite.

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