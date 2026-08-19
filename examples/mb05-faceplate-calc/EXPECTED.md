# Expected behaviour

An integer four-function calculator: 17 button widgets drive an OLED display
widget. Each button writes its variable to 1 on press; the program consumes it
and updates `oled_text`. The dialect has no string-expression evaluator, so
the program keeps a running accumulator (`acc`), the number being typed
(`entry`), and the pending operator (`op`) rather than building and eval-ing a
string.

- Load the example, open the Controller view: 17 button widgets bound to
  `btn0`..`btn9`, `btnAdd`/`btnSub`/`btnMul`/`btnDiv`, `btnEq`, `btnC`,
  `btnDot`, and an OLED widget bound to `oled_text`.
- Green flag: the OLED shows `0`.
- Press `6`, `*`, `7`, `=`: the OLED shows `42`.
- Press `+`, `8`, `=`: continues from `42` to `50`.
- `C` resets to `0`. The decimal point is a no-op (integer calculator).
- The loop is live: button widget → `btnN` → running program → `oled_text` →
  OLED face.

**Not verified on hardware** — behaviour is derived from the source under
emulation, not measured on a bench.
