# Component library — the parts a beginner circuit simulator must support

<!-- Lives here because three consumers need the same answer and none of them owns
     it: bw-parts draws the art, bw-board writes the device models, bw-circuit-ui
     places them. reference/ is where the cross-cutting contracts live. -->

The target set: **114 parts** in 11 categories, plus 67 prebuilt starter circuits listed at
the end. Compiled from the published component list of an established browser-based
circuit simulator, cross-checked against a second copy of the same list, and resolved to
real part numbers here.

The parts themselves belong to nobody — PCF8574, NE555, 74HC595, TMP36, L293D, WS2812B are
industry-standard components with public datasheets. What this file adds is the mapping
from a beginner-facing label to the actual part, and the evidence for each mapping.

## Reading the "Actual part" column

The source catalogue labels components by function, not by part number — "8-port I2C expander" rather than PCF8574. Often the real part is hiding in the thumbnail slug (`icPCF8574`), sometimes in the label itself (`Temperature Sensor [TMP36]`), and sometimes nowhere at all.

So the source of each identification is marked, because they are not equally solid:

| mark | means |
|---|---|
| `slug` | The catalogue's own asset name contains the part number. Not a guess. |
| `label` | The visible label names it. |
| standard | The catalogue names no part; this is the standard component for that function and behaviour. |
| **unverified** | No part is named and more than one plausible candidate exists. Do not rely on it. |
| *(blank)* | A generic component — a resistor is a resistor. |

## General

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Resistor | — |  | both |  |
| Capacitor | — |  | both |  |
| Polarized Capacitor | — |  | both |  |
| Diode | — |  | both |  |
| Zener Diode | — |  | both |  |
| Inductor | — |  | both |  |

## Input

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Pushbutton | — |  | both |  |
| Potentiometer | — |  | both |  |
| Slideswitch | — |  | both |  |
| Photoresistor | — |  | both |  |
| Photodiode | — |  | both |  |
| Ambient Light Sensor [Phototransistor] | **phototransistor** | `label` | both | The catalogue calls it an ambient light sensor. |
| Flex Sensor | **flex resistor** | standard | both | Resistance rises when bent; use as one half of a divider. |
| Force Sensor | **FSR** | standard | both | Force-sensitive resistor. Wildly non-linear. |
| IR sensor | — |  | both |  |
| Ultrasonic Distance Sensor | **Parallax PING)))** | standard | both | The 3-pin variant: one pin is both trigger and echo. |
| Ultrasonic Distance Sensor (4-pin) | — |  | both |  |
| PIR Sensor | **HC-SR501** | standard | both | The usual PIR module. The catalogue does not name it. |
| Soil Moisture Sensor | **resistive probe** | standard | **picker only** | Generic. The capacitive kind behaves differently and corrodes less. |
| Tilt Sensor | — |  | both |  |
| Temperature Sensor [TMP36] | **TMP36** | `label` | both | Analog, 10 mV/degC with a 500 mV offset at 0 degC. Not the LM35 — the offset differs. |
| Gas Sensor | **MQ-series** | standard | both | The catalogue tags it air/smoke/alcohol/methane, which spans MQ-2 / MQ-3 / MQ-4. No single part. |
| Keypad 4x4 | **4x4 matrix keypad** | standard | both | Generic membrane keypad — 8 lines, 4 rows x 4 columns, no controller. |
| DIP Switch DPST | — |  | both |  |
| DIP Switch SPST x 4 | — |  | both |  |
| DIP Switch SPST x 6 | — |  | both |  |
| Tilt Sensor 4-pin | **tilt/ball switch** | standard | **help page only** | A ball bridging contacts. Bouncy — debounce it. |

