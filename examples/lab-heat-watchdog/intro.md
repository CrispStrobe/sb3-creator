---
level: advanced
age: 14+
prereqs: [lab-heat-alarm, lab-nand-pips]
teaches: [current-mirror, junction-temperature, drift-compensation, schmitt-trigger, alarm]
---
## What you see
Two transistors side by side, one called reference and one called sensor, a logic chip, a red LED and a piezo. Each transistor has its own Temperature slider.

## What to do
1. Click **Sim**. All is quiet.
2. Move the sensor transistor's **Temperature** slider to 33 (warm fingers). After a second or so the LED lights and the alarm sounds.
3. Move it back to 25. The alarm stops.
4. Now move **both** sliders to 70. Nothing happens: the watchdog only reacts to a difference.

## What is going on
A silicon junction needs about 2 mV less voltage for the same current for every degree it gets warmer. The reference transistor sets a base voltage for both; the sensor copies the reference's current, as long as both are equally warm. Warm only the sensor and it takes more current, its collector voltage falls, and a Schmitt NAND gate switches the alarm tone on. Warm both and the shared base voltage drops for both, so nothing changes: the drift cancels.

## Go further
- [lab-heat-alarm](../lab-heat-alarm) — a heat alarm with a thermistor.
- [lab-nand-pips](../lab-nand-pips) — gate oscillators switched on by another signal.
