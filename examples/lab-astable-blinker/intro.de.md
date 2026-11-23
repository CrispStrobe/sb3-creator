---
level: intermediate
age: 12+
prereqs: [pc05-npn-switch, pc06-rc-charge]
teaches: [astable, multivibrator, positive-feedback, rc-time-constant]
---
## Was du siehst
Zwei Transistoren, zwei Kondensatoren, eine rote und eine grüne LED. Niemand drückt etwas, und trotzdem leuchten die LEDs abwechselnd: rot, grün, rot, grün.

## Probier das
1. Klick auf **Sim** und beobachte den Takt: etwas schneller als einmal pro Sekunde.
2. Dreh den Regelwiderstand ganz herunter. Eine Farbe blitzt jetzt kurz, die andere bleibt lang.
3. Dreh ihn ganz hoch. Der Takt wird langsamer.
4. Leg eine Oszilloskop-Sonde an die Basis eines Transistors und such den Einbruch unter 0 V.

## Was passiert hier
Schaltet ein Transistor ein, fällt seine Kollektorspannung. Der Kondensator gibt diesen Sprung an die Basis des anderen Transistors weiter und drückt sie unter null: Der zweite Transistor wird ausgeschaltet. Dann steigt seine Basis über ihren Widerstand langsam wieder an. Bei etwa 0,7 V schaltet er ein und macht mit dem ersten dasselbe. Kein Zustand hält, also kippt die Schaltung von selbst hin und her. Jede Hälfte wird von ihrem eigenen Widerstand und Kondensator bestimmt. So funktioniert jeder klassische Blinker, und dieselbe Idee steckt im Timer 555.

## Weiter geht's
- [lab-transistor-flip-flop](../lab-transistor-flip-flop) — dieselben zwei Transistoren mit Widerständen statt Kondensatoren: Die Schaltung bleibt stehen.
- [51-555-astable](../51-555-astable) — dieselbe Aufgabe mit einem Timer-Baustein.
