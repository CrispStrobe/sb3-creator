# Eine Temperatur als Licht gesendet und als Tonhöhe gehört

Die Spannung eines Temperaturfühlers, verstärkt von einem Verstärkerchip, bestimmt, wie hell eine LED in einen Lichtleiter leuchtet. Am anderen Ende speist ein Fototransistor einen Oszillator aus zwei Transistoren: Je mehr Licht ankommt, desto höher pfeift er. Wird der Fühler wärmer, steigt der Ton.

**Vermittelt:** analoge Übertragung eines Messwerts, ein lichtgesteuerter Oszillator

## Was zu tun ist

Klick auf **Sim**. Stell die Umgebung des PTC auf 25 °C, dann auf 45 °C, und hör auf den Piezo.

## Was du sehen solltest

- 25 °C: ein Ton von etwa 540 Hz.
- 45 °C: Der Ausgang des LM386 steigt, die LED leuchtet heller, und der Ton ist höher.

## Warum es funktioniert

Der PTC liegt unter 22 kΩ, seine Spannung steigt also um einige Millivolt pro Kelvin; der LM386 vergleicht sie mit dem Einstellpoti und verstärkt den Unterschied zwanzigfach, das bestimmt den Strom der LED. Am anderen Ende ist der Strom des Fototransistors durch 2,2 kΩ die Spannung, aus der die Basiswiderstände des Multivibrators laden: mehr Licht, schnelleres Laden, höherer Ton. Die Tonhöhe ändert sich aber auch, wenn der Lichtleiter Licht verliert; diese Schwäche vermeidet die pulskodierte Fassung.
