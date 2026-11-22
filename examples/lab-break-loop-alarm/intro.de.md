---
level: intermediate
age: 12+
prereqs: [pc76-alarmschaltung]
teaches: [flip-flop, normally-closed, fail-safe, latch, alarm]
---
## Was du siehst
Eine dünne Drahtschleife ist über eine Tür gespannt (hier ein Schiebeschalter). Zwei Transistoren bilden einen Speicher, eine rote LED ist der Alarm. Beim Einschalten ist die Anlage scharf und still.

## Probier das
1. Klick auf **Sim**: alles dunkel.
2. Schalte die Türschleife auf „gerissen“: die Alarm-LED leuchtet.
3. Schalte zurück auf „heil“: die LED bleibt an – die Schaltung merkt es sich.
4. Drück **scharf / zurücksetzen**: wieder Ruhe.
5. Reiß die Schleife auf und drück **scharf / zurücksetzen**, während sie noch offen ist. Der Alarm ist sofort wieder da.

## Was passiert hier
Die beiden Transistoren halten sich gegenseitig: ist einer an, nimmt er dem anderen den Basisstrom weg. Die Schleife ist Teil der Leitung, die den ersten Transistor einschaltet. Reißt sie, sperrt der erste, der zweite schaltet durch und lässt die LED leuchten. Die Schleife zu flicken hilft nicht, denn der zweite Transistor hält diese Leitung jetzt nahe null Volt. Ein durchtrennter Draht löst den Alarm aus, statt ihn stummzuschalten – das bedeutet „ausfallsicher“.

## Weiter geht's
- [pc76-alarmschaltung](../pc76-alarmschaltung) — dieselbe Speicher-Idee mit Logikgattern und Schließerkontakt.
- [lab-electronic-fuse](../lab-electronic-fuse) — ein Speicher, den zu viel Strom auslöst.
