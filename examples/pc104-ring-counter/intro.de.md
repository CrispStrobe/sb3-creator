# Der Ringzähler — sechs Takte für jeden Befehl

Ein SAP-1 erledigt einen Befehl nicht in einem Rutsch: er braucht sechs Zeitschritte, T1 bis T6, und genau einer ist jeweils aktiv. T1–T3 sind für jeden Befehl gleich (Adresse ausgeben, Speicher lesen, Zähler weiterschalten); T4–T6 machen den Unterschied zwischen LDA und ADD. Ein CD4017 ist von Haus aus one-hot, und wenn man seinen siebten Ausgang auf den eigenen RESET zurückführt, springt er nach sechs Schritten um — ein Sechs-Schritt-Ringzähler aus einem Chip und einem Draht.

**Vermittelt:** One-hot-Zählen, Zeitschritte, einen Zähler sich selbst zurücksetzen lassen

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| clocks | active state |
|---|---|
| 0 | T1 |
| 1 | T2 |
| 5 | T6 |
| 6 | T1 again |

## Was du brauchst

| qty | part |
|---|---|
| 1 | CD4017 Decade Counter |
| 1 | 4-way DIP Switch (SPST) |
| 5 | LED 2V, green |
| 1 | LED 2V, yellow |
| 1 | Resistor 10kΩ |
| 6 | Resistor 330Ω |

1 integrierte Schaltkreis(e), 2 Steckbrett(er), 5 V.
