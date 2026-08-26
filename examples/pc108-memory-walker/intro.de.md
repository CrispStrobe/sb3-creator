# Die Maschine liest ihren eigenen Speicher

Hier wird nichts mehr von Hand angefasst außer dem Takt. Der Programmzähler legt eine Adresse auf den Bus, das Adressregister übernimmt sie, das RAM antwortet mit dem dort Gespeicherten, und die grünen LEDs zeigen die Antwort — der nächste Takt macht dasselbe eine Adresse weiter. Erst laden: Daten einstellen, WRITE drücken, weitertakten, wiederholen. Dann nur noch takten und zusehen, wie die Maschine durch das läuft, was du geschrieben hast. Das Timing ist die eigentliche Lektion: Die Zustände schalten mit der STEIGENDEN Taktflanke weiter, die Register übernehmen mit der FALLENDEN — über einen Inverter. So ist der Bus eingeschwungen und der richtige Treiber aktiv, bevor irgendetwas übernommen wird. Die Inverterbank am RAM-Ausgang sitzt dort, weil der 74LS189 seine Daten invertiert zurückgibt.

**Vermittelt:** Taktphasen, Übernahme mit der fallenden Flanke, Adress- und Datenpfad

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 4 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| action | data LEDs |
|---|---|
| write 3,9,5,12 | into cells 0-3 |
| then clock | cell 0 shows 3 |
| clock | 9 |
| clock | 5 |
| clock | 12 |

## Was du brauchst

| qty | part |
|---|---|
| 1 | 74HC04 Hex NOT |
| 1 | 74HC08 Quad AND |
| 1 | 74HC244 Octal Tri-State Buffer |
| 1 | 74LS161 4-bit Counter |
| 1 | 74LS173 4-bit Register |
| 1 | 74LS189 16x4 RAM |
| 1 | 4-way DIP Switch (SPST) |
| 1 | 4-way DIP Switch (SPST) |
| 4 | LED 2V, green |
| 4 | LED 2V, red |
| 4 | LED 2V, yellow |
| 4 | Resistor 100kΩ |
| 6 | Resistor 10kΩ |
| 12 | Resistor 330Ω |

6 integrierte Schaltkreis(e), 4 Steckbrett(er), 5 V.
