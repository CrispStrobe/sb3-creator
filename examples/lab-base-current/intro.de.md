---
level: beginner
age: 12+
prereqs: [pc05-npn-switch]
teaches: [current-gain, beta, saturation, transistor-test]
---
## Was du siehst
Ein Transistor mit LED im Kollektorkreis und zwei Messgeräte: eines für den winzigen Basisstrom, eines für den Kollektorstrom. Ein Potentiometer stellt den Basisstrom ein; ein Taster mit sehr großem Widerstand spielt deine Fingerspitze.

## Probier das
1. Klick auf **Sim** und lies beide Messgeräte ab. Teile den Kollektorstrom durch den Basisstrom.
2. Dreh langsam am Potentiometer. Beide Ströme ändern sich, ihr Verhältnis bleibt gleich.
3. Dreh ganz an das niederohmige Ende. Die LED wird nicht heller, als ihr Widerstand erlaubt — das Verhältnis bricht ein.
4. Schieb den Schiebeschalter auf die Fingerseite. Nichts leuchtet. Drück den Taster: Die LED glimmt, von ein paar Mikroampere Basisstrom.

## Was passiert hier
Ein kleiner Strom in die Basis lässt einen etwa hundertmal größeren Strom vom Kollektor zum Emitter fließen. Dieser Faktor ist die Stromverstärkung Beta. Kann der Kollektorkreis nicht mehr Strom aufnehmen, ist der Transistor „voll durchgeschaltet" (gesättigt), und mehr Basisstrom bringt nichts. Mit offener Basis bleibt ein guter Transistor gesperrt.

## Weiter geht's
- [lab-transistor-curves](../lab-transistor-curves) — die ganze Kennlinienschar.
- [pc05-npn-switch](../pc05-npn-switch) — der Transistor als Schalter.
