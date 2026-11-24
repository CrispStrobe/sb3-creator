# Brummsucher: wo liegt die Leitung in der Wand?

Ein Lautsprecherverstärker mit sehr hoher Verstärkung und nichts am Eingang außer einem kurzen blanken Draht. Bewege den Draht zu einer Netzleitung, und der Lautsprecher brummt. Leitungssucher von Elektrikern arbeiten genauso.

**Vermittelt:** kapazitive Kopplung, hochohmige Eingänge, Einstellen der Verstärkung

## Was zu tun ist

Klick auf **Sim**. Dreh den Knopf der Sonde: Er ist der Abstand zwischen Draht und einer versteckten Netzleitung (0 weit weg, 1 direkt daran). Schalte dann den Schiebeschalter um.

## Was du sehen solltest

- Knopf auf 0: Stille. Weiter aufgedreht: ein 50-Hz-Brummen, das lauter wird, je näher der Draht kommt.
- Schalter nach rechts (ein Widerstand im Verstärkungszweig): dasselbe Brummen, etwa halb so laut.

## Warum es funktioniert

Leitung und Draht bilden einen winzigen Kondensator, wenige Pikofarad. Für 50 Hz ist das ein Widerstand von Hunderten Megaohm, aber die 230 V auf der Leitung drücken trotzdem einen Bruchteil eines Mikroampere hindurch in den Verstärkereingang, einige Millivolt. Der Verstärker vervielfacht das bis zu 200-fach. Der Kondensator zwischen seinen Verstärkungs-Pins legt die Verstärkung fest; ein Widerstand in Reihe dazu eine kleinere, und das Brummen schrumpft mit.
