# disp-* display showcase — repaired programs, circuits still missing

Recovered from lite's `feat/display-showcase` (session OOM-killed). The eight
programs were written against dialect verbs that DO NOT EXIST, so every one of
those lines was silently ignored — the examples were green and partly inert.

Repaired here (verified with `bw check`: 0 warnings on all eight):

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

## What is still missing — why these are NOT in index.json

Each intro promises a wired display ("a 128x64 OLED connected over I2C"), but
none has a `circuit.json`, and none has a `controller.json` either. With
neither, nothing renders: the Circuit tab is empty and the display verbs drive
a display that is not there. Adding them to the index in that state would ship
eight more examples that look complete and show nothing — the exact defect this
repair just undid.

To finish: author one `circuit.json` per example (MCU + the display part the
intro names, wired to the pins the program declares), add the index entries,
and confirm `node --test test/gallery.test.mjs` stays green. The programs and
pin declarations are correct and can be trusted as the wiring spec.
