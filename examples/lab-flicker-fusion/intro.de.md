# Wann wird Blinken zu Dauerlicht?

Ab einer gewissen Blinkfrequenz sieht das Auge keine einzelnen Blitze mehr, sondern gleichmäßiges Licht. Mit dieser Schaltung findest du diese Frequenz. Ein 555 erzeugt einen einstellbaren Takt, ein Flipflop halbiert ihn, damit die LED genau gleich lange an und aus ist, und der Knopf verstellt die LED von etwa 30 bis über 200 Blitze pro Sekunde.

**Vermittelt:** Teilen durch zwei für 50 % Tastverhältnis, Flimmerverschmelzung, warum schnelles Pulsdimmen gleichmäßig aussieht

## Was zu tun ist

Klick auf **Sim** und dreh den Knopf langsam von 0 aus auf. Beobachte die LED und das Oszilloskop. Auf einem echten Steckbrett schau die LED auch von der Seite an, dort ist das Auge empfindlicher für Flimmern.

## Was du sehen solltest

- Knopf auf 0: Die LED blitzt etwa 31-mal pro Sekunde.
- Weiter aufgedreht: Das Flimmern verschwindet; oberhalb von etwa 60 bis 90 Hz wirkt die LED ruhig.
- Die LED auf dem Bildschirm wird nur begrenzt oft pro Sekunde neu gezeichnet, lies die Frequenz deshalb am Oszilloskop ab.

## Warum es funktioniert

Ein D-Flipflop, dessen D-Eingang am eigenen invertierten Ausgang hängt, wechselt bei jeder Taktflanke den Zustand: zwei Flanken hinein, ein voller Zyklus heraus. Das ergibt ein perfektes Rechteck mit halb an, halb aus, egal wie der Ausgang des 555 selbst aussieht.
