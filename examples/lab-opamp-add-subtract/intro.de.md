---
level: intermediate
age: 12+
prereqs: [lab-opamp-gain]
teaches: [summing-amplifier, difference-amplifier, forward-voltage, analog-computing]
---
## Was du siehst
Eine LED und eine Diode, jede mit einem Widerstand, und einen Operationsverstärker mit zwei Hälften: Die eine addiert ihre Spannungen, die andere zieht sie voneinander ab. Zwei Messgeräte zeigen die Ergebnisse.

## Was du tun kannst
1. Klick auf **Sim**. Lies beide Messgeräte ab: etwa 2,17 V und etwa 1,01 V.
2. Miss die LED und die Diode selbst und prüfe die Rechnung.
3. Schieb den Schalter nach rechts, dann wird die grüne LED verwendet. Beide Ergebnisse wachsen um denselben Betrag.

## Was passiert hier
Im Addierer treffen sich beide Spannungen über gleiche Widerstände am +-Eingang, der dann genau in ihrer Mitte liegt. Ein Verstärker mit der Verstärkung 2 gibt daraus ihre Summe. Im Subtrahierer bekommt der +-Eingang die halbe LED-Spannung, und der −-Eingang ist so beschaltet, dass der Ausgang die LED-Spannung minus die Diodenspannung sein muss. So eingesetzt sind Operationsverstärker die Bausteine von Analogrechnern.

## Weiter geht's
- [lab-2bit-dac](../lab-2bit-dac) — gewichtete Spannungen addieren und so einen Wandler bauen.
- [lab-opamp-gain](../lab-opamp-gain) — die Verstärkerstufe allein.
