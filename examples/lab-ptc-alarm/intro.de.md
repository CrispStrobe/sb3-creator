# Temperaturalarm mit zwei Schwellen: steigend oder fallend

Ein Alarm, der ertönt, wenn etwas zu heiß wird, oder, mit einem Schalter, wenn es zu kalt wird. Er schaltet nicht bei derselben Temperatur zurück, sondern ein paar Grad später, und kann deshalb nicht flattern.

**Vermittelt:** Schmitt-Trigger, Hysterese, Alarmschaltungen

## Was zu tun ist

Klick auf **Sim**. Nimm den Regler **Temperatur** des Fühlers in der Instrumentenspalte: Erhöhe ihn langsam bis heißes Wasser und senke ihn dann langsam wieder. Stell den Schiebeschalter auf die andere Betriebsart und wiederhole das.

## Was du sehen solltest

- Betriebsart steigend: Der Ton beginnt bei etwa 35 °C und hört erst bei etwa 32 °C auf.
- Betriebsart fallend: still, solange es warm ist; der Ton beginnt, sobald es auf etwa 32 °C abgekühlt ist.

## Warum es funktioniert

Der LM386 vergleicht die Spannung des Fühlers mit der eingestellten Spannung. Ein Widerstand vom Ausgang zurück zum Plus-Eingang gibt etwas vom Ausgang auf den Eingang: Ist der Ausgang hoch, sieht der Eingang etwas wärmer aus, als er ist, die Temperatur muss also weiter fallen, bevor der Ausgang wieder tief werden kann. In der Betriebsart fallend macht ein PNP-Transistor aus „Ausgang tief“ ein „Ton an“.
