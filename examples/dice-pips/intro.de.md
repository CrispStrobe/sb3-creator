---
level: intermediate
age: 10+
prereqs: [27-led-dice, binary-counter-buttons]
teaches: [pseudo-random, procedures, patterns]
---
## Was du siehst
Sieben LEDs sind angeordnet wie die Augen auf einem Würfel. Drücke den Taster und lass ihn los: Der Würfel rollt, wird langsamer und bleibt auf einer Seite von 1 bis 6 stehen — wie ein echter, der ausrollt.

## Probier das
1. Starte das Programm und würfle ein paar Mal. Notiere die Augenzahlen — kommen alle sechs vor?
2. Sieh dir `show face` an. Nur vier WENN-Blöcke zeichnen alle sechs Seiten. Finde heraus, für welche LEDs jeder davon zuständig ist.
3. Ersetze die 6 in `seed * 6` durch 3. Was macht der Würfel jetzt?

## Was passiert hier
Ein Computer kann keine Münze werfen. Dieses Programm benutzt zwei Tricks. Erstens zählt eine Zahl sehr schnell hoch, solange du den Taster hältst; niemand hält einen Taster zweimal genau gleich viele Millisekunden lang, deshalb ist unvorhersehbar, wo sie stehen bleibt. Zweitens steckt jeder Wurf diese Zahl in eine einfache Formel — mal 11, dann den Rest beim Teilen durch 251 behalten —, die in einem Muster herumspringt, das zu verworren ist, um es zu erraten. Das nennt man einen Pseudozufallsgenerator. Die Augenzahl ergibt sich daraus, in welchem Sechstel des Bereichs 1..250 die Zahl landet; die naheliegende Abkürzung, der Rest beim Teilen durch 6, wiederholt sich bei benachbarten Zahlen in einem kurzen Zyklus und würde manche Augenzahlen bevorzugen.

Das Augenmuster nutzt die Symmetrie eines Würfels: Das mittlere Auge leuchtet bei ungeraden Zahlen, eine Diagonale ab 2, die andere ab 4 und das mittlere Paar nur bei der 6.

## Warum das wichtig ist
Spiele, Simulationen und sogar Verschlüsselung brauchen Zahlen, die schwer vorherzusagen sind. Echte Systeme verwenden bessere Formeln und bessere Zufallsquellen, aber die Idee — ein Startwert aus der echten Welt plus eine Mischformel — ist dieselbe.

## Weiter geht's
- [27-led-dice](../27-led-dice) — der einfachste Würfel: zählen, solange der Taster gedrückt ist.
- [reaction-duel](../reaction-duel) — dieselbe Zufallsformel entscheidet, wann ein Rennen startet.
- Experiment: Würfle mit zwei Würfeln gleichzeitig und gib die Summe aus.
