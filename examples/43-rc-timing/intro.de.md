---
level: intermediate
age: 12+
prereqs: []
teaches: [rc-circuit, time-constant, exponential-charge]
---
## Was du siehst
Ein Widerstand und ein Kondensator in Reihe, mit einer Spannungsmessung ueber dem Kondensator, und ein Schalter, der einen zweiten Widerstand parallel zum Kondensator legt, damit du ihn entladen und von vorn beginnen kannst. Wenn Strom angelegt wird, laedt sich der Kondensator langsam auf — nicht sofort. Mit R = 10 kohm und C = 100 uF betraegt die Zeitkonstante genau 1 Sekunde, langsam genug, um den Spannungsanstieg in Echtzeit zu beobachten.

## Probier das
1. Starte die Simulation und beobachte, wie die Kondensatorspannung von 0 V in Richtung Versorgungsspannung steigt.
2. Notiere die Zeit, bis etwa 63% der Versorgungsspannung erreicht sind — das ist eine Zeitkonstante (tau = R * C).
3. Aendere den Widerstands- oder Kondensatorwert und beobachte, wie sich die Ladegeschwindigkeit proportional aendert.
4. Schliesse den Entladeschalter fuer etwa eine halbe Sekunde und oeffne ihn wieder — der Kondensator entlaedt sich ueber den 1-kohm-Widerstand und laedt danach erneut, du kannst die Messung also beliebig oft wiederholen. Er faellt dabei nicht ganz auf 0 V: der Ladewiderstand bleibt angeschlossen, beide bilden einen Spannungsteiler, und der Boden liegt bei 5 V * 1k/11k = 0,4545 V. Der folgende Anstieg beginnt dort — genau dafuer gibt es die allgemeine Form U(t) = Uf + (U0 - Uf) * e^(-t/RC).

## Was passiert hier
Wenn Spannung an einen RC-Kreis angelegt wird, fliesst Strom durch den Widerstand in den Kondensator. Waehrend der Kondensator sich auflaedt, steigt die Spannung ueber ihm und der Strom nimmt ab — der Kondensator wehrt sich gegen weiteres Laden. Die Spannung folgt einer Exponentialkurve: V(t) = VCC * (1 - e^(-t/RC)). Nach einer Zeitkonstante (tau) erreicht der Kondensator 63% von VCC. Nach fuenf Zeitkonstanten ist er praktisch voll geladen. Dieses vorhersagbare Zeitverhalten macht RC-Schaltungen zur Grundlage von Timern, Filtern und Entprellschaltungen.

## Warum das wichtig ist
RC-Timing findet sich in Entprellschaltungen, Audiofiltern, Netzteilglaettung und dem 555-Timer. Die exponentielle Ladekurve zu verstehen ist wichtig, um vorherzusagen, wie schnell eine Schaltung auf Aenderungen reagiert.

## Weiter geht's
- [51-555-astable](../51-555-astable) — sieh, wie RC-Timing im Inneren eines 555-Timers einen Oszillator bildet.
- [50-rc-scope](../50-rc-scope) — beobachte die RC-Antwort auf einem Oszilloskop und verstehe Frequenzfilterung.
- Experiment: Sage vorher, wann der Kondensator von 0 V aus 3,16 V erreicht, und pruefe es; entlade dann, notiere die Spannung, bei der du neu startest, und sage dieselbe Schwelle mit der allgemeinen Form erneut vorher.
