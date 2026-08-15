---
level: intermediate
age: 12+
prereqs: [pc01-led-resistor]
teaches: [capacitor, rc-time-constant, exponential-charge]
---
## Was du siehst
Ein Kondensator wird über einen Widerstand geladen. Die Spannung am Kondensator steigt von 0 V in Richtung 5 V — am Anfang schnell, dann immer langsamer.

## Probier das
1. Klick auf **Sim** und beobachte, wie die Kondensatorspannung über die Zeit ansteigt.
2. Notiere, wann sie etwa 3,16 V (63 % von 5 V) erreicht — das ist eine Zeitkonstante, τ = RC = 1,0 Sekunde.
3. Nach etwa 5 Sekunden (5τ) liegt die Spannung innerhalb von 1 % an 5 V — praktisch voll geladen.

## Was passiert hier
Ein Kondensator speichert Ladung. Wenn du ihn über einen Widerstand an eine Spannungsquelle anschließt, fließt Strom hinein und die Spannung steigt. Aber mit zunehmender Ladung wird der Spannungsunterschied am Widerstand kleiner, und der Strom verlangsamt sich. Das ergibt die typische Exponentialkurve: V(t) = 5 × (1 − e^(−t/RC)). Die Zeitkonstante τ = R × C = 10 kΩ × 100 µF = 1,0 Sekunde bestimmt, wie schnell die Ladung abläuft.

## Warum das wichtig ist
RC-Schaltungen sind überall: Zeitgeberschaltungen, Filter, Netzteilglättung, Entprellung von Tastern. Die Zeitkonstante ist die eine Zahl, die sie alle bestimmt. Wenn du diese Kurve verstehst, verstehst du die halbe Analogelektronik.

## Weiter geht's
- [pc29-capacitor-discharge](../pc29-capacitor-discharge) — das Gegenteil: beobachte, wie sich ein Kondensator entlädt.
- [pc21-rc-smoothing](../pc21-rc-smoothing) — ein RC-Glied zur Signalglättung.
- Experiment: Ändere R auf 20 kΩ. Die Zeitkonstante verdoppelt sich — überprüfe, dass die Spannung bei t = 2 s dem alten Wert bei t = 1 s entspricht.
