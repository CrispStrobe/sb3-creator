---
level: beginner
age: 10+
prereqs: [pc06-rc-charge]
teaches: [rc-time-constant, darlington, timer]
---
## Was du siehst
Ein Taster, ein Kondensator, zwei Transistoren und eine gelbe LED. Ein kurzer Druck schaltet die LED ein — und sie bleibt lange an, nachdem du losgelassen hast.

## Probier das
1. Klick auf **Sim**. Die LED ist dunkel.
2. Drück kurz den Taster. Die LED leuchtet.
3. Warte und beobachte. Nach etwa einer halben Minute wird sie langsam dunkler.
4. Drück noch einmal, solange sie leuchtet: Die Zeit beginnt von vorn.

## Was passiert hier
Der Taster füllt den Kondensator im Bruchteil einer Sekunde. Danach entleert er sich langsam über den 47-kΩ-Widerstand in die Basis des ersten Transistors. Zwei Transistoren hintereinander (eine Darlington-Schaltung) verstärken den Strom so stark, dass ein winziger Rest reicht, um die LED zu halten. Die Zeit hängt von Widerstand × Kapazität ab. Weil nichts „jetzt aus" entscheidet, wird das Licht am Ende langsam schwächer — ein 555-Timer würde scharf abschalten.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — dieselbe Aufgabe mit scharfem Ende.
- [lab-two-led-monostable](../lab-two-led-monostable) — ein Zeitgeber mit Komparator.
