# Lichtschranke mit gepulstem Strahl: Der PLL-Oszillator schlägt Alarm

Eine Lichtschranke, die sich von keiner Taschenlampe täuschen lässt: Der Strahl blinkt 2000-mal pro Sekunde, und der Empfänger hört nur auf das Blinken. Tritt in den Strahl, und der Oszillator eines PLL-Bausteins schlägt Alarm.

**Vermittelt:** gepulste Lichtstrecken, Diodenpumpen, der Sperreingang des Oszillators

## Was zu tun ist

Klick auf **Sim**. Stell den Regler des Lichtwegs (wie viel vom Strahl verdeckt ist) auf 1, warte einen Moment und stell ihn zurück auf 0.

## Was du sehen solltest

- Strahl frei: Stille.
- Strahl verdeckt: Nach wenigen Millisekunden setzt ein Alarmton von 500 Hz ein.
- Strahl wieder frei: Stille.

## Warum es funktioniert

Jeder Lichtblitz, der den Fototransistor erreicht, passiert den kleinen Kondensator, wird vom Transistor verstärkt und schiebt über die Diodenpumpe etwas Ladung in einen Kondensator. Die Impulse halten diesen Kondensator geladen, und seine Spannung hält den Sperreingang INHIBIT des 4046 hoch, was den Oszillator anhält. Wird der Strahl verdeckt, entlädt sich der Kondensator über seinen Widerstand; unter der halben Betriebsspannung läuft der Oszillator an. Gleichmäßiges Licht von einer Lampe oder der Sonne liefert gar keine Impulse und kann den Alarm deshalb nicht verhindern.
