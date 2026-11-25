# Zwei-Bit-Analog-Digital-Wandler mit Operationsverstärkern und einem Transistor

Ein Computer braucht Zahlen, keine Spannungen. Dieser Wandler vergleicht den Eingang gleichzeitig mit drei Spannungen und zeigt das Ergebnis als zweistellige Binärzahl auf zwei LEDs: 00, 01, 10 oder 11.

**Vermittelt:** Komparatoren, Parallel-Wandler, Binärzahlen, Dekodieren mit Dioden und einem Transistor

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf **INPUT** langsam von 0 bis zum Anschlag und beobachte das Messgerät und die beiden LEDs.

## Was du sehen solltest

- Unter 1,5 V: beide aus (00).
- 1,5 bis 3 V: nur Bit 0 (01).
- 3 bis 4,5 V: nur Bit 1 (10).
- Über 4,5 V: beide (11).

## Warum es funktioniert

Drei Operationsverstärker vergleichen den Eingang je mit einer Sprosse einer Widerstandsleiter, 1,5, 3 und 4,5 V. Sie schalten beim Hochdrehen nacheinander ein. Der mittlere ist direkt das hohe Bit. Das niedrige Bit muss über 1,5 V an, über 3 V wieder aus und über 4,5 V wieder an sein: Ein Transistor, den der mittlere Komparator schaltet, schließt das Signal des untersten kurz, und der oberste erreicht die LED über seine eigene Diode.
