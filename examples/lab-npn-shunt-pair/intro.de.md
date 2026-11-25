---
level: beginner
age: 10+
prereqs: [lab-led-shunt]
teaches: [transistor, shunt, current-paths]
---
## Was du siehst
Zwei kleine Schaltungen nebeneinander. In jeder speist ein 470-Ω-Widerstand eine grüne LED (mit einer Diode davor) und daneben eine rote LED in Reihe mit einem Transistor.

## Probier das
1. Klick auf **Sim**. Links leuchtet Grün, rechts Rot.
2. Halte **ON** (links): Grün geht aus, Rot leuchtet.
3. Halte **OFF** (rechts): Rot geht aus, Grün leuchtet.

## Was passiert hier
Der Strom aus dem 470-Ω-Widerstand nimmt den Weg, der die wenigste Spannung braucht. Der grüne Weg braucht etwa 2,8 V (Diode plus grüne LED). Der rote braucht etwa 2 V, aber nur, solange sein Transistor leitet; sperrt der Transistor, ist der Weg zu. Links bekommt die Basis nur Strom, solange **ON** gedrückt ist: Drücken verlegt den Strom von Grün nach Rot. Rechts wird die Basis dauernd über 10 kΩ versorgt, also leuchtet normalerweise Rot; **OFF** legt die Basis an Masse und nimmt ihr den Strom: Der Transistor sperrt, der Strom geht zurück zu Grün. Derselbe Transistor-Nebenschluss, nur umgekehrt benutzt.

## Weiter geht's
- [lab-led-shunt](../lab-led-shunt) — ein Nebenschluss mit einem einfachen Schalter.
