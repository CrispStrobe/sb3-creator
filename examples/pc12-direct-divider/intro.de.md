---
level: beginner
age: 10+
prereqs: [pc09-direct-led]
teaches: [voltage-divider, direct-wiring]
---
## Was du siehst
Zwei gleiche 10-kΩ-Widerstände in Reihe an einer 9-V-Batterie, direkt verdrahtet ohne Steckbrett. Der Knotenpunkt dazwischen liegt bei genau 4,5 V.

## Probier das
1. Klick auf **Sim** und lies die Spannung am Knotenpunkt ab.
2. Ändere R2 auf 30 kΩ. Die Knotenspannung sinkt — rechne den neuen Wert mit der Formel aus, bevor du nachschaust.
3. Tausche R1 und R2 (mach R1 = 30 kΩ, R2 = 10 kΩ). Die Spannung verschiebt sich in die andere Richtung.

## Was passiert hier
Das ist derselbe Spannungsteiler wie in pc02, aber mit direkten Drähten gezeichnet, damit du siehst, dass nichts versteckt ist — nur zwei Widerstände, und die Spannung teilt sich proportional: V_out = V_in × R2 / (R1 + R2). Bei gleichen Widerständen liegt der Knotenpunkt immer bei der halben Versorgungsspannung.

## Warum das wichtig ist
Eine Schaltung ohne Steckbrett zu lesen ist das Gleiche wie einen Schaltplan zu lesen — das Layout fällt weg und nur die Verbindungen bleiben. Wenn du diese Schaltung verfolgen kannst, kannst du jeden Spannungsteiler-Schaltplan in einem Datenblatt lesen.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — dieselbe Schaltung auf einem Steckbrett.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — ersetze einen Widerstand durch einen Temperatursensor.
- Experiment: Welches Verhältnis von R1 zu R2 ergibt genau 3,3 V aus einer 5-V-Versorgung?