## Output

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| LED | — |  | both |  |
| LED RGB | — |  | both |  |
| Light bulb | — |  | both |  |
| NeoPixel | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Ring 12 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Ring 16 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Ring 24 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 4 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 6 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 8 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 10 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 12 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 16 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| NeoPixel Strip 20 | **WS2812B** | `slug` | both | "NeoPixel" is Adafruit's brand for WS2812/WS2812B addressable RGB LEDs. One wire, 800 kHz, timing-critical. |
| Vibration Motor | — |  | both |  |
| DC Motor | — |  | both |  |
| DC Motor with encoder | — |  | both |  |
| Micro Servo | **SG90-class** | standard | both | Standard 3-wire hobby servo, 50 Hz frame, 1-2 ms pulse. |
| Hobby Gearmotor | — |  | both |  |
| Piezo | — |  | both |  |
| IR remote | — |  | both |  |
| 7 Segment Display | — |  | both |  |
| LCD 16 x 2 | **HD44780** | standard | both | Every 16x2 character LCD is HD44780-compatible; that is the controller, not the module. |
| LCD 16 x 2 (I2C) | **HD44780 + PCF8574** | standard | **picker only** | The I2C backpack IS a PCF8574 driving the HD44780 in 4-bit mode — the same expander as the standalone part above. |
| 7-Segment Clock Display | **HT16K33-class** | **unverified** | **picker only** | The catalogue does not name it. 4-digit I2C clock displays are usually HT16K33 or TM1637; the two are NOT interchangeable. |
| NeoPixel Jewel | **WS2812B x7** | `slug` | **help page only** | Seven addressable pixels; same one-wire protocol as the strips. |
| DC Motor with Encoder (large) | **quadrature encoder motor** | standard | **help page only** | Two channels in quadrature give direction as well as counts. |

## Power

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| 9V Battery | — |  | both |  |
| 1.5V Battery | — |  | both |  |
| Coin Cell 3V Battery | — |  | both |  |
| Solar Cell | — |  | **picker only** |  |
| Potato Battery | — |  | both |  |
| Lemon Battery | — |  | both |  |

## Breadboards

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Breadboard | — |  | both |  |
| Breadboard Small | — |  | both |  |
| Breadboard Mini | — |  | both |  |

## Microcontrollers

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| micro:bit | **nRF51822 / nRF52833** | **unverified** | both | v1 is nRF51822, v2 nRF52833. The label does not say which the source catalogue models. |
| micro:bit with Breakout | — |  | both |  |
| Arduino Uno R3 | **ATmega328P** | standard | both | The Uno is the board; the MCU is the ATmega328P. |
| ATtiny | **ATtiny85** | **unverified** | both | The catalogue shows an 8-pin ATtiny; 85 is the usual one, but the label does not say. |

## Instruments

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Multimeter | — |  | both |  |
| Power Supply | — |  | both |  |
| Function Generator | — |  | both |  |
| Oscilloscope | — |  | both |  |

## Integrated Circuits

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Timer | **NE555** | `slug` | both | Bipolar original; CMOS equivalents TLC555 / LMC555 draw far less and swing rail-to-rail. |
| Dual Timer | **NE556** | `slug` | both | Two 555s in one 14-pin package. |
| 741 Operational Amplifier | **uA741** | `slug` | both | LM741 is the same part. Single supply is awkward; it cannot swing near either rail. |
| Quad comparator | **LM339** | `slug` | both | Open-collector output — needs a pull-up. Not an op-amp. |
| Dual comparator | **LM393** | `slug` | both | Open-collector, as LM339. |
| Optocoupler | **4N35** | `slug` | both | Phototransistor output, ~6-pin DIP. CTR is low; do not expect logic-speed switching. |

## Power Control

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| NPN Transistor (BJT) | — |  | both |  |
| PNP Transistor (BJT) | — |  | both |  |
| Small Signal nMOS Transistor | — |  | both |  |
| Small Signal pMOS Transistor | — |  | both |  |
| nMOS Transistor (MOSFET) | — |  | both |  |
| pMOS Transistor (MOSFET) | — |  | both |  |
| TIP120 | **TIP120** | `slug` | both | NPN Darlington. ~1.4 V Vbe(on) and ~2 V saturation — it runs hot where a logic-level MOSFET would not. |
| Relay SPDT | — |  | both |  |
| Relay DPDT | — |  | both |  |
| 5V Regulator [LM7805] | **LM7805** | `label` | both | Linear. Dropout ~2 V, so it needs >7 V in, and burns the difference as heat. |
| 3.3V Regulator [LD1117V33] | **LD1117V33** | `label` | both | Low-dropout, fixed 3.3 V. |
| H-bridge Motor Driver | **L293D** | `slug` | both | The D suffix is the one with the flyback diodes built in. L293 without D needs external diodes. |
| Pololu Simple Motor Controller | **Pololu Simple Motor Controller** | `label` | **help page only** | A board, not a chip. Takes USB/serial/RC/analog input. |

