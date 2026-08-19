# Expected behaviour

The A2 calculator as a faceplate: a keypad widget replaces the 4×4 matrix
scan and an LCD widget replaces the 8-digit display. Input and output flow
through Scratch variables — no pin wiring.

- Load the example, open the Controller view: a keypad widget (writes
  `key_input` on press) and an LCD widget (`lcd_text`), plus the side buttons
  `C`/`btnC`, `DEL`/`btnBack`, `+/-`/`btnSign`, `M`/`btnMem`.
- Green flag: the LCD shows `0`.
- Press `5`: LCD shows `5`. Press `+`: the pending operator is stored and the
  LCD shows the accumulator `5`. Press `3`: LCD shows `3`. Press `=`: LCD `8`.
- `C` clears everything (accumulator, entry, operator). `DEL` drops the last
  digit of the entry. `+/-` negates it. `M` recalls the memory value.
- Integer arithmetic; division normalises an integral result back to an int.
- The loop is live: keypad widget → `key_input` → running program →
  `lcd_text` → LCD face, all in the browser.

**Not verified on hardware** — behaviour is derived from the source under
emulation, not measured on a bench.
