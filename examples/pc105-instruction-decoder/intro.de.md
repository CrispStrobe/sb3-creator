# Der Befehlsdekoder — aus einer Zahl wird eine Bedeutung

Vier Schalter sind der Opcode, fünf LEDs sind die Befehle: 0000 ist LDA, 0001 ADD, 0010 SUB, 1110 OUT, 1111 HLT. Zwei 74HC138-Dekoder teilen sich nach dem obersten Bit auf — einer ist freigegeben, solange es LOW ist, der andere, solange es HIGH ist. Genau dafür sind die drei Freigabe-Pins eines Dekoders da. Die Ausgänge sind LOW-AKTIV, deshalb hängt jede LED von +5 V nach unten IN den Chip hinein und leuchtet, wenn ihre Leitung auf LOW geht.

**Vermittelt:** Dekoder, Freigabe-Pins, Low-aktive Ausgänge

## Was zu tun ist

Stelle die DIP-Schalter und beobachte die Ausgänge. Der Aufbau braucht 2 Steckbretter — echter Logik gehen die Löcher schnell aus.

Jeder Chip bekommt +5 V und GND — ein IC ohne Versorgung tut nichts, und ein offener Eingang tut Schlimmeres: er liest, was der Raum gerade macht. Genau das verhindern die 10-kΩ-Pulldowns.

## Was du sehen solltest

| opcode | decoded |
|---|---|
| 0000 | LDA |
| 0001 | ADD |
| 0010 | SUB |
| 1110 | OUT |
| 1111 | HLT |
| 0111 | nothing — not an instruction |
