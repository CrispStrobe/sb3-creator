# A2 D1–D8 LED row

An isolated test of the active-low LED row on P2. It is intentionally
separate from the 8-digit display because P2.2–P2.4 also address the
74HC138 and cannot preserve an independent LED pattern during display
multiplexing. A click at D6 is expected: BZ1 shares P2.5.

