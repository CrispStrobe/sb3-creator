---
level: advanced
age: 13+
prereqs: [lab-555-inside, pc68-555-sirene]
teaches: [voltage-controlled-oscillator, FSK, 555-timer, control-pin, modem]
---
## Was du siehst
Ein 555-Tongenerator, dessen Tonhöhe nicht ein Widerstand bestimmt, sondern eine Spannung. Der TUNE-Knopf stellt diese Spannung am CONTROL-Pin ein; der BIT-Taster zieht sie etwas herunter, und der Ton springt nach oben.

## Probier das
1. Dreh TUNE langsam von einem Ende zum anderen und hör zu: Der Ton gleitet von etwa 2,3 kHz bis etwa 740 Hz herunter.
2. Beobachte gleichzeitig das Voltmeter an CONTROL. Höhere Spannung, tieferer Ton.
3. Lass TUNE auf 60 % und tippe BIT im Rhythmus. Der Ton wechselt zwischen zwei Tonhöhen: eine 0 und eine 1.
4. Sieh dir den Zeitkondensator auf dem Oszilloskop an. Wo kehrt er um? Vergleiche mit der CONTROL-Spannung.

## Was dahintersteckt
Im 555 ist der CONTROL-Pin die obere Schaltschwelle; die untere ist immer halb so hoch. Der Zeitkondensator pendelt zwischen beiden. Hebst du die CONTROL-Spannung an, muss der Kondensator höher laden, näher an die Versorgung, wo das Laden langsam wird: Der Ton sinkt. Eine Schaltung, deren Frequenz einer Spannung folgt, heißt VCO. Zwei feste Spannungen ergeben zwei Töne, und so schickt die Frequenzumtastung (FSK) Bits über eine Telefonleitung oder Funk. Steuert man einen VCO aus dem Vergleich seines eigenen Ausgangs mit einem anderen Signal, entsteht eine Phasenregelschleife (PLL), das Herz jedes Radioempfängers.

## Weiter geht's
- [lab-555-inside](../lab-555-inside): was der CONTROL-Pin mit den Schwellen macht.
- [lab-siren-glide](../lab-siren-glide): ein anderer Weg, die Tonhöhe eines 555 mit einer Spannung zu steuern.
