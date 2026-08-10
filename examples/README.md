# Examples — your first circuits and programs

This gallery contains **74 ready-to-open examples**: 20 pure circuits that need no
microcontroller, and 54 programs that run on a simulated STC12 chip. Every example
has a circuit you can see, numbers you can check, and something you can change to
see the result.

## Pure circuits — start here

No programming needed. Open the circuit, and it works.

| # | what you see | what it teaches |
|---|---|---|
| **pc01** | An LED lights up | A resistor limits the current so the LED survives |
| **pc09** | Same LED, no breadboard | You can wire parts directly — a breadboard is a convenience |
| **pc02** | Two resistors, no LED | Voltage divides in proportion to resistance |
| **pc04** | Two LEDs side by side | Parallel paths share the current |
| **pc17** | Three LEDs, three brightnesses | More resistance = less current = dimmer LED |
| **pc05** | An LED that needs a button | A transistor amplifies a tiny base current into a large collector current |
| **pc06** | A capacitor charges slowly | An RC circuit has a time constant τ = R × C |
| **pc18** | A zener diode clamps the voltage | A zener holds a fixed voltage regardless of the supply |

**What to change:** open `pc17-current-compare` and change the 220 Ω resistor to
1000 Ω. The LED gets dimmer — the current dropped from 13.6 mA to 3.0 mA. That is
Ohm's law: I = V / R.

## Microcontroller programs — after you understand the circuit

These add a program that runs on the chip and controls the circuit.

| # | what it does | what it teaches |
|---|---|---|
| **01** | An LED blinks at 1 Hz | `FOREVER` + `wait` = a loop with timing |
| **06** | Two LEDs, opposite wiring | Active-low vs active-high: same command, different pin levels |
| **14** | Three LEDs in sequence | A traffic light is just three timed outputs |
| **05** | Count button presses | `wait until` + variables = reacting to input |
| **07** | A buzzer alternates two tones | `set pin to N hz` = a frequency, not a bit |
| **32** | One bright LED, one dark | The 8051 sinks 20 mA but sources only 0.23 mA — THE lesson |
| **46** | Eight LEDs on one port | Each is fine alone; together they approach the chip's 120 mA limit |

**What to change:** open `01-blink` and change `wait 0.5 seconds` to `wait 0.1 seconds`.
The LED blinks faster. Change `toggle led1` to `turn on led1` followed by `turn off led1`
— same result, but now you see both halves of the cycle.

## The pseudocode dialect

Programs are written in a dialect that reads like English:

```
DEVICE STC12C5A60S2
CLOCK 11059200
PIN led1 = P1.0 OUTPUT ACTIVE LOW

WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds
```

Every line maps to a Scratch block. `ACTIVE LOW` means the LED is wired from
VCC through a resistor to the pin — turning ON drives the pin LOW (0), because
the 8051 can sink much more current than it can source.

## Safety lessons

Three examples exist to show what goes wrong on a real board:

| # | the mistake | what the simulator shows |
|---|---|---|
| **31** | LED with no series resistor | Overcurrent — the LED would burn out |
| **32** | LED wired active-high on a quasi-bidirectional pin | Almost no light — the pin sources only ~230 µA |
| **09** | Relay wired directly to a pin (old version) | The relay does not energise — the pin cannot drive it |

The corrected version of each is in the same example or in a companion: `09-relay-clicker`
now uses a TIP120 Darlington driver, which is how you would actually build it.

## File structure

Each example is a directory with three files:

| file | what it is |
|---|---|
| `program.bw` | The pseudocode program (or a comment for pure circuits) |
| `circuit.json` | The circuit: parts, wires, breadboard seats |
| `EXPECTED.md` | What should happen, with computed numbers |

`index.json` lists every example with an English and German title, a category,
and a difficulty rating (1–5).
