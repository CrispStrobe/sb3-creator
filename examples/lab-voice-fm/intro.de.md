# Sprich in den Lautsprecher: deine Stimme verbiegt den Ton

Ein Lautsprecher funktioniert auch rückwärts. Schall drückt auf seine Membran, die Spule bewegt sich im Magnetfeld und eine winzige Spannung entsteht. Verstärkt man sie und gibt sie auf den Steuereingang eines Oszillators, bringt deine Stimme dessen Tonhöhe zum Zittern.

**Vermittelt:** Lautsprecher als Mikrofon, Mikrofonempfindlichkeit, Frequenzmodulation

## Was zu tun ist

Klick auf **Sim** und hör auf den Piezo. In der Instrumentenspalte stellt der Regler **Schall** ein, wie laut du in den Lautsprecher sprichst (dB). Zieh ihn auf 0 und dann wieder auf 94 oder 100. Schließ das Oszilloskop an den Ausgang des 555 an, um die Periode zu sehen.

## Was du sehen solltest

- Still: ein sauberer, gleichmäßiger Ton von etwa 680 Hz.
- Beim Sprechen: im Mittel dieselbe Tonhöhe, aber sie zittert: Jede Periode ist ein paar Prozent länger oder kürzer, im Takt deiner Stimme.
- Je lauter du sprichst, desto stärker das Zittern.

## Warum es funktioniert

Der Lautsprecher liefert nur etwa einen halben Millivolt pro Pascal, deshalb verstärkt der LM386 zweihundertfach. Diese Spannung gelangt über einen Kondensator an den Steuereingang des 555, der die Schwellen festlegt, zwischen denen sein Zeitkondensator lädt. Höhere Schwelle, längere Periode: Die Frequenz des Tons folgt der Stimme. UKW-Radio (FM) arbeitet genauso, nur mit einem viel schnelleren Oszillator.
