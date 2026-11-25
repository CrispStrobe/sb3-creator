---
level: advanced
age: 14+
prereqs: [lab-scr-pair]
teaches: [thyristor, phototransistor, edge-trigger, slave-flash]
---
## What you see
A two-transistor thyristor that switches a white "flash lamp", and a phototransistor that watches the room. A real slave flash fires the moment it sees another flash go off.

## What to do
1. Click **Sim**. The lamp is dark.
2. Slowly move the phototransistor's **light** slider up to the middle. Nothing happens: slow changes of room light are ignored.
3. Move it back to 0, then jump it straight to full light (a flash). The lamp comes on and stays on.
4. Slide the main switch off and on to reset it.

## What is going on
The phototransistor's emitter voltage follows the light. Between it and the gate sits a capacitor, which only passes changes: a slow change gives a tiny current, a sudden jump gives a strong pulse. That pulse switches the thyristor on, and as in lab-scr-pair the two transistors then hold each other on until the main current is broken.

## Go further
- [lab-scr-pair](../lab-scr-pair) — the two-transistor thyristor fired by a button.
- [lab-scr-dimmer](../lab-scr-dimmer) — the same thyristor on alternating current.
