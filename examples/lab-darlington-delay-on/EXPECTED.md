# lab-darlington-delay-on — expected behaviour

## Circuit
- 9 V battery. ON switch (switch_3, open as built) feeds a 100 µF electrolytic through 100 kΩ; 47 kΩ across the capacitor sets where it ends (under a third of the supply) and drains it when ON opens.
- The capacitor feeds a Darlington pair of NPNs through 1 MΩ; a yellow LED (led_11) with 470 Ω from +9 V in the pair's collectors.

## Observable behaviour
- Close ON: for about a second nothing happens; then the LED fades up over a couple of seconds and is fully on after about 4 s.
- Open ON: the LED stays bright for about a second, fades over the next two and is out after about 4 s.

## Measured on the engine
bw-board 2965782a, `test/lab-circuits-r10a.test.mjs`: ON closed, then at 1 s 0 mA, at 2.5 s 6.4 mA, at 5 s 14.5 mA; ON opened, then at 1 s 11.7 mA, at 2 s 4.75 mA, at 5 s 0 mA.

## What this verifies
1. The pair conducts only once the capacitor has charged past two base-emitter drops (about 1.1 V): the delay is the RC charging time to that point.
2. Its huge current gain lets 1 MΩ feed it, and the 0.6 V swing the capacitor must make between "starting" and "full" stretches the switching into a fade.

## Simulation notes
Both transistors use the Shockley junction model (exponential); with the default piecewise junction the pair switches abruptly and there is no fade. The capacitor charges through the Thévenin resistance of 100 kΩ ‖ 47 kΩ (a time constant of about three seconds) and drains through 47 kΩ (about five).

```assert
# 1 ms after switch-on, ON open: capacitor empty, LED dark
net polarized_cap_5.pos V 0.00 +-0.01
net resistor_10.b V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@b47e7e0` and `bw-circuit-ui@ee2b412` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 27** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs lab-darlington-delay-on` prints them one by one.
<!-- engine-provenance -->
