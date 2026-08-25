# Expected findings

Board view (physical DRC) on `board.pcb.json`:

| rule | severity | where | why |
|---|---|---|---|
| terminal-short | danger | the button | its pads 3 and 4 carry the b-side net, but pad 3 shares terminal `a` with pad 1 (the LED side) — the switch's own metal joins them, so the key is permanently pressed |

That is the ONLY finding: the copper never touches the LED route, the
outline is closed, every net is one island. The schematic pairing cannot
see it either (both sides collapse identically) — the terminal map is the
only detector, and the simulation shows the consequence: LED lit at
power-on, key dead.

The `pcbExpectedFindings` entry in index.json pins this verdict; the
gallery gate fails if the board ever gains or loses a finding.
