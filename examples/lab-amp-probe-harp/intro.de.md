# Prüftongeber und Berührungsharfe

Die Tonhöhe dieses Tongenerators hängt vom Widerstand zwischen zwei Prüfspitzen ab. Überbrückt man sie mit einer Widerstandskette, hat man eine Harfe; legt man etwas Unbekanntes dazwischen, verrät der Ton, wie gut es leitet.

**Vermittelt:** Tonhöhe eines RC-Oszillators, Widerstandskette, Durchgangsprüfung

## Was zu tun ist

Klick auf **Sim**. Drück nacheinander die vier Berührungstasten (button_13 bis button_16, von links nach rechts). Halte dann die fünfte Taste (button_17, die Prüfspitzen) gedrückt und dreh am Knopf (potentiometer_18, der Prüfling).

## Was du sehen solltest

- Jeder Berührungspunkt spielt seinen eigenen Ton; je weiter hinten in der Kette, desto tiefer.
- Mit den Spitzen am Prüfling sinkt der Ton, wenn sein Widerstand steigt, und verstummt am Ende des Drehwegs ganz.

## Warum es funktioniert

Der Kondensator am −-Eingang lädt sich über den Widerstand zwischen den Spitzen auf. Mehr Widerstand heißt langsameres Laden, also kippt der Verstärker seltener. Bei zu viel Widerstand kommt der Kondensator nie hoch genug, um ihn kippen zu lassen.
