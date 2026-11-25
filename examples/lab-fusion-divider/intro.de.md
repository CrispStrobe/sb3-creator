---
level: advanced
age: 14+
prereqs: [lab-opamp-blinker, lab-toggle-flip-flop]
teaches: [flicker-fusion, astable, frequency-divider, duty-cycle, steering-diodes]
---
## Was du siehst
Eine grüne LED, die blinkt, und ein RATE-Poti. Irgendwo zwischen langsam und schnell wird das Blinken zu ruhigem Licht: Dort liegt deine Flimmerverschmelzungsfrequenz.

## Was du tun kannst
1. Klick auf **Sim** und beobachte die LED.
2. Dreh das **RATE**-Poti langsam. Wo verschwindet für dich das Flimmern?
3. Achte darauf, dass die LED beim Drehen weder heller noch dunkler wird: Sie ist immer genau die Hälfte der Zeit an.

## Was passiert hier
Ein Operationsverstärker lädt und entlädt einen Kondensator und kippt jedes Mal, wenn eine von zwei Schwellen erreicht ist: eine Rechteckschwingung, aber keine gleichmäßige. Zwei Transistoren dahinter bilden ein Flipflop, das bei jeder steigenden Flanke umschaltet. Sein Ausgang läuft daher mit der halben Frequenz und gleich langen An- und Aus-Zeiten. Steuerdioden sorgen dafür, dass jede Flanke nur den Transistor erreicht, der gerade sperrt.

## Weiter geht's
- [lab-flicker-fusion](../lab-flicker-fusion) — derselbe Test mit einem 555 und einem D-Flipflop.
- [lab-toggle-flip-flop](../lab-toggle-flip-flop) — ein Transistor-Flipflop, das per Taster umschaltet.
