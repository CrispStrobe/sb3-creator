---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-timer, monostable, retrigger, pulse-extension]
---
## Was du siehst
Ein 555-Timer als retriggerbarer Monoflop. Jeder Tastendruck startet einen Zeitimpuls; ein erneuter Druck während des laufenden Impulses verlängert ihn. R = 100 kΩ, C = 10 µF → t ≈ 1,1 s pro Trigger.

## Probier das
1. Drücke den Taster einmal — die LED leuchtet für ~1,1 Sekunden.
2. Drücke während des Leuchtens erneut — die Zeit beginnt von vorn.
3. Ohne erneuten Druck erlischt die LED nach t = 1,1 × R × C.

## Was passiert hier
Bei jedem Trigger-Impuls (Pin 2 kurz auf Low) setzt der 555 seinen Ausgang auf High und startet die Kondensatorladung. Wird erneut getriggert, bevor der Kondensator 2/3 VCC erreicht, beginnt die Ladung neu. Erst wenn der Kondensator ungestört die Schwelle erreicht, kippt der Komparator und der Ausgang geht auf Low.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — nicht retriggerbarer Monoflop.
- [pc66-555-langzeit](../pc66-555-langzeit) — langer Impuls über hohe RC-Werte.
