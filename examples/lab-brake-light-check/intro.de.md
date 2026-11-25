# Bremslichtkontrolle: Ein Speicher merkt sich eine dunkle Bremsleuchte

Die Bremsleuchte eines Autos soll bei jedem Bremsen leuchten. Ein Lichtleiter bringt ihr Licht zurück zum Armaturenbrett, und zwei NAND-Gatter merken sich, wenn sie einmal dunkel blieb: eine rote Warnung, die an bleibt, bis du sie zurücksetzt.

**Vermittelt:** das Setz-Rücksetz-Flipflop, Prüfen mit Verzögerung, Lichtleiter

## Was zu tun ist

Klick auf **Sim**. Drück den Pedal-Taster: Die Bremsleuchte leuchtet, die grüne LED bleibt an. Stell jetzt den Schiebeschalter auf „defekt“ und drück das Pedal noch einmal. Lass es los und drück dann den Rücksetz-Taster.

## Was du sehen solltest

- Gute Lampe: Grün bleibt an, egal was du mit dem Pedal machst.
- Defekte Lampe: Die rote LED geht beim Bremsen an und bleibt an, auch nachdem du loslässt.
- Rücksetzen: wieder grün.

## Warum es funktioniert

Gatter 1 fragt: Ist das Pedal gedrückt UND ist es am Ende des Lichtleiters dunkel? Nur dann setzt es das Flipflop aus Gatter 2 und 3, das seinen Zustand behält, bis der Rücksetzeingang auf Low gezogen wird. Eine kurze Verzögerung auf der Pedalleitung gibt einer guten Lampe Zeit, zuerst aufzuleuchten. Beim Loslassen überbrückt eine Diode die Verzögerung, so dass das Ausgehen der Lampe nie als Fehler gilt.
