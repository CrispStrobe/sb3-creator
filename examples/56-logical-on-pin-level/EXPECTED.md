# 56-logical-on-pin-level — expected behaviour

## Logical program

Every supported target runs the same body: 500 ms logically on, 500 ms logically off, repeated forever. The period is 1 second and the duty cycle is 50%.

## Target-specific electrical contract

| target convention | generated `PIN` declaration | logical on level | generated LED path |
|---|---|---|---|
| STC12 quasi-bidirectional | `OUTPUT ACTIVE LOW` | LOW | VCC → resistor → LED → pin |
| push-pull MCU | `OUTPUT` | HIGH | pin → resistor → LED → GND |

The pin name and device clock also change to the target's supported values. The `WHEN`/`FOREVER` body must remain identical after retargeting.
Both the seated `circuit.<device>.json` bench and its board-free
`circuit-flat.<device>.json` twin must implement the same polarity. The flat
surface is included deliberately because an earlier polarity regression hid
there after the seated benches were already correct.

## Observable sequence

| time | logical LED state | physical pin level |
|---|---|---|
| 0–500 ms | on | LOW for active-low; HIGH for active-high |
| 500–1000 ms | off | HIGH for active-low; LOW for active-high |
| every next second | repeats | repeats |

Current and brightness are deliberately not compared across chip families: their supply voltages and output-stage models differ. The invariant is logical state plus matching polarity and wiring.
