# Rot-Grün-Balance mit einem Verstärker

Eine LED vom Verstärkerausgang nach Masse, eine zweite von der Batterie zum Ausgang. Ist der Ausgang hoch, leuchtet die erste, ist er tief, die zweite. Ein Poti stellt über den Verstärker den Ausgang ein, so schiebt ein Drehknopf das Licht von Grün nach Rot. Ein Schiebeschalter schaltet einen großen Kondensator vor den Verstärker: Dann folgt das Licht dem Knopf verzögert.

**Vermittelt:** ein Verstärkerausgang, der Strom liefert und aufnimmt, Balanceregler, eine RC-Verzögerung

## Was zu tun ist

Klick auf **Sim**. Dreh das Poti von einem Ende zum anderen und beobachte, wie das Licht von Grün nach Rot wandert. Stell dann den Schiebeschalter um (Verzögerung an) und dreh das Poti noch einmal schnell.

## Was du sehen solltest

- Poti an einem Ende: nur Grün. Am anderen Ende: nur Rot. In der Mitte leuchten beide.
- Mit eingeschalteter Verzögerung folgt das Licht einer schnellen Drehung langsam und braucht etwa zwei Sekunden.

## Warum es funktioniert

Der Verstärker kopiert die Spannung des Potis an seinen Ausgang. Ein hoher Ausgang drückt Strom durch die rote LED nach unten, ein tiefer Ausgang zieht Strom von der Batterie durch die grüne. Mit eingeschaltetem Schalter muss sich der Kondensator am Verstärkereingang erst über einen Widerstand aufladen, so ändert sich der Eingang und mit ihm das Licht allmählich.
