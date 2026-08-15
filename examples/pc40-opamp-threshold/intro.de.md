---
level: advanced
age: 14+
prereqs: [pc02-voltage-divider, pc37-selectable-reference]
teaches: [op-amp, comparator, threshold-detection]
---
## Was du siehst
Ein Operationsverstärker vergleicht zwei Spannungen: Ein Potentiometer stellt den einen Eingang ein, und ein Widerstandsteiler legt den anderen auf 2,5 V fest. Wenn der Poti die Schwelle überschreitet, kippt der Ausgang und die LED reagiert.

## Probier das
1. Klick auf **Sim** mit dem Poti auf 50 %. Beide Eingänge liegen bei 2,5 V, der Ausgang ist nahe 0 V, und die LED ist dunkel.
2. Drehe den Poti über 50 %. Der nichtinvertierende Eingang übersteigt die Referenz, der Ausgang geht auf High, und die LED leuchtet.
3. Drehe unter 50 %. Der Ausgang geht wieder auf Low.

## Was passiert hier
Ein Operationsverstärker im offenen Regelkreis arbeitet als Komparator: Er treibt seinen Ausgang auf High, wenn der nichtinvertierende Eingang (+) über dem invertierenden Eingang (−) liegt, und auf Low, wenn er darunter liegt. Der Übergang ist scharf — schon wenige Millivolt Differenz sättigen den Ausgang. Hier ist die Referenz durch zwei gleiche Widerstände auf 2,5 V festgelegt, und der Poti fährt den Messeingang von 0 bis 5 V ab.

## Warum das wichtig ist
Schwellenwerterkennung macht aus einem analogen Signal eine digitale Entscheidung: Ist die Temperatur über dem Sollwert? Ist die Batteriespannung zu niedrig? Ist es hell oder dunkel? Operationsverstärker-Komparatoren sind der einfachste Weg, diese Entscheidung zu treffen, und sie stecken in fast jeder Regelschleife.

## Weiter geht's
- [pc48-ldr-comparator](../pc48-ldr-comparator) — ein Lichtsensor, der einen Komparator ansteuert.
- [pc41-zener-reference](../pc41-zener-reference) — eine stabilere Spannungsreferenz.
- Experiment: Verschiebe die Referenz auf 3,3 V, indem du die Teilerwiderstände änderst, und sage vorher, bei welcher Poti-Position die LED schaltet.
