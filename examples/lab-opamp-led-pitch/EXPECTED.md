# lab-opamp-led-pitch — expected behaviour

## Circuit
- 9 V supply, one LM324.
- The LED in the socket (slide_switch_5: left red led_6, right green led_7) carries about 1.5 mA from +9 V through 4.7 kΩ; section 3 buffers its forward voltage.
- NULL pot (potentiometer_9) between 82 kΩ from +9 V and 18 kΩ to ground: 1.47 V to 2.29 V on its wiper (as built at 0.1: 1.555 V). Voltmeter_22 reads LED voltage minus NULL voltage.
- Section 1: integrator (10 kΩ in from the LED buffer, 10 nF, + input on the NULL wiper): its output falls at a rate proportional to that difference.
- Section 2: non-inverting Schmitt trigger (10 kΩ in, 33 kΩ back, − input on 4.05 V): low below about 3.0 V, high again above about 5.1 V; while low it pulls the integrator back up through a diode and 4.7 kΩ. Loudspeaker on its output through 10 µF and 220 Ω.

## Observable behaviour
- Red LED, NULL at 0.1: 43 mV of difference, a low tone of about 165 Hz.
- Turn NULL up: the tone gets lower and stops at about 0.15–0.18 — the pot now matches the red LED's forward voltage (1.60 V).
- Switch to the green LED without touching NULL: its forward voltage is 0.3 V higher (1.90 V), and a tone of about 830 Hz comes back.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10c.test.mjs`: red 1.598 V, green 1.895 V; red at NULL 0.1 → 164 Hz; red at 0.18 → no edges in 12 ms; green at 0.18 → 828 Hz.

## What this verifies
1. LEDs of different colours have different forward voltages (here 1.60 V and 1.90 V at 1.5 mA).
2. An integrator and a comparator with a reset make a voltage-to-frequency converter; nulling it against one LED turns the difference into pitch.

## Simulation notes
The pitch is not exactly proportional to the difference at the high end: the reset takes a fixed time on top of the ramp.

```assert
# 1 ms after switch-on (the solve assert-physics runs)
net lm324_3.3_out V 1.598 +-0.01
net lm324_3.1_pos V 1.555 +-0.01
net lm324_3.2_neg V 4.055 +-0.01
```
