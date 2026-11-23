# Mit dem Ferritstab die Richtung eines Senders finden

Auf dieser Schaltung gibt es keine Langdrahtantenne: Der Ferritstab selbst ist die Antenne. Er nimmt den magnetischen Anteil der Funkwelle auf und hört einen Sender am besten, wenn er quer zur Richtung der Welle liegt — und gar nicht, wenn er genau in ihre Richtung zeigt. Dreh den Stab und beobachte das Messgerät: Das scharfe Minimum verrät, wo der Sender liegt.

**Vermittelt:** Richtwirkung einer Antenne, die Achterkennlinie einer Rahmen- oder Ferritantenne, Funkpeilung

## Was zu tun ist

Klick auf **Sim**. Dreh den kleinen Knopf über der Spule (den Winkel des Stabs, 0–360°) langsam einmal ganz herum und beobachte das Messgerät. Stimm dann auf den anderen Sender ab (Abstimmknopf bei etwa 0,19) und wiederhole es.

## Was du sehen solltest

- Das Messgerät steigt über seinen Ruhestrom, wenn der Stab den Sender empfängt, und fällt in einem scharfen Minimum auf den Ruhewert zurück.
- Mit der Abstimmung auf 0,4 (der 700-kHz-Sender) liegen die Minima bei 90° und 270°: Der Sender steht genau im Norden (0°).
- Auf den 1000-kHz-Sender abgestimmt wandern die Minima nach 160° und 340°: Dieser Sender steht bei 70°.
- Jedes Minimum ist scharf, jedes Maximum breit: Der Empfang folgt |cos(Winkel − Richtung)|.

## Warum es funktioniert

Das Magnetfeld der Welle geht durch den Stab; der Stab bündelt es in der Spule, und das Feld, das sich eine Million Mal pro Sekunde ändert, erzeugt in der Wicklung eine Spannung. Es zählt nur der Anteil des Feldes längs des Stabs, und das ist das Feld mal dem Kosinus des Winkels zwischen Stab und Feld. Das Feld steht quer zur Ausbreitungsrichtung, deshalb sieht ein Stab, der auf den Sender zeigt, nichts davon. Die Basis-Emitter-Strecke des Transistors richtet gleich, was die Koppelwicklung weitergibt, und so steigt der Kollektorstrom — am Messgerät — mit dem Signal.