## Connectors

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| 8 Pin Header | — |  | both |  |
| USB standard A | — |  | both |  |

## Logic

Every part in this section is named by its slug, so none of these is a guess. They are all 74HC — the CMOS family. The same number in 74LS is the older TTL part: different thresholds, different drive, not a drop-in. A few of these (73, 75, 93) are TTL-era functions that were not all carried into HC, so check availability before designing one in.

| Catalogue label | Actual part | Part src | Listed in | Notes |
|---|---|---|---|---|
| Quad NAND gate | **74HC00** | `slug` | both |  |
| Quad NOR gate | **74HC02** | `slug` | both |  |
| Quad AND gate | **74HC08** | `slug` | both |  |
| Quad OR gate | **74HC32** | `slug` | both |  |
| Quad XOR gate | **74HC86** | `slug` | both |  |
| Hex Inverter | **74HC04** | `slug` | both |  |
| Inverting Schmitt Trigger | **74HC14** | `slug` | both | Schmitt inputs — the part to use for a slow or noisy edge that would make a plain gate oscillate. |
| Quad NAND Schmitt Trigger | **74HC132** | `slug` | both | NAND with Schmitt inputs; the classic one-gate oscillator. |
| Triple 3-Input NAND gate | **74HC10** | `slug` | both |  |
| Triple 3-Input AND gate | **74HC11** | `slug` | both |  |
| Triple 3-Input NOR gate | **74HC27** | `slug` | both |  |
| Dual 4-Input NAND gate | **74HC20** | `slug` | both |  |
| Dual 4-Input AND gate | **74HC21** | `slug` | both |  |
| Dual J-K Flip-Flop | **74HC73** | `slug` | both | JK with clear. A TTL-era function — check your supplier actually stocks the HC version. |
| Dual D Flip-Flop | **74HC74** | `slug` | both |  |
| 4-Bit Latch | **74HC75** | `slug` | both | Level-triggered latch, not edge-triggered. TTL-era function. |
| 4-Bit Binary Counter | **74HC93** | `slug` | both | Ripple counter, split into divide-by-2 and divide-by-8 that you cascade externally. TTL-era function. |
| 4-Bit Adder | **74HC283** | `slug` | both | Adds two 4-bit numbers with carry in and out. |
| 8-Bit Shift Register | **74HC595** | `slug` | both | Serial in, parallel out, with a separate latch clock so the outputs do not glitch while shifting. The one in src/09-shift-register. |
| Johnson Decade Counter | **74HC4017** | `slug` | both | Decade counter with ten decoded outputs, one high at a time — not a binary counter. |
| 7-Segment Decoder | **CD4511** | `slug` | both | BCD to 7-segment latch/decoder/driver. Common-cathode displays only. |
| 8-port I2C expander | **PCF8574** | `slug` | **picker only** | 8-bit I2C I/O expander. PCF8574A is the same chip on the alternate address range 0x38-0x3F. |

## Substituting a part that is not there

The catalogue's library is small on purpose, and its publisher's own guidance (2020) is to represent a missing component with a similar one rather than expect an exact match:

| You want | Substitute | Why, and the catch |
|---|---|---|
| Any 3-pin analog sensor | Potentiometer, or TMP36 | Both have power/ground/signal. They are not equivalent: a pot is purely resistive, while the TMP36 expects a regulated 2.7-5.5 V supply. |
| Any 2-pin analog sensor | Photoresistor | The only two-pin analog input available. The piezo is output-only in the source catalogue, so it cannot stand in. |
| Any digital high/low sensor | Pushbutton, slideswitch, DIP switch, tilt sensor, PIR | Reed switches, vibration switches and the like all reduce to a contact closing. Tilt and PIR simulate their own behaviour, so pick those when the timing matters. |
| Anything on I2C, SPI or a custom protocol | *No substitute* | You can paste the library into the sketch, but no component will answer it. |

