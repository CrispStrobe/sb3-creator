# Mikrofonverstärker: ein Transistor-Vorverstärker vor dem Verstärkerchip

Ein Lautsprecher funktioniert auch rückwärts, als Mikrofon, liefert aber nur Bruchteile eines Millivolts. Ein Transistor hebt das etwa hundertfach an; ein Lautstärkeregler bestimmt dann, wie viel davon der Verstärkerchip an den Ohrhörer weitergibt.

**Vermittelt:** Vorverstärkerstufe, Arbeitspunkt über Kollektor-Gegenkopplung, Lautstärkeregler zwischen zwei Stufen

## Was zu tun ist

Klick auf **Sim**. In der Instrumentenspalte stellt der Regler **Stimme** ein, wie laut du in den Lautsprecher sprichst. Dreh das Lautstärke-Poti herunter und wieder hoch. Leg das Oszilloskop an den Kollektor des Transistors und an den Ausgang des Verstärkers.

## Was du sehen solltest

- Der Kollektor ruht bei etwa 4,8 V und schwankt beim Sprechen um einige zehn Millivolt.
- Der Verstärkerausgang schwingt bei voller Lautstärke etwa 1,6 V von Spitze zu Spitze, zurückgedreht weniger.
- Stimme auf 0: fast nichts.

## Warum es funktioniert

Der Transistor macht aus kleinen Änderungen an der Basis größere Änderungen des Kollektorstroms; der 4,7-kΩ-Arbeitswiderstand macht daraus Spannung. Die Basis bekommt ihren Strom über 470 kΩ vom eigenen Kollektor, so findet die Stufe ihren Arbeitspunkt selbst, egal wie stark der Transistor verstärkt. Das Poti ist ein Spannungsteiler: Es gibt einen Teil des Vorverstärkersignals weiter, und der Chip verstärkt das zwanzigfach und treibt den Ohrhörer.
