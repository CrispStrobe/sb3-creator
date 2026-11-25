# Weckradio mit MOSFET-Demodulator

Ein Einkreisradio, dessen Demodulator ein MOSFET ist: Das Poti spannt sein Gate knapp über den Punkt vor, an dem er zu leiten beginnt, also kommt nur eine Hälfte der Hochfrequenzwelle durch, und das Programm erscheint an seinem Drain. Seine Source geht nicht direkt an Masse, sondern über einen Fototransistor — im Dunkeln kann der MOSFET gar nicht leiten.

**Vermittelt:** quadratische Demodulation in einem Feldeffekttransistor, ein Lichtschalter im Strompfad

## Was zu tun ist

Klick auf **Sim**, während der **Licht**-Regler des Fototransistors auf dunkel steht: Stille. Schieb den Regler dann auf volles Licht.

## Was du sehen solltest

- Dunkel: Der Lautsprecher schweigt, und der Drain des MOSFET liegt bei 9 V.
- Hell: Der Drain fällt auf etwa 7,7 V, und der 400-Hz-Ton des Senders spielt.

## Warum es funktioniert

Der Drainstrom eines MOSFET wächst mit dem Quadrat dessen, wie weit das Gate über der Schwelle liegt. Genau dort vorgespannt, lässt die Hälfte jeder Hochfrequenzschwingung, die das Gate anhebt, Strom fließen, die andere nicht; über viele Schwingungen gemittelt folgt der Strom der Lautstärke des Senders — dem Programm. Der Fototransistor ist der einzige Weg dieses Stroms zur Masse: Nur wenn Licht auf ihn fällt, kann das Radio spielen.
