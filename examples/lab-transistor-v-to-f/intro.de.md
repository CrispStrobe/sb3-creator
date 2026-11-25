---
level: advanced
age: 14+
prereqs: [lab-v-to-f, lab-diff-pair]
teaches: [voltage-to-frequency, integrator, schmitt-trigger, reset-transistor]
---
## Was du siehst
Einen Drehknopf (INPUT), einen Integrierer mit Operationsverstärker, einen Trigger aus zwei Transistoren, einen Rücksetztransistor und einen Piezo. Die Tonhöhe des Piezos folgt dem Knopf.

## Was du tun kannst
1. Klick auf **Sim**. Der Piezo tickt etwa 72-mal pro Sekunde.
2. Dreh **INPUT** Richtung Masse: Der Ton wird höher. Dreh ihn nach oben: Er wird tiefer.
3. Beobachte die Ausgangsspannung des Integrierers: Sie steigt und fällt immer wieder zurück, zwischen etwa 5,05 V und 6,42 V.

## Was passiert hier
Der Ausgang des Integrierers steigt mit einer Geschwindigkeit, die zur Eingangsspannung proportional ist (wie weit der Schleifer unter 4,5 V liegt). Zwei Transistoren mit gemeinsamem Emitterwiderstand bilden einen Schmitt-Trigger: Erreicht die Rampe seine obere Schwelle, sperrt der zweite Transistor, und sein steigender Kollektor schaltet einen dritten Transistor ein, der den Kondensator des Integrierers im Nu entleert. Dann beginnt die nächste Rampe. Doppelte Eingangsspannung heißt doppelt so steile Rampen, also doppelt so viele pro Sekunde: ein Spannungs-Frequenz-Wandler.

## Weiter geht's
- [lab-v-to-f](../lab-v-to-f) — derselbe Wandler mit einem Operationsverstärker als Trigger.
- [lab-diff-pair](../lab-diff-pair) — zwei Transistoren mit gemeinsamem Emitterwiderstand.