Two caveats on that last row, because the article is from 2020 and the library has moved since. the source catalogue now ships three real I2C devices - the PCF8574 expander, the I2C 16x2 LCD and the I2C clock display - so "no I2C component exists" is no longer strictly true, though it still holds for an arbitrary I2C sensor of your choosing. The same drift explains the help page: it omits all five of the picker-only parts below.

The article also suggests annotating the circuit where you substitute, so the intent survives for whoever opens it next.

## Starter circuits (not parts)

The picker also carries 67 prebuilt example assemblies, every one with a `starter*` slug. They are wiring examples rather than components, and several reuse a name that also exists as a real part (`DC Motor`, `Breadboard`, `Photodiode`), so matching a parts library by name alone would pick these up by mistake.

- **Arduino** (33): 2 wire LCD, Analog In, Serial Out, Analog Input, Analog Read Serial, Blink, Blink Without Delay, Breadboard, Button, Calibration, Debounce, Digital Read Serial, Fade, Flex sensor, Force sensor, Infrared Receiver, Input Serial Pullup, LCD, Large signal pMOSFET, Moisture, Neopixel, Photodiode, Read Analog Voltage, Servo, Small signal nMOS, Small signal pMOS, Smoothing, State Change Detection, Tone Keyboard, Tone Melody, Tone Multiple, Tone Pitch Follower, Ultrasonic Range Finder, Voltage Meter
- **Basic** (21): Analog gas sensor, Ceramic Capacitor, DC Motor, DIP Switch DPST, DPDT relay, Diode, Inductor, LED Dimmer, LED Light Up, LED Switch, Motion lamp, Multiple LEDs, NPN transistor, PIR Sensor, Phototransistor, Polarized Capacitor, RGB LED, Resistors, Temperature Sensor, Tilt Sensor, Zener Diode
- **Circuit** (3): Glow Circuit Assembly, Move Circuit Assembly, Spin Circuit Assembly
- **Microbit** (10): Alarm, Analog, Breadboard, Compass, Gestures, Light, Moisture, Radio, Servo, micro:bit breakout

## Provenance, and how far to trust this

Three sources, which do not agree with each other:

1. **A saved copy of the catalogue's component picker** — 110 parts and 67 starters,
   as the UI actually presents them.
2. **The catalogue's published "all components" page** — 109 entries.
3. **The catalogue's public asset host**, which serves one thumbnail per component at
   a predictable path and answers 200 for a component that exists and 403 for one that
   does not. That makes it an oracle rather than a list: you cannot enumerate it, but
   you can test any guess against it.

Sources 1 and 2 disagree **in both directions**, so neither is complete on its own:

- The published page lists four the picker capture lacked: a four-pin tilt sensor, a
  seven-pixel WS2812B ring, a brushed-DC motor controller board, and a second
  encoder motor. All four confirmed present against source 3.
- The picker has five the published page omits: a soil moisture sensor, the I2C
  16x2 LCD, an I2C clock display, a solar cell, and the PCF8574 expander. Every one
  is a relatively recent addition, so the published page is simply behind.

This file is the **union of both, 114 parts**, with the "Listed in" column recording
which source each came from.

On completeness: about 100 plausible asset names were probed against source 3
following the naming conventions the real ones use — the rest of the 74HC family,
CD40xx parts, other Arduino boards, steppers, OLED, DHT11, ULN2803, L298N, MAX7219,
rotary encoders. **Not one existed.** Combined with the publisher describing the
library as deliberately small, that is good evidence the list is complete — but it is
not proof, since a component whose asset name nobody guessed would not show up.

One figure remains unexplained: a third-party summary claims the catalogue has "over
200 components". 114 parts plus 67 starters is 181. It may be counting variants, or it
may be wrong. It is recorded here rather than quietly dropped.

**On naming.** This file describes a target set, not a competitor. The parts are
industry-standard and the identifications are ours; where provenance genuinely matters
it is attributed to the artefact — an asset name, a datasheet, a measurement — rather
than to a product. That is both a house rule and, for the `slug` marks, the more
precise citation anyway.
