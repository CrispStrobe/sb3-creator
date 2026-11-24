# Rückkopplungsempfänger mit MOSFET

Wieder der Rückkopplungsempfänger, diesmal mit einem n-Kanal-MOSFET statt des Transistors. Das Gate eines MOSFET nimmt keinen Strom auf, deshalb gibt es hier keine Audion-Gleichrichtung am Gitterwiderstand: Das Gate liegt auf der Spannung, die der Knopf einstellt, und der Kanal selbst richtet gleich. Sein Strom wächst mit dem Quadrat der Gatespannung über der Schwelle, also hebt eine HF-Schwingung am Gate den mittleren Strom, und bei einem AM-Sender trägt dieser Mittelwert das Programm. Eine kleine Wicklung im Drain führt einen Teil des Signals in den Schwingkreis zurück: Der Knopf bestimmt, wie stark der MOSFET verstärkt und damit wie stark er rückkoppelt.

**Vermittelt:** Schwellspannung des MOSFET, quadratische Gleichrichtung, Rückkopplung bis zur Selbsterregung

## Was zu tun ist

Klick auf **Sim** und hör mit dem Knopf auf 0,80 hin. Dreh ihn langsam auf 0,77 und weiter auf 0,72. Miss die Gatespannung und das obere Ende des Schwingkreises.

## Was du sehen solltest

- Auf 0,80 liegt das Gate unter der Schwelle (etwa 1,8 V gegen 2 V): kein Drainstrom, Stille.
- Auf 0,77 fließt ein wenig Strom, und der 400-Hz-Ton des Senders ist leise im Ohrhörer: Das quadratische Verhalten des Kanals richtet ihn gleich.
- Weiter gedreht übersteigt die Verstärkung die Verluste des Schwingkreises, und er schwingt: Die HF am Kreis springt auf einige Volt.

## Warum es funktioniert

Unter der Schwelle ist der Kanal zu; darüber wächst der Drainstrom mit dem Quadrat der überschüssigen Gatespannung. Ein quadratisches Gesetz macht aus einer HF-Schwingung zusätzlichen mittleren Strom — Gleichrichtung ohne Diode. Die Rückkopplungswicklung im Drain gibt einen Teil der verstärkten HF in den Kreis zurück und ersetzt einen Teil seiner Verluste: Der Sender wird lauter und die Abstimmung schärfer, bis ab einer bestimmten Gatespannung die Rückkopplung gewinnt und die Stufe von selbst schwingt.
