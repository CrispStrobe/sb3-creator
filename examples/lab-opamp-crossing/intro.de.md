# Bahnübergang-Blinklicht mit einem Operationsverstärker

Am Bahnübergang blinken zwei rote Lampen abwechselnd, solange ein Zug kommt. Hier schafft das ein einziger Operationsverstärker: Er kippt von selbst hin und her, und sein Ausgang lässt die eine Lampe leuchten, solange er hoch ist, die andere, solange er tief ist.

**Vermittelt:** astabiler Operationsverstärker, Hysterese, zwei LEDs im Gegentakt

## Was zu tun ist

Klick auf **Sim**. Beobachte die zwei roten LEDs. Öffne den Schalter **TRAIN** und schließ ihn wieder.

## Was du sehen solltest

- TRAIN geschlossen: Die beiden Lampen blinken abwechselnd, etwa anderthalbmal pro Sekunde.
- TRAIN offen: Beide Lampen bleiben dunkel.

## Warum es funktioniert

Drei gleiche Widerstände am Plus-Eingang machen den Operationsverstärker zu einem Komparator mit zwei Schwellen, die von seinem eigenen Ausgang abhängen. Der 10-µF-Kondensator am Minus-Eingang lädt sich über 47 kΩ in Richtung Ausgang auf; erreicht er die Schwelle, kippt der Ausgang, die Schwelle springt, und der Kondensator läuft in die andere Richtung. Eine Lampe hängt zwischen Ausgang und Masse, die andere zwischen Versorgung und Ausgang, deshalb leuchten nie beide zugleich.
