---
level: beginner
age: 8+
prereqs: [pc01-led-resistor]
teaches: [series-resistance, voltage-drop]
---
## Was du siehst
Eine grüne LED, versorgt über zwei Widerstände in Reihe — 1 kΩ und 2 kΩ. Die LED ist dunkler als in pc01, weil der Gesamtwiderstand höher ist.

## Probier das
1. Klick auf **Sim** und notiere die Spannung an jedem Knotenpunkt: nach R1, nach R2 und über der LED.
2. Addiere die drei Spannungsabfälle — sie sollten zusammen die 5 V der Versorgung ergeben (Kirchhoff'sche Maschenregel).
3. Ändere R2 auf 0 Ω (ein Draht). Die LED wird heller, und der Strom entspricht dem Einzel-Widerstand aus pc01.

## Was passiert hier
Widerstände in Reihe addieren sich: R_gesamt = 1 kΩ + 2 kΩ = 3 kΩ. Der Strom beträgt (5 V − 2 V) / 3 kΩ = 1,0 mA. Jeder Widerstand erzeugt einen Spannungsabfall proportional zu seinem Wert — R1 fällt 1,0 V ab, R2 fällt 2,0 V ab. Die LED bekommt weiterhin ihre ~2 V Flussspannung; der Rest verteilt sich auf die Widerstände.

## Warum das wichtig ist
Widerstände in Reihe zu schalten ist die Methode, einen Wert zu bauen, den man nicht als Einzelbauteil hat. Es zeigt außerdem die Kirchhoff'sche Maschenregel in Aktion: alle Spannungsabfälle in der Schleife ergeben zusammen die Versorgungsspannung.

## Weiter geht's
- [pc02-voltage-divider](../pc02-voltage-divider) — zwei Widerstände ohne LED, mit Fokus auf die Knotenspannung.
- [pc04-parallel-leds](../pc04-parallel-leds) — Widerstände parallel statt in Reihe.
- Experiment: Sag den Strom für R1 = 470 Ω, R2 = 330 Ω vorher und überprüfe im Simulator.
