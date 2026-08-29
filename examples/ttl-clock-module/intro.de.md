---
level: intermediate
age: 12+
prereqs: [51-555-astable]
teaches: [555-astable, clock-generation, manual-stepping, rc-timing]
---
## Was du siehst
Das Taktmodul eines 8-Bit-TTL-Computers im Ben-Eater-Stil: ein 555-Timer im astabilen Modus erzeugt eine Rechteckwelle, mit einem Potentiometer zur Geschwindigkeitsregelung, einer grünen LED für jeden Taktimpuls und einem Einzelschritt-Taster, der ein Register weiterschaltet — ein D-Flipflop, dessen rote LED den Zustand nach dem Schritt zeigt.

## Probier das
1. Einschalten — die LED blinkt mit einer vom Poti eingestellten Rate.
2. Drehe am Poti, um die Taktgeschwindigkeit zu ändern: ganz rechts ist schnell, ganz links ist langsam (sichtbares Blinken).
3. Drücke den Einzelschritt-Taster und beobachte die ROTE LED: Sie geht beim ersten Druck an und bleibt an, wenn du loslässt. Beim nächsten Druck geht sie aus. Genau das heißt „ein Druck, ein Schritt" — die Flanke schaltet ein Register weiter, und das Register merkt es sich.

## Was passiert hier
Der 555-Timer lädt Kondensator C1 über R1 und das Poti, dann entlädt er ihn nur über das Poti. Der Lade-/Entladezyklus erzeugt eine Rechteckwelle am Ausgang. Das Poti steuert die Zyklusdauer — mehr Widerstand = langsamerer Takt.

Der Taster hat einen eigenen Knoten: VCC über den Taster, 10 kOhm nach Masse. Losgelassen liegt er auf 0 V, gedrückt auf 5 V. Für sich genommen ist das nur ein Schalter — und genau das war dieser Aufbau bisher, ein Knoten, den kein Bauteil las. Jetzt taktet er ein D-Flipflop, dessen D-Eingang von /Q zurückkommt, sodass jede steigende Flanke es umschaltet. Die rote LED an Q zeigt den Registerzustand, und dieser Zustand ÜBERLEBT das Loslassen. Gemessen: Q liegt gesetzt bei 4,4643 V, denn das Flipflop treibt 5 V hinter 50 Ohm Ausgangswiderstand auf 220 Ohm und eine rote LED, und die Lösung stellt sich bei 10,714 mA ein.

## Warum das wichtig ist
Jeder digitale Computer braucht einen Takt. Zu verstehen, wie eine RC-Schaltung die Frequenz bestimmt — und den Takt auf Einzelschritte verlangsamen zu können — ist die erste Fähigkeit beim Bau einer CPU aus Gattern.

**Warum ein echter 555?** Andere Logiksimulatoren (z.B. ngdrascal/8bitsim, MIT) mussten den 555 durch eine digitale Taktquelle ersetzen, weil ihre Engines die RC-Zeitkonstante nicht lösen können. Unsere Engine simuliert den echten 555 — der Kondensator lädt sich über die Widerstände, die internen Komparatoren schalten bei 1/3 und 2/3 VCC.

## Weiter geht's
- Probiere verschiedene Kondensatorwerte (10 µF = sehr langsam, 100 nF = sehr schnell).
- [eater6502-bench](../eater6502-bench) — ein vollständiger 6502-Computer mit einem solchen Takt.
