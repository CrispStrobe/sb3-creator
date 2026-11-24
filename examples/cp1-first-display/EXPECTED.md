# CP1 first display — acceptance observations

Original Brickwright source, authored independently from the documented CP1 command format. No monitor ROM is included.

Assembler checks: cells 0–2 are `[4,42]`, `[2,0]`, `[1,0]`; the base image is 256 bytes, opcode first. Changing VALUE changes only the first operand.

With a user-supplied compatible ROM, load RAM, set the monitor's teaching PC to 0 and use its RUN key. The expected teaching-program result is a displayed accumulator value of 42 followed by a halt. Confirm this from the six actual segment masks. The host CPU remains available to the monitor. This document states a prediction to verify, not a claim that a proprietary ROM was bundled or automatically tested.

The lesson's conceptual and display checks use manual completion. A CPU snapshot or panel-open event alone cannot prove the learner's reading.
