---
level: intermediate
age: 12+
prereqs: [languages-keypad-events, pc28-logic-interlock]
teaches: [matrix-keypad, keypad-encoder, binary-code, tri-state-output, data-available]
---

## What you see

A 4×4 matrix keypad feeds a 74C922 keypad encoder through eight real wires.
The green **DA** LED means “data available”. The other four LEDs show the
binary output **D C B A**, with A as the least-significant bit. There is no
microcontroller and no hidden key-number connection: the encoder discovers a
press by scanning the keypad's row and column nets.

## Try this

1. Click **Sim**, then press keypad keys in the first, second and fourth rows.
2. Watch DA light while a key is held and go dark after release.
3. Read the red/yellow/blue/white LEDs as A/B/C/D. Key position 0 shows `0000`,
   position 5 shows `0101`, and position 15 shows `1111`.
4. Delete the wire from `kp1.r1` to `enc1.y2`. The four keys in that row can no
   longer be detected; keys in the other rows still work.
5. Reconnect the wire, then disconnect `enc1.oeb` from ground and tie it to
   +5 V. DA still reports a held key, but A–D stop driving the LEDs because
   **/OE is active low**.

## What is going on

Sixteen switches need only eight matrix wires. The encoder pulls one X column
low at a time. A pressed key joins that X wire to one of the internally pulled-
up Y rows, so the encoder learns both coordinates. It publishes
`row × 4 + column` as the four-bit value D C B A and raises DA.

`enc1.oeb` is strapped to ground here, enabling A–D. Raising it does not force
those outputs low: it disconnects them electrically. That tri-state behavior
lets several chips share one data bus. DA is not gated by /OE.

The OSC and KBM pins are intentionally open in this simulation bench. The
engine uses a fixed 8 kHz synchronous scan abstraction and treats a physical
press as already debounced; it does not pretend those unmodeled RC pins select
a measured capacitor delay.

## Why it matters

This is how a keypad becomes a compact number a CPU can read. More importantly,
it demonstrates that a result is caused by the drawn wiring: remove one row or
column and the corresponding keys disappear.

## Go further

- Swap A and B and predict which key positions acquire the wrong code.
- Add pull-down resistors to A–D, raise /OE, and measure how an external load
  decides a tri-stated line.
- Connect DA and A–D to a processor input port and use DA as the read strobe.
