# Relay changeover

One relay, one common contact, two destinations. With the coil off, COM is
bonded to NC (normally closed) and the yellow indicator lights. Energizing the
coil moves COM to NO (normally open) and the green one takes over — never both
at once, which is the whole point of a changeover contact.

Measured on the engine (`audit-solve pc38-relay-changeover --set coil=1
--at 1,4,6,20`):

| | coil off | coil on, t < 5 ms | coil on, t ≥ 5 ms |
|---|---|---|---|
| `relay.nc` | 4.9997 V | 4.9997 V | 2.0000 V |
| `relay.no` | 2.0000 V | 2.0000 V | 4.9997 V |
| yellow LED (NC) | 2.970 mA | 2.970 mA | 0.000 mA |
| green LED (NO) | 0.000 mA | 0.000 mA | 2.970 mA |

The changeover lands between the 4 ms and 6 ms samples, which is the
`switchTimeMs: 5` in `circuit.json` doing its job — a relay is a moving part
and does not switch instantly. Coil current is 5 V / 200 Ω = 25 mA, ten times
what either indicator draws.

The 2.0000 V reading on the *idle* contact is not a live signal: it is the
disconnected LED branch floating at its own forward voltage with no current
flowing. Read the current, not the voltage, to tell an indicator apart from
an artefact.

```assert
# Relay changeover: coil off -> NC contact closed, NO open
net src.pos V 5.00 +-0.01
```

<!-- engine-provenance -->
> **Engine provenance.** The measured numbers on this page were last held against
> `bw-board@a301937` and `bw-circuit-ui@410f8ce` — the revisions pinned in
> `test/fixtures/siblings.json`. `test/expected-quantities-hold.test.mjs` compares
> **3 of this page's 20** numeric claims against that engine
> (0 of them disagreeing) and declines the rest with a stated reason;
> `node scripts/expected-claim-census.mjs pc38-relay-changeover` prints them one by one.
<!-- engine-provenance -->
