---
level: beginner
age: 10+
prereqs: [pc01-led-resistor]
teaches: [voltage-divider, kirchhoff]
---
## Was du siehst
Zwei gleiche 10-kΩ-Widerstände in Reihe an einer 9-V-Batterie. Der Punkt dazwischen liegt bei genau 4,5 V — der Hälfte der Versorgungsspannung.

## Probier das
1. Klick auf **Sim** und lies die Spannung am Knotenpunkt zwischen R1 und R2 ab.
2. Ändere R2 auf 20 kΩ. Die Knotenspannung verschiebt sich — sag vorher, in welche Richtung.
3. Mach R1 viel größer als R2 (z. B. 100 kΩ vs. 1 kΩ). Wo landet die Spannung?

## Was passiert hier
Ein Spannungsteiler teilt die Versorgungsspannung im Verhältnis der beiden Widerstände auf. Die Formel lautet V_out = V_in × R2 / (R1 + R2). Bei gleichen Widerständen bekommt man die Hälfte; durch Ändern des Verhältnisses lässt sich jede Spannung zwischen 0 und V_in einstellen. Der Strom durch beide Widerstände ist gleich, weil sie in Reihe liegen: I = 9 V / 20 kΩ = 0,45 mA.

## Warum das wichtig ist
Spannungsteiler stecken überall — in Sensorschaltungen, Arbeitspunkteinstellungen und Pegelwandlern. Sie zu verstehen ist der Schlüssel zum Lesen fast jedes analogen Schaltplans.

## Weiter geht's
- [pc07-pot-dimmer](../pc07-pot-dimmer) — ein Potentiometer ist ein stufenlos verstellbarer Spannungsteiler.
- [pc33-thermistor-divider](../pc33-thermistor-divider) — ersetze einen Widerstand durch einen Temperatursensor.
- Experiment: Berechne V_out für R1 = 3,3 kΩ, R2 = 6,8 kΩ, und überprüfe dein Ergebnis im Simulator.
