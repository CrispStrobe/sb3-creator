# Der Bus — eine Leitung, viele Sprecher

Zwei Quellen, ein Vier-Bit-Bus. Gib A frei, und der Bus zeigt A; gib B frei, und er zeigt B; gib keinen frei, und die Pulldowns ziehen ihn auf null. Möglich macht das der Tristate-Treiber im 74HC244: sein Ausgang kann HIGH, LOW oder ganz LOSGELASSEN sein — ein drittes Verhalten, das ein gewöhnliches Gatter nicht hat. Gib jetzt BEIDE gleichzeitig frei. Ein Chip zieht eine Leitung hoch, während der andere sie herunterzieht, die Spannung landet in der Mitte, wo sie weder 1 noch 0 ist, und beide Chips werden warm. Das ist Busklemmung — und sie zu verhindern ist genau der Grund, warum es ein Steuerwerk gibt.

**Vermittelt:** Tristate-Ausgänge, Busklemmung, warum ein Steuerwerk nötig ist

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| enabled | bus |
|---|---|
| neither | 0000 |
| A only | shows A |
| B only | shows B |
| both | neither 1 nor 0 — contention |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 2 | 74HC244 Octal Tri-State Buffer |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 10 | Resistor 10kΩ |
| 4 | Resistor 330Ω |

3 integrierte Schaltkreis(e), 3 Steckbrett(er), 5 V.
