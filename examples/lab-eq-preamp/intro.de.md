# Vorverstärker mit Entzerrer-Gegenkopplung

Ein Plattenspieler-Tonabnehmer liefert zu viele Höhen und zu wenig Bässe. Abhilfe schafft ein Verstärker, dessen Gegenkopplung von der Frequenz abhängt: Er lässt die Bässe mit voller Verstärkung durch und regelt die Höhen herunter.

**Vermittelt:** mehrstufiger Verstärker, frequenzabhängige Gegenkopplung, Entzerrung

## Was zu tun ist

Klick auf **Sim**. Stell den **Funktionsgenerator** auf 100 Hz und dann auf 3000 Hz, jeweils mit geschlossenem und offenem Schalter **EQ**, und beobachte den Ausgang am Oszilloskop oder hör hin.

## Was du sehen solltest

- Bei 100 Hz macht der EQ kaum einen Unterschied.
- Bei 3 kHz macht der EQ den Ausgang um ein Mehrfaches kleiner.

## Warum es funktioniert

Die Verstärkung des Chips wird von einem internen Widerstand vom Ausgang zurück zu Pin 1 bestimmt. Das EQ-Netzwerk legt einen Widerstand parallel — aber über einen Kondensator, der nur hohe Frequenzen leitet. Mehr Gegenkopplung heißt weniger Verstärkung, also werden nur die Höhen leiser.
