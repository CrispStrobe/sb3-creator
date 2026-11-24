---
level: intermediate
age: 12+
prereqs: [lab-counter-timer, lab-listening-amp]
teaches: [microphone, amplifier, threshold, counter]
---
## Was du siehst
Ein Ohrhörer, der als Mikrofon arbeitet, ein Operationsverstärker und ein Zähler mit vier LEDs. Ein gleichmäßiger Ton erreicht den Ohrhörer, und die LEDs zählen schnell.

## Probier das
1. Klick auf **Sim**: Die LEDs flackern durch die Binärzahlen, 200 Schritte pro Sekunde.
2. Stell im Inspektor `soundDb` des Ohrhörers von 90 auf 80. Der Zähler bleibt stehen.
3. Wieder bei 90: Dreh das Empfindlichkeitspoti auf die Hälfte. Er bleibt wieder stehen, jetzt ist der Ton nicht laut genug.

## Was passiert hier
Die Spule des Ohrhörers wird vom Schall bewegt und liefert ein paar Millivolt. Der Operationsverstärker verstärkt sie etwa 300-fach. Sein Ausgang ruht auf der Spannung des Empfindlichkeitspotis, etwas unterhalb der Schaltschwelle des Zählers, und der Schall lässt ihn darum herum schwingen. Erst wenn der Ausschlag groß genug ist, der Ton also laut genug, überschreitet der Ausgang die Schwelle, einmal pro Schallwelle, und jedes Überschreiten wird gezählt. Dreht man das Poti herunter, rückt der Ruhepunkt weiter weg, und es braucht einen lauteren Ton.

## Weiter geht's
- [lab-octave-divider](../lab-octave-divider) — der Zähler als Frequenzteiler.
- [lab-schmitt-clap](../lab-schmitt-clap) — ein Klatschschalter mit Schmitt-Trigger.
