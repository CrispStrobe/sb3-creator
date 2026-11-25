---
level: intermediate
age: 12+
prereqs: [lab-nand-pips]
teaches: [multiplexer, nand-logic, schmitt-oscillator, time-division]
---
## Was du siehst
Drei Tongeneratoren aus NAND-Gattern, einen Umschalter aus weiteren NAND-Gattern und einen Piezo. Ein Schiebeschalter und ein KEY-Taster bestimmen, was durchkommt.

## Was du tun kannst
1. Klick auf **Sim** und schieb den Schalter nach rechts. Du hörst den tiefen Ton; die gelbe LED leuchtet.
2. Halte **KEY** gedrückt. Der hohe Ton übernimmt die Leitung, die gelbe LED geht aus.
3. Schieb den Schalter nach links. Jetzt schaltet ein langsamer dritter Oszillator um, und die Töne wechseln sich von allein ab.

## Was passiert hier
Jedes NAND-Gatter im Umschalter lässt seinen Ton nur durch, solange sein anderer Eingang high ist. Ein Gatter bekommt die Auswahlleitung, das andere die umgekehrte Auswahlleitung, also kommt immer genau ein Ton durch, und ein drittes Gatter führt beide auf die Leitung. Wenn ein Takt umschaltet, teilen sich zwei Signale abwechselnd eine Leitung: Zeitmultiplex, so wie Telefonleitungen viele Gespräche tragen.

## Weiter geht's
- [lab-nand-pips](../lab-nand-pips) — ein Gatter-Oszillator schaltet einen anderen ein und aus.
- [lab-siren-blinker](../lab-siren-blinker) — zwei Oszillatoren arbeiten zusammen.
