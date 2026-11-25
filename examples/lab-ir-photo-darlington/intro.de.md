# IR-Empfänger: Fototransistor allein oder Foto-Darlington

**Vermittelt:** Infrarot-Strecke, Fototransistor, Darlington, Empfindlichkeit

## Was zu tun ist

Klick auf **Sim**: Die rote LED glimmt. Ändere den Abstand der Lichtstrecke (light_path_12) von 1 bis 30 cm. Schieb EMPFÄNGER (slide_switch_6) nach rechts und wiederhole das. Heb bei 30 cm den Lichtregler des Fototransistors (phototransistor_5) ein wenig an: Raumlicht.

## Was du sehen solltest

- Allein: Rot nur auf wenige Zentimeter.
- Foto-Darlington: Grün bis 20–30 cm.
- Mit dem Darlington bringt schon etwas Raumlicht die grüne LED zum Leuchten.

## Warum es funktioniert

Der Fototransistor lässt einen Strom durch, der zum Licht auf ihm proportional ist, und das Licht der IR-LED verteilt sich mit dem Abstand schnell. Allein reicht sein Strom nur aus der Nähe für eine LED. Ein zweiter Transistor verstärkt diesen Strom etwa hundertfach: Der Empfänger reicht viel weiter, aber jetzt wird auch schwaches Raumlicht genauso verstärkt.
