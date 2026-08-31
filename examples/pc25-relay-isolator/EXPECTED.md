# Relay isolator

Closing the coil switch energizes the relay. After its switching delay the
normally-open contact closes and powers the indicator branch. The coil side and
the contact side are separate electrical paths — different supplies, no shared
current.

Measured on the engine (bw-board, flat path, board vcc 5):

| condition | coil (`relay1.coil_a`) | contact (`relay1.no`) | LED current |
|---|---|---|---|
| switch open | 0 V | 2.00 V (no path) | 0.00 mA |
| switch closed, t = 4 ms | 5.00 V | 2.00 V (still open) | 0.00 mA |
| switch closed, t = 6 ms | 5.00 V | 8.999 V | 6.93 mA |

The coil draws 5 V / 200 Ω = 25 mA from the 5 V rail. The contact carries
(9 − 2.07) V / 1 kΩ = 6.93 mA from the *9 V* supply — a load the 5 V side never
touches. The gap between the 4 ms and 6 ms rows is `switchTimeMs: 5`: a real
relay's armature takes milliseconds to move, and this one is modelled that way.

```assert
# Relay: coil supply 5V via coil_v (implicit), load supply 9V
net load_v.pos V 9.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@338ac5d` and `bw-circuit-ui@14efc75` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **8 of this page's 21** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc25-relay-isolator` prints them one by one.
<!-- engine-provenance -->
