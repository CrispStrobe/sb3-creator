---
level: advanced
age: 14+
prereqs: [lab-scr-pair, pc06-rc-charge]
teaches: [relaxation-oscillator, unijunction, threshold, sawtooth]
---
## Was du siehst
Ein Kondensator, ein Regelwiderstand, ein PNP- und ein NPN-Transistor und eine rote LED. Die LED gibt kurze, helle Blitze in einem gleichmäßigen Takt.

## Probier das
1. Klick auf **Sim** und zähl die Blitze: etwa drei alle zwei Sekunden.
2. Dreh den Regelwiderstand herunter. Die Blitze kommen viel schneller. Dreh ihn hoch: langsamer.
3. Leg eine Oszilloskop-Sonde an den Kondensator und sieh dir den Sägezahn an: langsam hoch, plötzlich herunter.
4. Stell die Batteriespannung auf 5 V. Das Blinken hört auf: eine Warnung bei schwacher Batterie.

## Was passiert hier
Der Kondensator lädt sich über die Widerstände auf. Der PNP-Transistor überwacht ihn: Solange der Kondensator unter der Spannung an seiner Basis liegt, fließt nichts. Steigt er etwas darüber, beginnt der PNP zu leiten. Das schaltet den NPN ein, der die Basis des PNP herunterzieht und ihn noch stärker einschaltet. Im Nu sind beide voll an, und der Kondensator entlädt sich über die LED. Ist fast nichts mehr übrig, schaltet das Paar ab und das Laden beginnt von vorn. Dieses Transistorpaar verhält sich wie ein einzelnes besonderes Bauteil, der programmierbare Unijunction-Transistor, der früher in Metronomen und Blinkern steckte.

## Weiter geht's
- [lab-scr-pair](../lab-scr-pair) — dasselbe Paar, gezündet von einem Taster: ein Thyristor.
- [lab-astable-blinker](../lab-astable-blinker) — ein anderer Blinker aus zwei Transistoren.
