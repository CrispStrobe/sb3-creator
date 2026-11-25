# Kippschaltung mit Lichtkopplung

Ein Blinker aus einem Transistor und einem Fototransistor: Eine der beiden Verbindungen zwischen ihnen ist gar kein Draht, sondern ein Strahl Infrarotlicht.

**Vermittelt:** Optokoppler-Prinzip, astabile Kippstufe

## Was zu tun ist

Klick auf **Sim** und beobachte die grüne und die rote LED. Rück dann den Empfänger mit dem **Knopf** der Lichtstrecke weiter weg.

## Was du sehen solltest

- Grün und Rot wechseln sich ab, ein paarmal pro Sekunde.
- Weit genug weg ist das Licht zu schwach, und das Blinken hört auf.

## Warum es funktioniert

In einem gewöhnlichen Blinker schaltet jeder Transistor den anderen über einen Kondensator ab. Hier schaltet Q1 die LED über einen Kondensator ab, und die LED schaltet den Fototransistor über ihr Licht. Kommt das Licht zurück, schaltet der Fototransistor Q1 über den anderen Kondensator ab. Wie schnell sich jeder Kondensator nachlädt, bestimmt, wie lange jede Hälfte dauert.
