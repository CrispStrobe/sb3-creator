---
level: intermediate
age: 12+
prereqs: []
teaches: [inductor, low-pass-filter, energy-storage]
---
## Was du siehst
Eine Spule und ein Widerstand bilden einen Tiefpassfilter. Niederfrequente Signale passieren mit wenig Verlust, waehrend hochfrequente Signale durch die steigende Impedanz der Spule stark gedaempft werden.

## Probier das
1. Starte die Simulation und beobachte, wie ein niederfrequentes Eingangssignal nahezu unveraendert durchkommt.
2. Erhoehe die Eingangsfrequenz und beobachte, wie die Ausgangsamplitude sinkt, weil die Spule hoehere Frequenzen blockiert.
3. Ersetze die Spule durch einen groesseren Wert und beachte, dass sich die Grenzfrequenz nach unten verschiebt.

## Was passiert hier
Eine Spule widersetzt sich Aenderungen des Stroms. Bei niedrigen Frequenzen aendert sich der Strom langsam, die Spule wirkt wie ein Kurzschluss und das Signal passiert. Bei hohen Frequenzen muss sich der Strom schnell aendern, die Impedanz der Spule steigt (X_L = 2*pi*f*L), und sie nimmt den groessten Teil der Spannung auf, sodass am Ausgang wenig uebrig bleibt. Dies ist das Dual eines RC-Filters: der Kondensator blockiert Gleichstrom, die Spule blockiert Wechselstrom, aber beide erzeugen eine Tiefpass-Charakteristik in Kombination mit einem Widerstand.

## Warum das wichtig ist
Spulenfilter vertragen hoehere Stroeme als RC-Filter, ohne Leistung in einem Widerstand zu verheizen. Sie sind Standard in Netzteilen, wo Schaltrauschen vom Gleichspannungsausgang gefiltert werden muss, ohne nennenswerten Spannungsabfall oder Waerme.

## Weiter geht's
- [pc50-two-stage-rc](../pc50-two-stage-rc) — Vergleich mit einem RC-basierten Tiefpassfilter.
- [pc56-inductor-freewheel](../pc56-inductor-freewheel) — was passiert, wenn man den Strom einer Spule ploetzlich unterbricht.
- Experiment: Fuege einen Kondensator nach der Spule hinzu, um einen LC-Filter zu bilden, und beobachte die steilere Flanke und moegliche Resonanz.
