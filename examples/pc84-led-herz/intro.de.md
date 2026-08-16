---
level: advanced
age: 14+
prereqs: [pc40-opamp-threshold]
teaches: [LM358, integrator, comparator, triangle-wave, breathing-LED]
---
## Was du siehst
Ein pulsierendes LED-Herz: fünf rote LEDs atmen sanft auf und ab. Kein Mikrocontroller, keine Software — ein LM358-Doppelverstärker erzeugt ein Dreieckssignal, das die LEDs stufenlos dimmt.

## Probier das
1. Klick auf **Sim** — die LEDs pulsieren gleichmäßig auf und ab.
2. Die Pulsrate hängt von R und C des Integrators ab: größeres C → langsameres Atmen.
3. Alle fünf LEDs sind parallel am Dreieckausgang — sie atmen synchron.

## Was passiert hier
Op-Amp 1 des LM358 arbeitet als Integrator: er verwandelt das Rechteck von Op-Amp 2 in ein Dreieck. Op-Amp 2 arbeitet als Komparator mit Hysterese: er kippt, wenn das Dreieck die obere oder untere Schwelle erreicht, und gibt ein neues Rechteck zurück. Das Dreieck treibt die LEDs — die Helligkeit folgt der Wellenform.

## Weiter geht's
- [pc85-led-lampe-puls](../pc85-led-lampe-puls) — gleiche Schaltung, eine LED statt fünf.
- [pc40-opamp-threshold](../pc40-opamp-threshold) — der Komparator-Baustein isoliert.
