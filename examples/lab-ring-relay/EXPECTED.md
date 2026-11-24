# lab-ring-relay — expected behaviour

## Circuit
- 9 V supply. An 8 Ω loudspeaker (`speaker_3`) lies beside a ringing telephone and serves as the microphone; it hears the bell at 110 dB SPL, in bursts of 1 s every 5 s. It feeds an LM386 at gain 200.
- From the amplifier output, 1 µF and two germanium diodes pump the bell into 2.2 µF, which drives an NPN through 1 kΩ. The base is also what empties that capacitor, so the transistor conducts only while the bell keeps pumping.
- The NPN pulls in a relay (200 Ω coil; flyback diode and 47 µF across the coil carry it over the gaps between the clapper's strikes). The relay's contact lights a 9 V lamp, standing in for the mains appliance a real relay's isolated contacts would switch.
- The **Sound** slider in the instruments column sets how loud the sound at the speaker is.

## Observable behaviour
- At switch-on the amplifier's output step charges the pump for a moment: the relay coil sees about 2.5 V, below the 3.7 V it needs. The relay stays out.
- Ringing (110 dB): within 20 ms the relay pulls in and the lamp lights; it holds through the strikes for as long as the bell rings.
- The bell stops: within a few tens of milliseconds the relay drops out and the lamp goes dark.
- Talking near the speaker (80 dB): the relay stays out.

## Measured on the engine
bw-board r4/transducers-20261123, `test/lab-circuits-8.test.mjs` (built silent, the bell switched on after 300 ms): relay in 20 ms after the bell starts, no drop-out sampled every 2 ms for the next 20 ms, out again 30 ms after it stops; at 80 dB, out.

## What this verifies
1. A speaker picks up sound well enough to detect a loud bell, and only a loud one.
2. Rectifying and smoothing turn bursts of sound into a steady switching signal; a relay separates the switched circuit from the electronics.

## Simulation notes
The bell is two decaying gong partials (900 Hz and 2.16 kHz) struck 50 times a second. Never wire mains on a breadboard: the lamp stands in.

```assert
# power-on: supply; relay out, so its NC contact carries the supply and the lamp is dark
net vsource_2.pos V 9.00 +-0.01
net relay_12.nc V 9.00 +-0.01
net light_bulb_15.a V 0.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@7e0bf8c` and `bw-circuit-ui@4c57f3a` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-ring-relay` prints them one by one.
<!-- engine-provenance -->
