---
level: intermediate
age: 12+
prereqs: [lab-nand-pips, lab-opamp-blinker]
teaches: [schmitt-oscillator, integrator, gated-oscillator, triangle-wave, sound]
---
## Was du siehst
Einen Operationsverstärker, zwei Logikbausteine mit Schmitt-NAND-Gattern und einen Piezo. Drei Oszillatoren, einer im anderen, erzeugen das Zwitschern eines Vogels.

## Was du tun kannst
1. Klick auf **Sim** und hör zu: kurze Zwitscherer paarweise, dann eine Pause, immer wieder.
2. Sieh dir die Ausgangsspannung des Operationsverstärkers an: Sie steigt und fällt langsam zwischen etwa 1,8 V und 2,8 V.

## Was passiert hier
Der langsamste Oszillator ist der Operationsverstärker als Integrierer: Sein Ausgang läuft gleichmäßig nach oben oder unten, und ein Schmitt-Gatter kehrt die Rampe jedes Mal um, wenn sie eine der beiden Schaltschwellen des Gatters erreicht. Das ergibt die Strophen. Während einer Strophe läuft ein zweiter Gatter-Oszillator mit etwa dreißig Schwingungen pro Sekunde und schaltet den dritten, die hohe Stimme, ein und aus: das Zwitschern. Ist der zweite Eingang eines Gatter-Oszillators low, bleibt er stehen, also kann jeder Oszillator den nächsten starten und stoppen.

## Weiter geht's
- [lab-nand-pips](../lab-nand-pips) — ein Gatter-Oszillator schaltet einen anderen.
- [lab-tone-mux](../lab-tone-mux) — zwei Töne wechseln sich auf einer Leitung ab.
