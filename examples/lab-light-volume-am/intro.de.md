---
level: advanced
age: 14+
prereqs: [lab-phase-shift, lab-meissner-am]
teaches: [phase-shift-oscillator, amplitude-modulation, gain-control, phototransistor, infrared]
---
## Was du siehst
Einen Tongenerator mit einem Transistor, einen LM386-Verstärker mit Lautsprecher und einen Fototransistor im Verstärkungsnetzwerk des Verstärkers. Ein Operationsverstärker lässt eine Infrarot-LED auf den Fototransistor blinken.

## Was du tun kannst
1. Klick auf **Sim** und hör zu: Der Ton pulsiert, laut und leise, etwa dreißigmal pro Sekunde.
2. Dreh am **Abstand**-Knopf des Lichtwegs: Weiter weg werden die lauten Stellen leiser.
3. Schieb den **Licht**-Schieber des Fototransistors hoch (Raumlicht): Auch die leisen Stellen werden lauter.

## Was passiert hier
Der Transistor und drei Widerstand-Kondensator-Glieder erzeugen eine Sinusschwingung von etwa 1,1 kHz. Die Verstärkung des LM386 hängt davon ab, was zwischen zwei seiner Anschlüsse liegt; dort sitzt der Fototransistor, also dreht Licht die Lautstärke auf. Der Operationsverstärker schaltet die Infrarot-LED ein und aus, und jeder Lichtblitz macht den Ton lauter. Die Lautstärke des Tons trägt jetzt das Blinkmuster: Amplitudenmodulation, wie bei einem AM-Rundfunksender.

## Weiter geht's
- [lab-phase-shift](../lab-phase-shift) — der Phasenschieber-Oszillator allein.
- [lab-meissner-am](../lab-meissner-am) — Amplitudenmodulation eines Hochfrequenzträgers.
