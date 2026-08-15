---
level: beginner
age: 10+
prereqs: [pc09-direct-led]
teaches: [parallel-circuits, independent-branches]
---
## Was du siehst
Zwei LEDs parallel, jede mit einem eigenen 470-Ω-Widerstand, direkt an eine 5-V-Versorgung angeschlossen. Beide leuchten gleich hell.

## Probier das
1. Klick auf **Sim** und überprüfe, dass beide LEDs dieselbe Spannung und denselben Strom zeigen.
2. Trenne einen Zweig ab — die andere LED bleibt genau gleich.
3. Ändere einen Widerstand auf 1 kΩ. Diese LED wird dunkler, die andere bleibt unverändert.

## Was passiert hier
Jeder Zweig ist unabhängig: Er sieht die vollen 5 V der Versorgung und führt seinen eigenen Strom von etwa 6,4 mA. Der Gesamtstrom aus der Versorgung ist die Summe beider Zweige, rund 12,8 mA. Parallele Zweige beeinflussen sich nicht gegenseitig — einen hinzuzufügen oder zu entfernen lässt die anderen unberührt.

## Warum das wichtig ist
Parallelschaltung ist die Art, wie die echte Welt funktioniert: jede Steckdose im Haus, jede Fahrspur, jeder Thread in einem Programm. Die Unabhängigkeit ist der Grund, warum eine durchgebrannte Lampe nicht das ganze Haus verdunkelt.

## Weiter geht's
- [pc04-parallel-leds](../pc04-parallel-leds) — dieselbe Idee auf einem Steckbrett.
- [pc10-direct-series](../pc10-direct-series) — zum Vergleich: in Reihe teilen sich beide LEDs den Strom, aber nicht die Spannung.
- Experiment: Füge einen dritten Zweig hinzu und sag den Gesamtstrom vorher, bevor du simulierst.
