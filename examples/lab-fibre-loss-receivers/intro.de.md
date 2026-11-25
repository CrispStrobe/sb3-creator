# Verluste im Lichtleiter: als Tonhöhe gehört, am Messgerät abgelesen

Licht, das unterwegs im Lichtleiter verloren geht, kann man hören und messen. Ein Empfänger macht mit dem Oszillator eines PLL-Bausteins eine Tonhöhe daraus, der andere zeigt es über einen Operationsverstärker am Messgerät.

**Vermittelt:** Biege-, Spalt-, Versatz- und Winkelverluste in Lichtleitern, spannungsgesteuerter Oszillator, ein linearer Operationsverstärker-Empfänger

## Was zu tun ist

Klick auf **Sim**. Schieb den Regler des Lichtleiters langsam nach unten: Damit biegst du ihn enger. Gib dann im Inspektor dem Lichtweg einen Spalt an der Verbindungsstelle (`jointGapMm` 0,5), danach einen Versatz (`jointOffsetMm` 0,3), danach einen Winkel (`jointAngleDeg` 10). Stell jeden Wert wieder auf 0, bevor du den nächsten änderst.

## Was du sehen solltest

- Sanfte Biegung: etwa 290 Hz und etwa 4 V am Messgerät.
- Enge Biegung (unter 1 cm Radius): Der Ton sinkt und das Messgerät fällt, bei 0,4 cm auf etwa 2 V.
- Spalt von 0,5 mm: etwa 150 Hz und 1,6 V. Auch ein Versatz oder ein Winkel an der Verbindung kostet Licht.

## Warum es funktioniert

Das Licht bleibt im Lichtleiter, weil es flach auf die Wand trifft. In einer engen Biegung trifft ein Teil zu steil auf und tritt aus. An einer Verbindung breitet sich das Licht aus dem ersten Stück aus, also verfehlt bei Spalt, Versatz oder Schräglage ein Teil das zweite Stück. Der Fototransistor macht aus dem ankommenden Licht eine Spannung, der Oszillator der PLL macht daraus eine Tonhöhe, und der Operationsverstärker verdoppelt sie für das Messgerät.
