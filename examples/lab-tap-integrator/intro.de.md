---
level: advanced
age: 14+
prereqs: [lab-function-generator]
teaches: [integrator, charge-pump, analog-memory, meter-protection]
---
## Was du siehst
Ein Operationsverstärker mit einem Kondensator in der Rückkopplung, drei Taster (**Hoch**, **Runter**, **Null**) und ein Drehspulinstrument. Hoch und Runter haben je einen eigenen kleinen Kondensator und zwei Dioden.

## Probier das
1. Klick auf **Sim**. Das Instrument steht auf null.
2. Tipp einmal auf **Hoch**. Der Zeiger springt eine Stufe nach oben und bleibt dort. Noch einmal: wieder eine gleich große Stufe.
3. Drück jetzt **Hoch** und halte eine Sekunde fest. Trotzdem nur eine Stufe.
4. Tipp auf **Runter**: eine Stufe zurück.
5. Drück **Null** und tipp dann noch einmal auf **Runter**. Der Zeiger will unter null, zuckt aber nur ein kleines Stück zurück.

## Was passiert hier
Jeder Taster legt ein Ende eines kleinen Kondensators von einem Batteriepol auf den anderen um. Das andere Ende wird von zwei Dioden gelenkt: Beim Drücken wird die Ladung des Kondensators aus dem Eingang des Integrators gezogen (oder hineingeschoben), beim Loslassen füllt er sich aus der Referenz wieder auf. So liefert jeder Druck genau eine Kondensatorladung, egal ob du kurz tippst oder lange hältst. Der Integrator stapelt diese Päckchen auf seinem großen Kondensator und hält die Summe fest: Sein Ausgang ist ein Speicher, der Tipper zählt. Die Diode am Instrument tut nichts, solange der Zeiger vorwärts ausschlägt. Wird er rückwärts getrieben, leitet sie schon bei wenigen Zehntel Volt und bewahrt ihn davor, gegen den Anschlag zu schlagen.

## Weiter geht's
- [lab-ramp-timer](../lab-ramp-timer) — ein Integrator, gespeist mit gleichmäßigem Strom statt mit Ladungspäckchen.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — ein Speicher mit nur zwei Zuständen.
