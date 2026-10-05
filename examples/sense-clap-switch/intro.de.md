---
level: beginner
age: 10+
prereqs: [01-blink, 11-toggle-button]
teaches: [sound-module, toggle, dead-time]
---
## Was du siehst
Einmal klatschen und die Lampen-LED geht an, noch einmal klatschen und sie geht aus. Ein Geräuschmodul hört über sein Mikrofon zu und meldet dem MCU über eine einzige digitale Leitung „laut" oder „leise".

## Probier das
1. Starte das Programm und drücke Klatschen: Die Lampe schaltet um.
2. Schiebe den Geräuschpegel über die Mitte und lass ihn dort. Die Lampe schaltet einmal um und wartet dann — das Programm braucht erst wieder Ruhe, bevor das nächste Klatschen zählt.
3. Ändere die Pause von 0,3 Sekunden auf 0 und klatsche ein paar Mal. Warum kann ein einziges Klatschen an einem echten Modul jetzt doppelt zählen?

## Was passiert hier
Ein Geräuschmodul besteht aus Mikrofon, Verstärker und Komparator. Ist das Geräusch lauter als die am Modul eingestellte Schwelle, geht sein digitaler Ausgang auf HIGH. Ein Klatschen ist kein sauberer Einzelimpuls: Es klingt nach und hallt, deshalb flackert der Ausgang einige Millisekunden lang.

Das Programm macht deshalb pro Klatschen drei Dinge: Es wartet auf laut, schaltet die Lampe um, wartet wieder auf leise und ignoriert den Eingang danach kurz (Totzeit). Ohne die letzten beiden Schritte könnte ein einziges Klatschen die Lampe mehrmals umschalten.

## Warum das wichtig ist
Aus einem unsauberen Signal aus der echten Welt genau ein Ereignis zu machen, ist dasselbe Problem wie das Entprellen eines Tasters — und dieselbe Lösung (warten, bis sich das Signal beruhigt, und es kurz ignorieren) taucht bei jedem Eingang auf, der nicht perfekt sauber ist.

## Weiter geht's
- [sense-noise-counter](../sense-noise-counter) — Geräusche zählen statt umschalten.
- [26-debounce](../26-debounce) — dieselbe Idee für einen mechanischen Taster.
- Experiment: Mach daraus einen Doppelklatsch-Schalter — nur umschalten, wenn innerhalb einer Sekunde ein zweites Klatschen folgt.
