---
level: intermediate
age: 12+
prereqs: [lab-opamp-blinker, lab-transistor-flip-flop]
teaches: [comparator, positive-feedback, latch, astable, pnp-switch]
---
## Was du siehst
Ein Bahnübergang für die Modelleisenbahn: zwei rote Lampen, die abwechselnd blinken, ein gelbes „besetzt"-Licht und zwei Gleiskontakte, ANKUNFT und ABFAHRT (ARRIVE und LEAVE).

## Was du tun kannst
1. Klick auf **Sim**. Alle Lampen sind dunkel: Der Übergang ist frei.
2. Drück **ARRIVE**, den Kontakt, den ein Zug vor dem Übergang berührt. Das gelbe Licht geht an und die roten Lampen blinken abwechselnd.
3. Lass los. Sie blinken weiter: Die Schaltung merkt es sich.
4. Drück **LEAVE**, den Kontakt hinter dem Übergang. Alles wird dunkel und bleibt dunkel.

## Was passiert hier
Das Gedächtnis ist eine Hälfte eines Operationsverstärkers als Komparator. Sein Ausgang wirkt über einen Widerstand auf seinen eigenen +-Eingang zurück: Egal wohin der Ausgang zeigt, er zieht den Eingang weiter in dieselbe Richtung und hält sich so selbst fest. Die Kontakte kippen ihn nur um. Solange der Ausgang unten ist, schaltet er einen PNP-Transistor ein, und der versorgt einen klassischen Blinker aus zwei Transistoren.

## Weiter geht's
- [lab-level-crossing](../lab-level-crossing) — dieselbe Aufgabe mit einem NAND-Speicher und einem 555.
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — ein Speicher aus zwei Transistoren.
