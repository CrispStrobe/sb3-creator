---
level: intermediate
age: 10+
prereqs: [random-lucky-light, 05-counter]
teaches: [input, random, loops, comparison]
---
## Was du siehst
Öffne den seriellen Monitor. Der Chip fragt nach deinem Namen, begrüßt dich und sagt, dass er an eine Zahl von 1 bis 100 denkt. Tippe einen Tipp und drücke Enter: Er antwortet „Higher!“ oder „Lower!“, bis du die Zahl triffst. Dann sagt er dir, wie viele Versuche du gebraucht hast, und schaltet eine Lampe ein.

## Probier das
1. Spiele eine Runde. Mit wie vielen Versuchen kommst du immer aus, wenn du geschickt rätst?
2. Ändere den Bereich auf 1 bis 1000. Wie viele Versuche mehr brauchst du?
3. Lass den Chip nach dem zehnten falschen Tipp „Too many tries!“ sagen.

## Was dahintersteckt
`ask "Your guess?" and wait` schickt die Frage über die serielle Leitung und wartet dann, bis du eine Zeile getippt und Enter gedrückt hast. Was du getippt hast, ist `answer`. Als Name benutzt (`join "Hello " answer`) ist es Text; als Zahl benutzt (`set guess to answer`) ist es die getippte Zahl — Text, der keine Zahl ist, zählt als 0, wie überall in Scratch.

`pick random 1 to 100` wählt die geheime Zahl. Chips können nicht wirklich würfeln, deshalb rührt der Zufallsgenerator seine Zahlen um, während er auf deine Eingabe wartet: Wie lange du brauchst, ist Zufall, den er nutzen kann. Deshalb kommt die Frage nach dem Namen zuerst.

`REPEAT UNTIL guess = secret` fragt immer weiter. Jeder falsche Tipp verkleinert den möglichen Bereich: Die beste Strategie, immer die Mitte zu raten, braucht bei 100 Zahlen höchstens 7 Versuche.

## Warum das wichtig ist
Den Bereich bei jedem Schritt zu halbieren, heißt binäre Suche. Computer nutzen sie ständig, um schnell etwas zu finden: einen Namen im Telefonbuch, ein Wort im Wörterbuch, einen Eintrag in einer Datenbank mit Millionen Zeilen.

## Weiter geht's
- [random-lucky-light](../random-lucky-light) — Zufall aus einem Tastendruck statt aus der Eingabe.
- [05-counter](../05-counter) — Ereignisse zählen, wie hier die Versuche.
- Experiment: Lass den Chip DEINE Zahl raten und antworte ihm mit „higher“ oder „lower“.
