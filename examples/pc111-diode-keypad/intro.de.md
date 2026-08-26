# Eine Dezimaltastatur aus Dioden

Zehn Tasten, vier Leitungen, fünfzehn Dioden, kein einziger Chip. Jede Taste ist über Dioden auf genau die Bitleitungen verodert, die ihre Zahl nennt — drücke 5, und sie treibt die Einer- und die Vierer-Leitung, denn 5 ist 0101. Das ist der Teil, der aus einer Binärmaschine eine macht, in die man dezimal tippen kann. Zwei Dinge fallen auf, beide echt. Eine aktive Leitung liegt bei etwa 4,3 V statt 5 V, weil jedes Signal hier durch eine Diode läuft und eine Diode 0,7 V kostet — du siehst die Flussspannung in den LEDs. Und zwei gleichzeitig gedrückte Tasten ergeben die ODER-Verknüpfung ihrer Codes statt einer der beiden Zahlen: 1 und 2 zusammen lesen sich als 3. Eine Diodenmatrix hat keine Meinung dazu, welche Taste zuerst kam — genau deshalb sitzt hinter echten Tastaturen ein PRIORITÄTS-Encoder. Taste 0 hat gar keine Diode, also sehen „Null gedrückt" und „nichts gedrückt" gleich aus. Auch dafür haben echte Encoder eine eigene Leitung, die meldet, dass überhaupt eine Taste unten ist.

**Vermittelt:** Dioden-ODER-Kodierung, Flussspannung, warum es Prioritäts-Encoder gibt

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| key | bit lines |
|---|---|
| 1 | 0001 |
| 5 | 0101 |
| 9 | 1001 |
| 1 and 2 together | 0011 — a digit nobody pressed |
| 0 / nothing | both 0000 |

## Was du brauchst

| qty | part |
|---|---|
| 15 | Diode |
| 2 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 3 | LED 2V, green |
| 1 | LED 2V, red |
| 4 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

0 integrierte Schaltkreis(e), 3 Steckbrett(er), 5 V.
