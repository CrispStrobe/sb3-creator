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
