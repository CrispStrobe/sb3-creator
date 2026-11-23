---
level: intermediate
age: 12+
prereqs: [pc55-ntc-indicator, pc05-npn-switch]
teaches: [temperature-sensing, thermistor, bias, transistor-switch]
---
## Was du siehst
Eine grüne LED, die „alles in Ordnung" bedeutet. Erwärm den Heißleiter, dann geht die LED aus.

## Probier das
1. Klick auf **Sim**. Die LED leuchtet.
2. Schieb den Temperaturregler am Heißleiter langsam hoch. Etwa in der Mitte geht die LED aus.
3. Dreh am Trimmer und probier es noch einmal. Schaltet sie jetzt früher oder später?

## Was passiert hier
Heißleiter und Trimmer bilden einen Spannungsteiler für die Basis des ersten Transistors. Wird der Heißleiter warm, sinkt sein Widerstand, die Basisspannung steigt, und bei etwa 0,7 V beginnt der erste Transistor zu leiten. Er zieht dann die Basis des zweiten Transistors nach Masse und nimmt ihm den Strom, der die LED anhielt. In einem echten Baukasten würdest du den ersten Transistor selbst mit den Fingern wärmen — jeder Siliziumübergang ändert seine Spannung um etwa 2 mV pro Grad.

## Weiter geht's
- [pc55-ntc-indicator](../pc55-ntc-indicator) — ein Heißleiter steuert direkt eine LED.
- [lab-battery-threshold](../lab-battery-threshold) — dieselbe Schwellen-Idee mit einer Batterie.
