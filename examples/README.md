# Getting started — a guided path through the examples

Everything here runs **entirely in the browser**. No hardware, no download, no
install. The simulator computes real voltages and currents — when an LED lights
up, the brightness comes from Ohm's law applied to your circuit, not from a
guess.

There are 116 examples. Do not open them all. Follow the path below; each step
builds on the one before it. Skip ahead when something feels familiar.

---

## Step 1: Light an LED (no programming, no breadboard)

Open **`pc09-direct-led`**. You see a 9 V battery, a 1 kΩ resistor, and a red LED,
wired point to point. The LED is on. Nothing to click, nothing to run.

**What you are seeing:** the simulator solved the circuit and found
I = (9 − 2) / 1000 = 7 mA flowing through the LED. The brightness (0.35) comes
from that current, not from a setting.

**Change one thing:** change the resistor from 1000 Ω to 220 Ω. The LED gets
brighter — the current rose to 31.8 mA. Change it to 10000 Ω and it barely
glows. That is Ohm's law: I = V / R.

**What would happen on a real bench:** exactly the same. Remove the resistor
entirely and open **`31-no-resistor-led`** to see why you should not.

## Step 2: Use a breadboard

Open **`pc01-led-resistor`**. Same circuit, but the parts sit in a breadboard.
The strips conduct — the resistor's right leg and the LED's left leg share a
column, so they are electrically connected without a wire.

Open **`pc14-mini-led`**. Same circuit on a **mini breadboard** — 17 columns,
no power rails. The battery connects directly to strip holes. This teaches
that rails are a convenience, not a requirement.

## Step 3: Voltage and resistance

Open **`pc02-voltage-divider`**. Two 10 kΩ resistors in series from a 9 V battery.
The junction between them sits at 4.5 V — half the supply, because the resistors
are equal. Change one to 20 kΩ and the junction moves to 6 V.

Open **`pc17-current-compare`**. Three LEDs with 220 Ω, 470 Ω, and 1 kΩ resistors.
The 220 Ω LED is brightest (13.6 mA), the 1 kΩ dimmest (3 mA). Same supply,
same LED — only the resistor differs.

## Step 4: Active components

Open **`pc05-npn-switch`**. A transistor turns an LED on and off. A small base
current (~0.4 mA through 10 kΩ) switches a large collector current (~6 mA
through 470 Ω + LED). That amplification is what makes transistors useful.

Open **`pc18-zener-clamp`**. A 5.1 V zener diode clamps the voltage from a 9 V
battery. The LED after the zener sees 5.1 V regardless of what the battery does.

## Step 5: Time

Open **`pc06-rc-charge`**. A 10 kΩ resistor and a 100 µF capacitor. The capacitor
charges with a time constant τ = R × C = 1.0 second. After one τ it reaches
63% of the supply; after five τ it is full.

---

## Step 6: Your first program

Open **`01-blink`**. Now there is a microcontroller. The program is four lines:

```
WHEN flag clicked:
  FOREVER:
    turn on led1
    wait 0.5 seconds
    turn off led1
    wait 0.5 seconds
```

The LED blinks at 1 Hz. Every line maps to a Scratch block.

**Change one thing:** change `0.5 seconds` to `0.1 seconds`. The LED blinks
five times faster. Change `turn on` / `turn off` to just `toggle led1` — same
result, shorter program.

**What `ACTIVE LOW` means:** the LED is wired from VCC through a resistor to
the pin. `turn on` drives the pin LOW (0 V), which lets current flow from VCC
through the LED into the pin. This is because the STC12's pins can sink 20 mA
but source only ~230 µA — wiring active-low uses the strong direction.

## Step 7: Input

Open **`05-counter-7seg`**. The program waits for a button press, counts it, and
blinks the LED that many times. `wait until read button` is how the program
listens; `change count by 1` is how it remembers.

## Step 8: The sink/source lesson

Open **`32-source-vs-sink`**. Two LEDs, same resistor, same `turn on` command.
One is bright (3 mA, active-low sink), the other is nearly dark (0.23 mA,
active-high source). The factor-of-13 difference in brightness IS the lesson.

This is the single most important fact about the STC12: it sinks 20 mA but
sources only ~230 µA. Every LED in this project is wired active-low for
exactly this reason.

## Step 9: Multiple scripts

Open **`04-thermostat`**. The program reads a sensor (ADC), compares against two
thresholds (300 and 500), and turns a heater LED on or off. The gap between the
thresholds is hysteresis — it stops the output from flickering when the input
sits near one threshold.

## Step 10: Safety

Open **`09-relay-clicker`**. A relay is wired through a TIP120 Darlington driver.
The pin drives the transistor's base (~3.6 mA); the transistor drives the relay
coil (~43 mA from the supply rail). Without the driver, the pin cannot deliver
enough current and the relay stays dead — the simulator catches this.

Open **`46-port-overcurrent`**. Eight LEDs on one port. Each draws 6.4 mA —
individually fine. Together, 51.2 mA from one port, approaching the chip's
total budget of ~120 mA. The simulator warns when the declarations exceed
the limit.

---

## What needs hardware

**Nothing in this gallery needs hardware to try.** Every example runs in the
browser simulator. The circuits are solved by a real MNA engine; the programs
run on an emulated STC12.

If you want to flash a program onto a real chip, you need:
- An STC12C5A60S2 board (~$2)
- A USB-to-serial adapter (CH340 or CP2102)
- `stcgal` for flashing (documented in the stc repo's README)

The simulator's results are **cross-checked between two emulators** (category 2b)
but **have not been verified on silicon** for most peripherals. The ADC register
sequence is verified between models; its analog path is not (`BENCH-ADC`). PWM
duty cycle is verified between models; it has not been measured with a frequency
counter (`BENCH-PWM`). GPIO (`01-blink`) is the only example that has physically
run on a real chip.

## File structure

Each example is a directory with three files:

| file | what it is |
|---|---|
| `program.bw` | The pseudocode program (or a comment for pure circuits) |
| `circuit.json` | The circuit: parts, wires, breadboard seats |
| `EXPECTED.md` | What should happen, with computed numbers |

`index.json` lists every example with an English and German title, a category,
a difficulty rating (1–5), and whether it is a `circuit` or a `program`.
