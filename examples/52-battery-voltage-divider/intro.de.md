---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [voltage-measurement, battery-monitoring, scaling]
---
## Was du siehst
Ein Spannungsteiler, der eine Batteriespannung auf einen Bereich herunterbringt, der fuer den ADC-Eingang eines MCU sicher ist. Eine 9-V- oder 12-V-Batterie ist zu hoch, um sie direkt mit einem 3,3-V- oder 5-V-Mikrocontroller zu messen, also teilen zwei Widerstaende die Spannung auf den ADC-Bereich herunter.

## Probier das
1. Starte die Simulation und lies die geteilte Spannung am Mittelpunkt ab — sie sollte im sicheren Eingangsbereich des MCU liegen.
2. Aendere die Batteriespannung und beobachte, wie der Mittelpunkt proportional folgt.
3. Berechne die urspruengliche Batteriespannung aus der geteilten Spannung mit dem Widerstandsverhaeltnis und bestaetie die Uebereinstimmung.

## Was passiert hier
Der Spannungsteiler gibt Vout = Vbat * R2 / (R1 + R2) aus. Durch die richtige Wahl des Verhaeltnisses wird sichergestellt, dass Vout nie den maximalen ADC-Eingang des MCU ueberschreitet (typisch 3,3 V oder 5 V), selbst bei voller Ladespannung der Batterie. Der MCU liest Vout mit seinem ADC und berechnet Vbat ueber das bekannte Verhaeltnis. Hochohmige Widerstaende (im 100-kohm-Bereich) halten den Teilerstrom niedrig, damit er die Batterie nicht entlaedt. Genau so funktionieren Batteriestandsanzeigen in Handys und Laptops.

## Warum das wichtig ist
Die Batteriespannung zu ueberwachen ist fuer jedes tragbare Geraet wichtig — sie zeigt an, wann der Benutzer gewarnt, wann Daten gesichert und wann sicher heruntergefahren werden soll. Der Spannungsteiler ist die Standardmethode, weil er passiv, zuverlaessig und fast kostenlos ist.

## Weiter geht's
- [37-voltage-divider-basic](../37-voltage-divider-basic) — verstehe den unbelasteten Teiler, bevor du eine Batterie anschliesst.
- [39-zener-clamp](../39-zener-clamp) — fuege Ueberspannungsschutz am Teilerausgang fuer zusaetzliche Sicherheit hinzu.
- Experiment: Entwirf einen Teiler, der 0-12 V auf 0-3,3 V abbildet, berechne die Widerstandswerte und pruefe, ob der maximale Ausgang unter 3,3 V bleibt.
