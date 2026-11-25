---
level: intermediate
age: 11+
prereqs: [cp1-first-display]
teaches: [boolean-logic, cp1-input, output]
---
## Bedingter Ausgang

Importiere ein kompatibles Monitor-ROM mit 2048 Bytes. Starte die CPU, bis der Monitor bereit ist. Halte die CPU an und lade die Zellen. Setze die CPU-Ausführung ohne Reset fort und wähle die Startadresse auf der CP1-Tastatur.

Stelle P1 über **Instrumente → Schalter** ein. Ein offener Schalter liest sich als High, ein geschlossener als Low. Schalter 1 ist das niederwertigste Bit. Verwende switch2 und switch7. Die LED liegt an P2.4, also an Lehranschluss 5.

P2-Anschluss 5 wird nur dann High, wenn P1-Anschluss 2 High und P1-Anschluss 7 Low ist. Die beiden Eingangspegel vor `030 PC RUN` einstellen und bis zum Anhalten halten. Jeden Test bei 030 beginnen. Nach sieben Lehrbefehlen ohne programmierte Wartezeit erscheint `P  037`. **ACC** zeigt das Ausgangsbit als `A00.000` oder `A00.001`. Die übrigen P2-Ausgangsbits bleiben erhalten. Der Grundspeicher genügt. Belegt sind 030–036 und 046.

| P1 terminal 2 | P1 terminal 7 | P2 terminal 5 | P2 with other bits high / P2 mit übrigen Bits High |
| --- | --- | --- | --- |
| Low | Low | Low | `0xEF` |
| Low | High | Low | `0xEF` |
| High | Low | High | `0xFF` |
| High | High | Low | `0xEF` |
