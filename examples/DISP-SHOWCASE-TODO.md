# disp-* display showcase — DONE (2026-08-23)

Recovered from lite's `feat/display-showcase` (session OOM-killed). The eight
programs were written against dialect verbs that DO NOT EXIST, so every one of
those lines was silently ignored — the examples were green and partly inert.

Repaired (verified with `bw check`: 0 warnings on all eight):

| was written | the dialect's actual form |
| --- | --- |
| `oled cursor X Y on N` | `oled set cursor X Y on N` |
| `lcd cursor R C on N` | `lcd set cursor R C on N` |
| `set pixel X Y on N` | `set pixel X Y to V on N` |
| `set neopixel I r g b on N` | `set neopixel I to R r G g B b on N` |
| `if X > Y` + indented body | `IF X > Y THEN:` + indented body |
| `PIN p = P2.0 ANALOG INPUT` | `PIN p = P1.3 ANALOG` |

The last one was not only syntax: `disp-bargraph` put its eight LEDs on P1.0–P1.7
while the STC12's ADC *is* P1, so the pot had nowhere to live. LEDs moved to P2.

## Circuits authored — seven examples, now enrolled

One `circuit.json` each: MCU plus the display the intro names, wired to the pins
the program **declares**. The PIN lines were the wiring spec.

| example | display part | wiring |
| --- | --- | --- |
| `disp-oled` | `ssd1306` | I²C on P2.1/P2.2, both pull-ups |
| `disp-mono-lcd` | `ssd1306` | I²C on P2.1/P2.2, both pull-ups |
| `disp-lcd` | `char_lcd_i2c` | I²C on P2.1/P2.2, both pull-ups |
| `disp-led-matrix` | `max7219` | SPI din P1.5, cs P1.6, clk P1.7 |
| `disp-rgb-light` | 3 × `neopixel` | chained din→dout→din from P1.0 |
| `disp-sevenseg` | `seven_segment` | P1.0–P1.6, 220 Ω per segment, common to GND |
| `disp-bargraph` | `bargraph` + `potentiometer` | ACTIVE LOW: anodes at VCC via 470 Ω, cathodes to P2.0–P2.7; pot wiper to P1.3 |

Three judgement calls worth keeping:

- **`disp-mono-lcd` is an SSD1306, not an ST7920.** Its program says so in as
  many words ("SSD1306 as mono_lcd"). The `st7920` part is SPI (`cs/sclk/sid`)
  and would match neither the declared `sda`/`scl` nor the `oled` verbs.
- **`disp-led-matrix` has no separate `matrix8x8`.** The `max7219` part is
  driver *and* matrix in one — the importers map `wokwi-max7219-matrix` to it.
  A second matrix part would be a display nothing drives.
- **`disp-rgb-light` chains its three pixels.** The program addresses 0/1/2,
  and for WS2812B that *is* chain order, so the chain is the honest wiring.

The I²C circuits all carry both pull-ups: without them neither line can ever be
pulled high, and a bus drawn without them is a bus that cannot work.

## `disp-simplevga` — removed, not finished

It was a strict **subset** of the already-shipped `eater6502-vdp-hello`: same
`DEVICE EATER6502`, same `MAP`, same `CHIP vdp1 = TMS9918 AT $4000`, only
lacking `via1`/`acia1`. Neither has a `STAGE` — declaration-only is the normal
machine-bench form, and `eater6502-vdp-hello` ships that way as `kind: "full"`
with a full 14-part canonical bench including `tms9918`.

So it was not blocked on a part or on the VDP widget its own EXPECTED.md waited
for; it was a thinner duplicate of an example the gallery already has. Enrolling
it would have shipped a second, poorer copy. Removed on the owner's call.

## Verification

- `node --test test/gallery.test.mjs` — **2,705 tests, 2,672 pass, 0 fail**
  (from 2,715 / 2,673 / **1 fail** before: the failure was the eight
  unenrolled directories).
- Both bw-circuit-ui correspondence gates run over a corpus including these
  circuits: **1,041 discovered, 1,041 analysed, 0 errored, 0 soundness
  failures**, completeness unchanged at the same 3 known pc-series circuits,
  24,558 rendered pairs compared.
- Every wire endpoint checked against the part sidecars — no circuit names a
  terminal its part does not have.
