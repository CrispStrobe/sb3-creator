# Expected behaviour

The DEL/buffered variant: `DEL` is a backspace over the last digit, and the
frame ends in `oled show`, so the driver buffers and blits once.

- Boot: the OLED shows `RECHNER`, a rule under it, and `0` right-aligned.
- Press `5`: display shows `5`.
- Press `+`: the upper line shows the pending `5 +`; display still `5`.
- Press `3`: display shows `3`.
- Press `EXE`: display shows `8`.
- Press `1` `2` `3` then `DEL`: display shows `12` — one digit removed, not
  the whole entry.
- `DEL` on a displayed RESULT zeroes it rather than editing it; the next
  digit starts a new number.
- Press `AC`: everything resets — accumulator, operator, entry.

Division normalises an integral result back to an int, so `6 / 3 EXE` shows
`2` and not `2.0`, and division by zero sets the error state.

**Verified on hardware (2026-08-19), partially.** The program was flashed to
a real Pico with `bw flash`, the on-device `main.py` is byte-identical to
`bw transpile --to micropython`, and the owner confirmed it working on the
bench. What is NOT independently confirmed is the later display revision —
the single blit per frame and the right-aligned entry line — which is
flashed and boots cleanly but has not been checked with a human eye.

For the pre-buffered original, see `70-calculator-simple`.

```assert
# Supply rail
net vcc1.vcc V 5.00 +-0.01
```
