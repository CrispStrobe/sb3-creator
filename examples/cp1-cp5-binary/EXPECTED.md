# CP5-style binary workbench — acceptance observations

This original example uses a base CP1, eight latching switches, eight explicit
10 kΩ pull-ups, the existing eight-channel Darlington driver, and eight red LEDs
with individual 1 kΩ series resistors. It is a 5 V teaching circuit. It does not
reproduce the original CP5's transistor stages, supply or current ratings.
The live contact buttons are in **Instruments → Switches**; their Open/Closed
labels come from the active circuit board. The authored initial `closed` values
are numeric 1, matching the ordinary switch's property-editor format.

## Teaching program

The first nine cells are `[4,0]`, `[18,0]`, `[3,200]`, `[16,0]`, `[6,32]`,
`[18,0]`, `[2,0]`, `[3,100]`, `[9,3]`. Cell 32 is initially `[0,0]`. The image
contains 256 bytes; no CP3 or ROM image is required to assemble it.

With a compatible monitor ROM supplied by the user, finish monitor startup
before loading teaching RAM. The original manual describes all output LEDs on
after startup because the outputs are high. This must be observed after the
monitor is ready, not assumed at a raw CPU/peripheral reset boundary.

Load while paused, resume without reset, then enter `0, 0, 0, PC, RUN`. The
program first clears Port 2 and requests a 200 ms delay. Afterwards it samples
Port 1, stores the sample at cell 32, writes Port 2, displays the byte and requests
100 ms before repeating. Program and firmware overhead add time to these waits.

| Open switches (all others closed) | P1 sample | Cell 32 | P2 latch | Lit LEDs |
| --- | --- | --- | --- | --- |
| None | 0 | 00.000 | 0 | None |
| 1 | 1 | 00.001 | 1 | 1 |
| 8 | 128 | 00.128 | 128 | 8 |
| 1, 3, 6, 8 | 165 | 00.165 | 165 | 1, 3, 6, 8 |
| All | 255 | 00.255 | 255 | All |

Each display value is `A00.` followed by the three-digit decimal sample. The
8-bit conventional binary rendering of 165 is `10100101`; terminal 1 is bit 0.

## Electrical qualification boundary

`node scripts/verify-cp1-cp5.mjs --board /path/to/bw-board --circuit-ui /path/to/bw-circuit-ui`
loads this exact JSON through the canonical Circuit model and engine injection.
It uses short, original 8049 test firmware to prove the complete
switch → sampled CP1 port → CPU → 8155 → driver → resistor/LED path. It exercises
all eight channels separately, mixed patterns, all zero/all one, pausing and
save/load of the editable circuit. The verifier reports exact source commits
and whether either checkout is dirty; missing dependencies are errors.

The synthetic firmware is an electrical test stimulus, not an implementation
of the CP1 teaching language and not proof of the historical monitor program's
display or timing. The separate external-ROM gate is:

```sh
node scripts/verify-cp1-cp5-monitor.mjs --board /path/to/bw-board --circuit-ui /path/to/bw-circuit-ui --rom /path/to/monitor.bin
```

The [recorded 2026-11-25 observation](../../reference/cp1-cp5-observations.json)
qualifies the identified 2716 monitor, SHA-1
`ff4befcf82a664950186d3af1843fdef70d2209f`, at the exact clean upstream revisions
and source hashes in that report. It passed 13 successive input patterns,
including every individual bit, mixed 165/90, all low and all high. Each case
asserted the live input, firmware-written output, saved cell 32, six raw display
digits and actual LED/resistor currents. The supplied historical ROM stayed
external and was not committed.

After monitor startup all eight LEDs conducted about 2.272 mA each. With inputs
held high, keypad RUN produced an initial output transition 255 → 0 → 255:
the explicitly cleared interval was 226.0575 ms in this simulated run. This is
the original program's 200 ms request plus firmware and program overhead, not a
physical CP5 measurement or a guarantee of an exact 200 ms interval. A pause
check also confirmed that outputs wait for resumed firmware execution.

The pass condition for an on branch includes positive resistor/LED current and
nonzero engine LED brightness; an off branch must have negligible current.
Changing a switch while CPU execution is paused must change the input voltage
without changing the output latch or LED state until execution resumes.

## Sources and authorship

Authored independently on 2026-11-25 from Brickwright's existing parts, API and
test conventions and the hardware descriptions in the
[original CP5 manual](https://www.retrozone.ch/docs/cp1/CP5-Ein_Ausgabe-Universalinterface.pdf),
PDF pages 2–3 (startup, switch polarity and bit order) and 6–7 (driver schematic).
No GPL emulator code, translated pseudocode, emulator implementation structure,
historical ROM bytes, scanned artwork or manual program is included.
