# CP1 first display — acceptance observations

Original Brickwright source, authored independently from the documented CP1 command format. No monitor ROM is included.

Assembler checks: cells 0–2 are `[4,42]`, `[2,0]`, `[9,1]`; the base image is 256 bytes, opcode first. Changing VALUE changes only the first operand.

With a user-supplied compatible ROM, load RAM, set the monitor's teaching PC to 0 and use its RUN key. The loop repeatedly requests the accumulator display. Confirm the value from the six actual segment masks, and use the monitor's STP key to stop the loop.

Integration observation on 2026-11-24 using the independently authored engine and a locally supplied 2716 ROM: the stable masks `[119,63,191,63,102,91]` show `A00.042`. The earlier AKO/ANZ/HLT sequence was rejected as a teaching example because HLT immediately changed the monitor display to `P003`. No ROM is bundled with either program. ROM-specific observations are distinct from assembler tests.

The lesson's conceptual and display checks use manual completion. A CPU snapshot or panel-open event alone cannot prove the learner's reading.
