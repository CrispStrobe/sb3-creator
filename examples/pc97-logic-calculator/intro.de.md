# Ein Rechner ohne Computer darin

Stelle A auf der einen Schalterbank ein und B auf der anderen; der 74HC283 addiert sie, und der CD4511 macht aus der 4-Bit-Antwort eine Dezimalziffer auf der Anzeige. Es gibt keine CPU, keine Firmware und nichts zu programmieren — die Antwort ist die Verdrahtung. Summen von 10 bis 15 lassen die Anzeige dunkel: ein BCD-Dekoder kennt nur 0 bis 9, und genau diese ehrliche Grenze ist der Grund, warum echte Addierer eine Dezimalkorrektur-Stufe haben.

**Vermittelt:** BCD-Dekodierung, 7-Segment-Anzeige ansteuern, die Grenzen von 4 Bit

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 3 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| A | B | display |
|---|---|---|
| 0 | 0 | 0 |
| 5 | 3 | 8 |
| 4 | 5 | 9 |
| 9 | 1 | blank (10) |
| 15 | 15 | blank, carry lit |
