---
level: advanced
age: 14+
prereqs: [lab-crystal-set]
teaches: [radio, level-indicator, diode-pump, emitter-follower]
---
## Was du siehst
Ein Detektorempfänger (Antenne, Spule, Drehkondensator, Germaniumdiode, Ohrhörer), dessen Tonsignal weiter zu einem Verstärker mit Operationsverstärker, einer Diodenpumpe, einem Messinstrument und einer Leuchtkette aus drei LEDs geht: grün, gelb, rot.

## Probier das
1. Klick auf **Sim**. Das Radio ist auf den starken Ortssender eingestellt: Nach einem Augenblick steigt der Zeiger, Grün und Gelb leuchten, und Rot flackert bei den lauten Stellen.
2. Dreh die Abstimmung langsam vom Sender weg. Der Pegel sinkt, und die LEDs gehen eine nach der anderen aus.
3. Such die anderen Sender auf der Skala und vergleiche, wie hoch die Leuchtkette steigt.

## Was passiert hier
Der Detektor des Empfängers liefert eine kleine Tonspannung. Der Operationsverstärker macht sie etwa elfmal größer. Zwei Dioden und zwei Kondensatoren bilden eine Pumpe: Jede Schwingung schiebt etwas Ladung in den Pegelkondensator, und ein Widerstand lässt sie langsam abfließen. So folgt der Pegel der Lautstärke. Das Instrument zeigt ihn mit dem Zeiger, die Transistorkette in drei Stufen. Jede Stufe ist ein Transistor, dessen Basis an einem Spannungsteiler vom Pegel hängt (über einen Emitterfolger, damit die Kette den Kondensator nicht leersaugt): Je höher der Pegel, desto mehr Stufen schalten ein.

## Weiter geht's
- [lab-crystal-set](../lab-crystal-set) — der Empfänger allein.
- [lab-sound-meter](../lab-sound-meter) — ein Messgerät für Schall aus einem Mikrofon.
