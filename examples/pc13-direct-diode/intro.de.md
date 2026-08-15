---
level: beginner
age: 8+
prereqs: [pc01-led-resistor, pc08-diode-polarity]
teaches: [diode-forward-drop, series-circuit, voltage-budget]
---

## Was du siehst

Ein einziger Stromkreis: die 5-V-Versorgung, ein Widerstand mit 220 Ohm, eine
ganz normale Diode und eine grüne LED. Die LED leuchtet, aber nicht so hell wie
allein. Kein Chip, kein Programm — Strom rein, Licht raus.

## Probier das aus

1. Klick auf **Sim**. Die grüne LED leuchtet.
2. Miss die Spannung an drei Stellen im Kreis. Oben am Widerstand sollten
   **5 V** stehen, direkt darunter etwa **2,9 V** und zwischen Diode und LED
   etwa **2,1 V**.
3. Zieh das voneinander ab: Der Widerstand hat sich 5 − 2,9 = **2,1 V**
   genommen, die Diode 2,9 − 2,1 = **0,8 V** und die LED die letzten
   **2,1 V**. Zusammengezählt sind das wieder genau 5 V.
4. Öffne `circuit.json` und ändere bei der Diode `vf` von `0,7` auf `0,3` —
   das entspricht ungefähr einer Schottky-Diode. Lass es noch einmal laufen:
   Die LED wird etwas heller, weil die Diode weniger für sich behält.
5. Stell `vf` wieder auf `0,7` zurück.

## Was dahintersteckt

Stell dir die 5 V wie Taschengeld vor, das restlos ausgegeben sein muss, bis
der Strom wieder zu Hause ankommt. Jedes Bauteil im Kreis nimmt sich seinen
Anteil.

Die LED und die Diode sind bei ihrem Anteil eigen: Sie nehmen sich fast immer
gleich viel, egal was passiert — hier etwa **2,1 V** für die grüne LED und
etwa **0,8 V** für die Diode. Darüber lässt sich nicht verhandeln.

Beim Widerstand ist es umgekehrt. Er nimmt, was übrig bleibt — hier 2,1 V — und
genau dieser Rest bestimmt den Strom. 2,1 Volt an 220 Ohm ergeben
2,1 ÷ 220 = **0,0096 Ampere**, also rund **9,6 Milliampere**. Dieser Strom
fließt durch alles im Kreis, denn in einer einzigen Schleife gibt es keinen
anderen Weg.

Und jetzt der Teil, den man sich merken sollte: Alle sagen "eine Diode
verbraucht 0,7 Volt" — diese hier verbraucht 0,8. Das ist kein Fehler. Der
Anteil einer Diode wächst langsam mit, je mehr Strom man durchschickt, und die
0,7 V sind bei viel kleinerem Strom gemessen als hier. Deshalb kommt bei der
glatten Rechnung (5 − 0,7 − 2,0) ÷ 220 = 10,5 mA rund 10 % zu viel heraus. Gut
genug zum Planen, nicht gut genug, um es exakt zu nennen.

## Warum das wichtig ist

Wer viele Bauteile in eine Schleife hängt, stapelt auch ihre Spannungsanteile —
und irgendwann sind die Volt alle. Zwei LEDs plus diese Diode bräuchten schon
2,1 + 2,1 + 0,8 = 5 V, bevor der Widerstand überhaupt etwas bekommt; die
Schaltung würde kaum noch glimmen. Wenn man die Anteile kennt, weiß man vorher,
ob eine Idee funktionieren kann.

## Wie es weitergeht

- **Als Nächstes:** [pc17-current-compare](../pc17-current-compare) — dieselbe
  Idee, aber drei Schleifen nebeneinander mit verschiedenen Widerständen.
- **Danach:** [pc18-zener-clamp](../pc18-zener-clamp) — eine besondere Diode,
  die sich absichtlich einen großen, genau festgelegten Anteil nimmt.
- **Zum Ausprobieren:** Bau eine *zweite* normale Diode in den Kreis, in
  dieselbe Richtung. Rate die neue LED-Spannung, bevor du es laufen lässt.
  (Tipp: 0,8 V müssen irgendwo herkommen, und beweglich ist nur der
  Widerstand.)
