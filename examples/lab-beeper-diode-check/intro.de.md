# Diodenprüfer mit Piepser

Ein Piepser ertönt, sobald Strom von der roten zur schwarzen Prüfspitze fließen kann. Steckt eine Diode dazwischen, verrät er, in welcher Richtung sie leitet — ganz ohne Messgerät.

**Vermittelt:** Durchlassrichtung, Durchlassspannung, Durchgangsprüfung

## Was zu tun ist

Klick auf **Sim**. Beide Schiebeschalter stehen links: rote Spitze an der Anodenreihe, schwarze an der Kathodenreihe. Halte eine der vier Tasten gedrückt (button_20 Siliziumdiode, button_22 Germaniumdiode, button_24 rote LED, button_26 Infrarot-LED), hör hin und lies das Voltmeter (voltmeter_28) ab. Schieb dann beide Schalter (slide_switch_18 rote Spitze, slide_switch_19 schwarze Spitze) nach rechts und probier die vier Tasten noch einmal. Lass zum Schluss den schwarzen rechts und schieb den roten zurück nach links.

## Was du sehen solltest

- Durchlassrichtung (beide links): jede Diode piept, und das Messgerät zeigt ihre eigene Spannung: etwa 0,55 V bei Silizium, 0,3 V bei Germanium, 0,95 V bei der Infrarot-LED und 1,5 V bei der roten LED, die dabei schwach leuchtet.
- Umgedreht (beide rechts): Stille, bei allen vier.
- Beide Spitzen an derselben Reihe: der Piepser ertönt ohne Bauteil — die Spitzen berühren sich.

## Warum es funktioniert

Ein Transistor hält den Tongenerator stumm. Ein zweiter Transistor kann diesen abschalten, aber nur, wenn ein kleiner Strom von der roten Spitze (4,5 V) durch das Bauteil zwischen den Spitzen ankommt. Eine Diode lässt diesen Strom nur in einer Richtung durch.
