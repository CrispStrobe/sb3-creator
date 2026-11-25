# Präzisions-Wechselspannungsmesser: Mittelwert gegen Spitzenwert

Eine Wechselspannung ändert sich ständig. Welche Zahl soll ein Messgerät also anzeigen? Dieses kann zwei: den Mittelwert der gleichgerichteten Welle oder ihren Spitzenwert. Ein Operationsverstärker richtet so genau gleich, dass sich sogar ein Zehntel Volt messen lässt.

**Vermittelt:** Präzisionsgleichrichter (Superdiode), Mittel-, Spitzen- und Effektivwert, Messbereiche

## Was zu tun ist

Klick auf **Sim** und öffne das Oszilloskop. Lies das Messgerät mit **MODE** auf Mittelwert ab, schieb MODE dann auf Spitze. Schieb MODE danach zurück auf Mittelwert, dreh **LEVEL** ganz herunter (etwa 5 %) und schieb **RANGE** auf 100 mV.

## Was du sehen solltest

- Mittelwert: etwa 0,56 V. Spitzenwert: etwa 1,8 V, gut dreimal so viel.
- Im 100-mV-Bereich gibt ein zwanzigmal kleineres Signal noch einen deutlichen Ausschlag.

## Warum es funktioniert

Eine gewöhnliche Diode braucht 0,6 V, bevor sie leitet, und würde kleine Signale ganz verschlucken. In der Gegenkopplung des Operationsverstärkers treibt dieser seinen Ausgang einfach 0,6 V höher, und hinter der Diode folgt die Spannung genau dem Eingang, solange er positiv ist. Das Messgerät sieht die Halbwellen: vom Kondensator gemittelt ergeben sie Spitze/π; liegt der Kondensator direkt am Ausgang, hält er die Spitze. Bei einer Sinusspannung ist der Effektivwert, der einen Widerstand so heizt wie Gleichspannung, Spitze/√2.
