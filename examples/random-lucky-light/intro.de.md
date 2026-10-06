---
level: beginner
age: 9+
prereqs: [01-blink, 11-toggle-button]
teaches: [random, events, procedures]
---
## Was du siehst
Vier Lampen und ein Taster. Drücke den Taster: Die Lampen flackern eine halbe Sekunde lang, dann bleibt genau eine an. Welche? Das entscheidet der Zufall.

## Probier das
1. Drücke den Taster zehnmal und schreibe auf, welche Lampe gewinnt. Gewinnt jede Lampe manchmal?
2. Ändere `pick random 1 to 4` in der letzten Zeile zu `pick random 1 to 2`. Welche Lampen können jetzt gewinnen?
3. Lass das Flackern länger dauern, indem du die `8` in `REPEAT 8` änderst.

## Was dahintersteckt
`pick random 1 to 4` liefert eine ganze Zahl von 1 bis 4, die das Programm nicht vorhersagen kann. Im Chip rührt eine kleine Formel bei jeder Anfrage eine große Zahl durch und mischt außerdem die genaue Millisekunde hinein, in der du den Taster gedrückt hast — die niemand steuern kann. So sieht das Ergebnis aus wie der Wurf eines vierseitigen Würfels.

`show lamp` schaltet alle vier Lampen aus und dann die ein, deren Nummer in `lamp` steht.

Die grüne Flagge schaltet nur alle Lampen aus. Das Spiel selbst startet von selbst, sobald der Taster heruntergeht: ein WENN-Kopf an einem Pin. Den Taster gedrückt zu halten startet es nicht neu; nur ein neuer Druck tut das.

## Warum das wichtig ist
Spiele brauchen Zufall, viele Simulationen auch. Auf ein Ereignis zu warten, statt immer wieder nachzusehen, ist die Art, wie die meisten echten Geräte arbeiten: Eine Fernbedienung, eine Türklingel oder eine Tastatur tun nichts, bis eine Taste gedrückt wird.

## Weiter geht's
- [dice-pips](../dice-pips) — ein Würfel, der seinen Zufall aus dem Tastendruck macht.
- [melody-lists](../melody-lists) — ein weiteres Programm, das ein Taster startet.
- Experiment: Zähle, wie oft jede Lampe gewinnt, und gib die vier Zahlen aus.
