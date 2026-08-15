---
level: advanced
age: 16+
prereqs: [43-rc-timing]
teaches: [low-pass-filter, frequency-response, scope-reading]
---
## Was du siehst
Ein RC-Tiefpassfilter, angetrieben von einer Signalquelle, mit Ein- und Ausgang auf dem Oszilloskop. Bei niedrigen Frequenzen folgt der Ausgang dem Eingang eng. Bei hohen Frequenzen wird der Ausgang gedaempft — der Kondensator kann sich nicht schnell genug laden und entladen, um mitzuhalten.

## Probier das
1. Stelle den Eingang auf eine niedrige Frequenz und bestaetie, dass die Ausgangsamplitude fast dem Eingang entspricht.
2. Erhoehe die Frequenz, bis der Ausgang auf etwa 70% des Eingangs faellt — das ist die Grenzfrequenz (fc = 1 / (2 * pi * R * C)).
3. Erhoehe die Frequenz weiter und beobachte, wie der Ausgang fast verschwindet — der Filter weist das Signal zurueck.

## Was passiert hier
Ein RC-Tiefpassfilter laesst niederfrequente Signale durch und daempft hochfrequente. Bei niedrigen Frequenzen hat der Kondensator Zeit, sich in jedem Zyklus voll aufzuladen, sodass die Ausgangsspannung dem Eingang folgt. Bei hohen Frequenzen laedt sich der Kondensator kaum auf, bevor sich der Eingang umkehrt, sodass die Ausgangsspannung klein bleibt. Die Grenzfrequenz ist der Punkt, an dem der Ausgang auf 1/sqrt(2) (etwa 70,7%) des Eingangs faellt, was einem Verlust von 3 dB entspricht. Oberhalb der Grenzfrequenz steigt die Daempfung mit 20 dB pro Dekade — jede Verzehnfachung der Frequenz reduziert den Ausgang um den Faktor zehn.

## Warum das wichtig ist
Filter sind ueberall — in Audio-Equalizern, Anti-Aliasing-Schaltungen vor ADCs, Netzteilglaettung und Funkempfaengern. Der RC-Tiefpass ist der einfachste Filter und der Baustein zum Verstaendnis aller Filter hoeherer Ordnung.

## Weiter geht's
- [51-555-astable](../51-555-astable) — sieh RC-Timing in einem anderen Kontext, wo es die Frequenz eines Oszillators bestimmt.
- [49-function-generator-sine](../49-function-generator-sine) — verstehe die Signalquelle, die diesen Filter antreibt.
- Experiment: Berechne die Grenzfrequenz fuer deine R- und C-Werte, stelle den Generator auf diese Frequenz und pruefe, ob der Ausgang bei 70,7% des Eingangs liegt.
