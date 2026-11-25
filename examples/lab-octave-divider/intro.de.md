---
level: intermediate
age: 12+
prereqs: [lab-counter-timer]
teaches: [frequency-divider, binary-counter, octave, mixing]
---
## Was du siehst
Ein 555-Oszillator, eine Kette von Zählerstufen und ein Ohrhörer. Sieben Widerstände mischen die Zählerausgänge zu einem Klang.

## Probier das
1. Klick auf **Sim** und hör hin: ein tiefer, schnarrender Akkord.
2. Halte eine Oszilloskop-Sonde an den Ausgang des 555 und dann nacheinander an jeden Zählerausgang. Jeder ist halb so schnell wie der vorige.
3. Nimm einige der 47-kΩ-Mischwiderstände heraus und hör, wie der Akkord dünner wird.

## Was passiert hier
Eine Zählerstufe wechselt ihren Zustand nur bei jedem zweiten Impuls, ihr Ausgang hat also die halbe Eingangsfrequenz. Halbiert man eine Frequenz, sinkt der Ton um genau eine Oktave. Sieben Stufen hintereinander liefern sieben Oktaven aus einem einzigen Oszillator, von etwa 2,2 kHz bis hinunter zu etwa 35 Hz, und sie sind immer perfekt aufeinander gestimmt, weil ein einziger Takt sie alle antreibt. Frühe elektronische Orgeln erzeugten ihre tieferen Oktaven genau so.

## Weiter geht's
- [lab-counter-timer](../lab-counter-timer) — derselbe Zähler als Zeitschalter, der sich selbst anhält.
- [lab-loud-counter](../lab-loud-counter) — ein Zähler, den Schall taktet.
