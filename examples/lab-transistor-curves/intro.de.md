---
level: advanced
age: 14+
prereqs: [lab-base-current]
teaches: [characteristic-curves, beta, saturation, operating-point]
---
## Was du siehst
Ein Transistor, vermessen wie im Labor: eine einstellbare Spannung am Kollektor, Messgeräte für Basisstrom, Kollektorstrom und Kollektor-Emitter-Spannung. Ein Potentiometer stellt den Basisstrom ein.

## Probier das
1. Klick auf **Sim** und notiere Basisstrom, Kollektorstrom und U_CE.
2. Stell die Kollektorspannung auf 2 V, dann auf 8 V. Der Kollektorstrom bleibt fast gleich.
3. Senk die Kollektorspannung auf 0,6 V. Jetzt fällt der Strom — der Transistor ist gesättigt.
4. Wähl mit dem Potentiometer einen anderen Basisstrom und wiederhole. Zeichne die Punkte auf: Du bekommst die Kennlinienschar aus dem Datenblatt.

## Was passiert hier
Im aktiven Bereich verhält sich der Kollektor wie eine Stromquelle, die der Basisstrom einstellt: I_C = Beta × I_B, egal bei welcher Spannung. Erst wenn U_CE sehr klein wird, geht dem Transistor der Spielraum aus und der Strom sinkt. Zeichne für einen Kollektorwiderstand eine Arbeitsgerade über die Kennlinien, dann siehst du, wo eine echte Verstärkerstufe arbeitet.

## Weiter geht's
- [lab-base-current](../lab-base-current) — Beta mit einer LED.
- [lab-ce-vs-follower](../lab-ce-vs-follower) — der Arbeitspunkt in einer echten Stufe.
