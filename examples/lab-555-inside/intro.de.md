---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable, pc70-schmitt-trigger]
teaches: [555-timer, comparator, hysteresis, schmitt-trigger, flip-flop]
---
## Was du siehst
Ein 555 ohne seine Zeitglied-Bauteile, damit du hineinschauen kannst. Ein Drehknopf (INPUT) speist beide Komparator-Eingänge gleichzeitig. Eine grüne LED zeigt den Ausgang auf High, eine rote zeigt Low, und eine gelbe zeigt, wann der Entlade-Transistor schaltet.

## Probier das
1. Starte die Simulation. INPUT steht auf 1,8 V, die grüne LED leuchtet.
2. Dreh INPUT langsam hoch. Bis etwa 6 V passiert nichts, dann fällt der Ausgang: Rot und Gelb gehen an.
3. Dreh INPUT wieder herunter. Bei 6 V kippt nichts zurück. Erst bei etwa 3 V. Das sind ein Drittel und zwei Drittel von 9 V.
4. Stell den Schiebeschalter auf SHIFT und dreh am SHIFT-Knopf. Wiederhole den Durchlauf: Beide Schaltpunkte wandern mit, der untere bleibt immer halb so hoch wie der obere.
5. Halte den RESET-Taster gedrückt. Der Ausgang geht auf Low, egal was INPUT sagt.

## Was dahintersteckt
Im 555 bilden drei gleiche 5-kΩ-Widerstände einen Teiler auf 1/3 und 2/3 der Versorgung. Ein Komparator vergleicht THRESHOLD mit dem 2/3-Punkt und setzt ein Flipflop zurück, der andere vergleicht TRIGGER mit dem 1/3-Punkt und setzt es. Zwischen den beiden Punkten tut keiner etwas, also behält das Flipflop seinen letzten Zustand. CONTROL ist der 2/3-Abgriff dieses Teilers, deshalb verschiebt ein Zug daran beide Punkte. Im normalen Astabil-Betrieb ist die Kondensatorspannung der "Eingang" und pendelt genau zwischen diesen beiden Schwellen.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable): dieselben Schwellen messen einen einzelnen Impuls ab.
- [pc70-schmitt-trigger](../pc70-schmitt-trigger): Hysterese mit einem Logikgatter.
