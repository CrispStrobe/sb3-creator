---
level: beginner
age: 8+
prereqs: [21-resistor-led]
teaches: [zener-diode, voltage-regulation]
---
## Was du siehst
Eine Zener-Diode hält die Ausgangsspannung stabil, auch wenn die Eingangsspannung schwankt. Ein Widerstand verbindet VCC mit der Zener-Diode, die in Sperrrichtung geschaltet ist (Kathode zum Widerstand). Die Spannung über der Zener-Diode bleibt auf ihrem Nennwert — typischerweise 3,3 V oder 5,1 V.

## Probier das
1. Starte die Simulation und miss die Spannung über der Zener-Diode — sie sollte ihrem Nennwert entsprechen.
2. Ändere die Eingangsspannung (VCC) nach oben oder unten und beobachte, dass sich die Zener-Spannung kaum ändert.
3. Ersetze die Zener-Diode durch eine normale Diode und sieh, dass die Regelung verschwindet.

## Was passiert hier
Eine Zener-Diode ist so gebaut, dass sie in Sperrrichtung bei einer bestimmten Spannung leitet, der sogenannten Durchbruchspannung. Der Vorwiderstand begrenzt den Strom, damit die Zener-Diode nicht zerstört wird. Wenn die Eingangsspannung die Zener-Spannung übersteigt, begrenzt die Diode den Ausgang auf ihren Nennwert, indem sie den überschüssigen Strom aufnimmt. Fällt die Eingangsspannung unter die Zener-Spannung, hört die Diode auf zu leiten und der Ausgang folgt dem Eingang. Das ergibt einen einfachen, aber wirksamen Spannungsregler.

## Warum das wichtig ist
Viele Schaltungen brauchen eine stabile Spannung, auch wenn die Stromversorgung schwankt. Mikrocontroller, Sensoren und Kommunikationschips haben alle maximale Spannungsgrenzen. Ein Zener-Regler ist der einfachste Weg, sie zu schützen. Spannungsregelung zu verstehen ist unerlässlich, bevor man Schaltungen baut, die Bauteile mit unterschiedlichen Spannungsanforderungen mischen.

## Weiter geht's
- [21-resistor-led](../21-resistor-led) — die einfachste Schaltung zum Einstieg.
- [22-series-parallel](../22-series-parallel) — Widerstandskombinationen zu verstehen hilft bei der Berechnung des Vorwiderstands für eine Zener-Schaltung.
- Experiment: Berechne den maximalen Strom, den die Zener-Diode aushalten muss, wenn VCC 12 V beträgt, die Zener-Spannung 5,1 V und der Vorwiderstand 330 Ohm. Überprüfe deine Antwort in der Simulation.
