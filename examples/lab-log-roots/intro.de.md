# Quadrat- und Kubikwurzel mit Logarithmierverstärkern

Vor dem Taschenrechner zog man Wurzeln mit Logarithmen: Den Logarithmus halbieren, und man hat den Logarithmus der Quadratwurzel. Diese Schaltung macht das mit Transistoren, deren Spannung der Logarithmus ihres Stroms ist.

**Vermittelt:** Logarithmen, Logarithmier- und Delogarithmierverstärker, analoges Rechnen

## Was zu tun ist

Klick auf **Sim**. Dreh **INPUT** ganz auf (x = 100 am Eingangsmessgerät) und lies das Ausgangsmessgerät ab (1 V = 10). Probier x = 25. Schieb dann **ROOT** auf die Kubikwurzel und probier x = 100 und x = 8.

## Was du sehen solltest

- Quadratwurzel: 100 → etwa 10, 25 → etwa 5.
- Kubikwurzel: 100 → etwa 4,6, 8 → etwa 2.

## Warum es funktioniert

Der erste Operationsverstärker zwingt den Eingangsstrom durch einen Transistor; dessen Basis-Emitter-Spannung ist dann proportional zum Logarithmus dieses Stroms. Eine zweite Stufe macht dasselbe für feste 1 µA. Ein Spannungsteiler genau in der Mitte zwischen beiden Spannungen bildet den Mittelwert, den Logarithmus der Quadratwurzel aus dem Produkt; bei einem Drittel ist es die Kubikwurzel. Ein letzter Transistor macht aus dieser Spannung wieder einen Strom, den das Messgerät zeigt.
