---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [diode, polarity, forward-voltage]
---
## Was du siehst
Eine Signaldiode und eine LED in Reihe. Strom fließt durch beide in Durchlassrichtung: Die Diode fällt etwa 0,7 V ab, die LED etwa 2 V, und der Rest liegt am Widerstand.

## Probier das
1. Klick auf **Sim** und beobachte, wie die LED leuchtet.
2. Prüfe die Spannung über der Diode — sie beträgt etwa 0,7–0,8 V, nicht die volle Versorgungsspannung.
3. Drehe die Diode um (vertausche Anode und Kathode). Es fließt kein Strom und die LED bleibt dunkel — die Diode sperrt.

## Was passiert hier
Eine Diode lässt Strom nur in eine Richtung durch: von der Anode zur Kathode. In Durchlassrichtung fällt eine kleine, nahezu konstante Spannung ab (etwa 0,7 V bei einer Siliziumdiode, etwa 2 V bei einer typischen LED). In Sperrrichtung blockiert sie vollständig. Hier begrenzt der Widerstand den Strom auf etwa 10 mA. Die Spannungsabfälle im gesamten Stromkreis ergeben zusammen die Versorgungsspannung: 2,1 V (R) + 0,8 V (Diode) + 2,1 V (LED) ≈ 5,0 V.

## Warum das wichtig ist
Dioden sind das einfachste Einwegventil der Elektronik. Sie schützen Schaltungen vor vertauschter Stromversorgung, lenken den Strom in die richtige Richtung und bilden die Grundbausteine von Gleichrichtern, die Wechselstrom in Gleichstrom umwandeln.

## Weiter geht's
- [pc22-diode-selector](../pc22-diode-selector) — Dioden lenken den Strom zwischen zwei Pfaden.
- [pc34-polarity-protector](../pc34-polarity-protector) — eine Diode schützt eine Schaltung vor Verpolung.
- Experiment: Berechne den Strom mit idealen Vf-Werten (0,7 + 2,0 = 2,7 V Abfall, bleiben 2,3 V über 220 Ω) und vergleiche mit dem simulierten Wert.
