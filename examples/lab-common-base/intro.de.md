---
level: advanced
age: 14+
prereqs: [lab-ce-vs-follower]
teaches: [common-emitter, common-collector, common-base, gain, phase]
---
## Was du siehst
Ein Signal und drei Transistorverstärker, die sich nur darin unterscheiden, welchen Anschluss Eingang und Ausgang gemeinsam haben: Emitter, Kollektor oder Basis.

## Was du tun kannst
1. Klick auf **Sim** und warte kurz, bis die Kondensatoren geladen sind.
2. Vergleiche auf dem ersten Oszilloskop den Eingang mit dem Emitterfolger: gleich groß, gleich herum.
3. Vergleiche auf dem zweiten Oszilloskop die beiden Kollektoren: beide etwa 4,6-mal größer, aber einer steht auf dem Kopf.

## Was passiert hier
In der Emitterschaltung zieht eine steigende Basisspannung mehr Strom durch den Kollektorwiderstand, also fällt der Kollektor: Verstärkung und Umkehrung. Der Emitter des Emitterfolgers folgt einfach seiner Basis, eine Diodenspannung tiefer. In der Basisschaltung wird die Basis festgehalten, und das Signal schiebt stattdessen den Emitter: Sinkt der Emitter, steigt der Strom, der Kollektor fällt mit, aber der Eingang ist ja auch gefallen, also kommt der Ausgang richtig herum heraus. Ihr Eingang ist der Emitter, der viel Strom braucht: ein kleiner Eingangswiderstand, nützlich bei Hochfrequenz.

## Weiter geht's
- [lab-ce-vs-follower](../lab-ce-vs-follower) — die ersten beiden nebeneinander mit einem Poti.
- [lab-amp-classes](../lab-amp-classes) — Stufen im A- und C-Betrieb.
