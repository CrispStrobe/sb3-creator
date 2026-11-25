---
level: foundation
age: 11+
prereqs: [cp1-switch-input, cp1-blink]
teaches: [binary-numbers, cp1-input, cp1-output, polling, output-initialization]
---
## Eight switches, one byte

This CP5-style workbench connects eight ordinary switches to CP1 Port 1 and eight LEDs to Port 2 through a Darlington driver. The switches, pull-up resistors, driver, LED resistors and wires are editable circuit parts. The monitor ROM runs the teaching program on the same 8049 that reads these input voltages and writes the output port.

Each switch closes a path to ground. **Closed means 0; open means 1.** A 10 kΩ pull-up supplies a defined high level while the switch is open. A high output turns on its driver channel and LED. Each LED has its own 1 kΩ current-limiting resistor.

The channel numbers count from 1, while circuit terminals count from 0:

| Switch and LED | Input terminal | Output terminal | Value when open/lit |
| --- | --- | --- | --- |
| 1 | P1.0 | P2.0 | 1 |
| 2 | P1.1 | P2.1 | 2 |
| 3 | P1.2 | P2.2 | 4 |
| 4 | P1.3 | P2.3 | 8 |
| 5 | P1.4 | P2.4 | 16 |
| 6 | P1.5 | P2.5 | 32 |
| 7 | P1.6 | P2.6 | 64 |
| 8 | P1.7 | P2.7 | 128 |

## Start with a deliberate output state

1. Import your own compatible 2048-byte CP1 monitor ROM. Use **Run CPU** until the monitor reaches its stable ready display. The original CP5 manual describes all LEDs on after monitor startup because the computer initializes its outputs high. This is a firmware startup observation, not a promise about every raw reset instant or an unknown ROM.
2. Pause the CPU and load `program.cp1`. Resume without resetting: monitor initialization can clear teaching-program memory. On the original keypad enter **0, 0, 0, PC, RUN**.
3. The program first writes zero to the whole output port and requests a 200 ms settling delay. The supplied circuit starts with every switch closed, so the repeated samples then keep the LEDs off and show `A00.000`.
4. Open the **Instruments** panel and use its **Switches** buttons to open switches 1, 3, 6 and 8. Each button reports the live contact as **Open** or **Closed**. Predict `1 + 4 + 32 + 128 = 165`. After the next sample, LEDs 1, 3, 6 and 8 light and the display shows `A00.165`. Cell 32 holds `00.165`, the last sampled byte.
5. Try only switch 8 open, then all switches open. Predict 128 and 255 before looking. Read the LED row in channel order; conventional written binary lists bit 7 first, so 165 is `10100101`.

## Follow the signal through the program

`P1E 0` samples all eight inputs. `ABS observed` keeps that sample in cell 32 for inspection. `P2A 0` writes the same byte to all eight outputs, and `ANZ` asks the monitor to display it. The loop requests a 100 ms delay before sampling again; instruction execution and display scanning add time, so this is not an exact 100 ms sampling-period claim.

Pause the CPU after the LEDs settle and change a switch. Its solved input voltage may change, but the CPU, saved sample and output latch remain at their previous state. Resume to let firmware copy the new input to the output. Keypad **STP** stops the teaching program while the monitor continues to run; **Pause CPU** stops processor execution.

## What this workbench represents

The original CP5 used transistor-driven outputs. This example uses the existing simulated eight-channel Darlington component and a 5 V LED supply to teach the same input/byte/output relationship. It is an original educational circuit, not a reconstruction of the CP5 transistor stages or their load ratings. The driver and CP1 pins use the simulator's documented electrical approximations. No historical monitor ROM or manual program is included.

Complete the lesson after checking the switch voltages, displayed decimal value and LED currents yourself. Loading the example or clicking a switch alone does not establish that the firmware ran.
