# Expected behaviour

The simple variant of `70-calculator`: `C` clears the entry, and the program
never says `oled show`, so it uses the draw-and-flush OLED driver.

- Boot: the OLED shows `RECHNER` and `0`.
- Press `5`: display shows `5`.
- Press `+`: the upper line shows the pending `5 +`; display still `5`.
- Press `3`: display shows `3`.
- Press `EXE`: display shows `8`.
- Press `C`: the entry returns to `0` and the pending operation is kept.
- Press `AC`: everything resets — accumulator, operator, entry.

**Not verified on hardware.** The DEL/buffered variant (`70-calculator`) is
the one that has run on a real Pico. This program is kept as the readable
original and as the pre-buffered-driver reference; its behaviour above is
derived from the source, not measured on a bench.

Division normalises an integral result back to an int, so `6 / 3 EXE` shows
`2` rather than `2.0`, and division by zero sets the error state.

```assert
# Supply rail: identical circuit to 70-calculator, so the same rail assertion
net vcc1.vcc V 5.00 +-0.01
```
