# Infrarot-Fernschalter

Drück die Taste am Handsender, und die Lampe auf der anderen Seite des Raums geht an; drück noch einmal, und sie geht aus. Der Empfänger macht aus jedem Infrarotblitz genau einen Schaltschritt.

**Vermittelt:** IR-Strecke, Monoflop, Kipp-Flipflop

## Was zu tun ist

Klick auf **Sim**. Drück kurz die Taste (Senden), warte einen Moment und drück noch einmal. Probier es mit dem **Knopf** der Lichtstrecke aus größerer Entfernung.

## Was du sehen solltest

- Jeder Druck schaltet die rote LED (die Lampe) um.
- Der Ausgang des Empfängerverstärkers bleibt nach jedem Druck kurz hoch.

## Warum es funktioniert

Der Fototransistor hebt den +-Eingang des Verstärkers über den −-Eingang, der Ausgang springt hoch, und ein Kondensator gibt den Sprung zurück, sodass er eine feste Zeit lang hoch bleibt, auch wenn das Licht schon weg ist. Fällt er zurück, kippt die fallende Flanke das Flipflop, also zählt jeder Druck einmal.
