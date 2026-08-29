# pc24-light-gate

## Circuit
An LDR from VCC and a 10 kΩ resistor to ground form a light-dependent divider;
the divider node drives an NPN base. Collector load is 1 kΩ + a yellow LED;
emitter to ground.

**Direction:** the LDR is the *upper* leg, so **bright light pulls the base up
and turns the LED on**; darkness lets it fall and the LED goes off.

## Expected — physically
LDR 100 kΩ dark → 1 kΩ bright, against a 10 kΩ lower leg:

| light | R_LDR | divider node | transistor |
|---|---|---|---|
| dark (0.0) | 100 kΩ | 5 · 10/110 = 0.45 V | off, below V_be |
| mid (0.5) | 10 kΩ | 5 · 10/20 = 2.5 V, clamped to ~0.7 by the base | on |
| bright (1.0) | 1 kΩ | 5 · 10/11 = 4.5 V, clamped to ~0.7 | hard on |

Threshold at V_be ≈ 0.7 V, i.e. around R_LDR ≈ 61 kΩ. Collector should sit at
V_ce_sat with the LED at (5.0 − 2.0 − 0.2) / 1000 ≈ 2.8 mA once on.

## Measured (`audit-solve pc24-light-gate`)

Dark state (default LDR control = 0.0):

| node | volts |
|---|---|
| base (ldr1.b, r1.a) | 0.4545 V |
| collector (led1.cathode) | 3.0000 V |
| emitter | 0.0000 V |

Base at 0.45 V (below V_be = 0.7 V), transistor off, LED dark. Correct sensing
behaviour.

## Content defect fixed during the earlier audit
The LDR declared `minOhms: 1000, maxOhms: 100000`. The device reads
**`rDark` / `rLight`**, so both were silently ignored. Renamed to
`rDark: 100000, rLight: 1000`; the base now reads 0.4545 V dark, as the
declared parts say it should.

```assert
# LDR divider: dark = 5*10k/(100k+10k) = 0.45V at base (off)
net vcc1.pos V 5.00 +-0.01
net r1.a V 0.45 +-0.10
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@4ae89b5` and `bw-circuit-ui@60fd117` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **9 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc24-light-gate` prints them one by one.
<!-- engine-provenance -->
