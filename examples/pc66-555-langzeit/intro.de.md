---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, monostable, long-duration, RC-timing]
---
## Was du siehst
Ein 555-Langzeit-Timer: ein Tastendruck schaltet die LED ein, sie bleibt für t = 1,1 × R × C an — hier R = 1 MΩ, C = 100 µF → t ≈ 110 s (knapp zwei Minuten).

## Probier das
1. Drücke den Taster — die LED leuchtet auf.
2. Warte — die LED bleibt fast zwei Minuten an und erlischt dann von selbst.
3. Ein erneuter Tastendruck startet die Zeitspanne neu.

## Was passiert hier
Der große Widerstand und der große Kondensator ergeben eine lange Zeitkonstante. Der Kondensator braucht 110 Sekunden, um 2/3 VCC zu erreichen. Erst dann kippt der interne Komparator und der Ausgang geht auf Low. Die Formel t = 1,1 × R × C gilt identisch wie beim kurzen Monoflop — nur die Bauteile sind größer.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — kurzer Impuls mit kleinen RC-Werten.
- [pc64-555-retrigger](../pc64-555-retrigger) — retriggerbarer Monoflop.
