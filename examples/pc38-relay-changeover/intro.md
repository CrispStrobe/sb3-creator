---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch]
teaches: [relay, changeover-contact, electromechanical]
---
## What you see
A relay with one common contact that can swing between two destinations — the normally-closed (NC) and normally-open (NO) contacts. Two LEDs show which one is active.

## Try this
1. Click **Sim** with the coil off. The NC LED (yellow) lights up — the contact rests on NC when the relay is not energized.
2. Energize the coil. After a short delay (~5 ms), the contact flips: the NC LED goes dark and the NO LED (green) lights up.
3. De-energize the coil. The contact returns to NC after the same delay.

## What is going on
A relay is an electromagnetically operated switch. When current flows through the coil, the magnetic field pulls a metal arm from one contact to another. The changeover (SPDT) type has three terminals: COM, NC, and NO. COM is always connected to exactly one of the other two — never both, never neither. The 5 ms switching delay models the physical movement of the arm.

## Why it matters
Relays isolate control circuits from high-power loads. A 5 V microcontroller signal can switch a 240 V mains device through a relay, with no electrical connection between the two. Changeover contacts are used in motor reversing, failover switching, and safety interlocks.

## Go further
- [pc25-relay-isolator](../pc25-relay-isolator) — a relay used for signal isolation.
- [pc36-series-interlock](../pc36-series-interlock) — interlocking relays for safety.
- Experiment: what happens if you connect a load between NC and NO? (Hint: it sees alternating paths as the relay cycles.)
