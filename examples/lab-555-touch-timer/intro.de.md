# Berührungs-Zeitschalter mit Brummschutz

Berühr den Sensor, und ein Relais schaltet eine Lampe für ein paar Sekunden ein. Aber ein blanker Sensordraht ist auch eine Antenne: Neben einem Netzkabel fängt er Brummen ein und schaltet von selbst. Ein Widerstand und ein Kondensator schützen ihn.

**Vermittelt:** Monoflop, hochohmige Eingänge, Störungen

## Was zu tun ist

Klick auf **Sim**. Drück kurz die Fingertaste (button_11): die Lampe leuchtet etwa 2,4 s. Dreh den Knopf der Feldsonde (field_probe_13) ganz auf: ein Netzkabel direkt neben dem Sensordraht. Nichts passiert. Öffne jetzt SCHUTZ (switch_8).

## Was du sehen solltest

- Finger: Relais (relay_14) und Lampe etwa 2,4 s an.
- Kabel nah, SCHUTZ geschlossen: nichts.
- Kabel nah, SCHUTZ offen: die Lampe geht von selbst an.

## Warum es funktioniert

Der Timer startet, wenn sein Trigger-Eingang unter ein Drittel der Versorgung fällt. Dein Finger zieht ihn über die Haut nach unten. Ohne Schutz hält ihn nur ein riesiger Widerstand oben, deshalb verschiebt ihn der winzige Strom, den das Netzkabel über ein paar Pikofarad einkoppelt, um viele Volt – genug zum Starten. Der kleinere Widerstand und der Kondensator des Schutzes schließen das Brummen kurz, dein Finger kommt aber trotzdem durch.
