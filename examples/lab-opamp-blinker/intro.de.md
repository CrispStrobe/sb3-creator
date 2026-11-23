---
level: intermediate
age: 12+
prereqs: [pc40-opamp-threshold, pc84-led-herz]
teaches: [relaxation-oscillator, hysteresis, positive-feedback, RC-timing, op-amp]
---
## Was du siehst
Ein Operationsverstärker, der blinkt: Eine rote und eine grüne LED wechseln sich ab, und der RATE-Knopf bestimmt das Tempo. Kein Timer-Chip, nur ein Verstärker, ein Kondensator und ein paar Widerstände.

## Probier das
1. Starte die Simulation und sieh zu, wie die LEDs wechseln, etwa anderthalbmal pro Sekunde.
2. Dreh RATE ganz herunter, dann ganz hoch. Das Blinken wird schneller, etwa 3-mal pro Sekunde, und langsamer, etwa einmal alle 1,7 s.
3. Häng eine Oszilloskop-Sonde an den Kondensator und an den Ausgang. Der Kondensator läuft zwischen zwei Spannungen auf und ab, der Ausgang springt zwischen Low und High.

## Was dahintersteckt
Die drei 100-kΩ-Widerstände führen einen Teil des Ausgangs auf den nichtinvertierenden Eingang zurück. Das ist Mitkopplung: Sobald der Ausgang sich bewegt, läuft er ganz auf eine Seite und verschiebt dabei die Schaltschwelle mit. Der Operationsverstärker wird so zum Komparator mit zwei Schwellen (Hysterese). Der Kondensator, über R_t vom Ausgang geladen, ist das, was der Komparator beobachtet. Er kriecht bis zur oberen Schwelle, der Ausgang kippt auf Low, der Kondensator kriecht zurück zur unteren Schwelle, der Ausgang kippt auf High, und immer so weiter. Größeres R_t oder C_t macht jedes Kriechen langsamer.

## Weiter geht's
- [lab-555-inside](../lab-555-inside): Der 555 macht dasselbe mit zwei Komparatoren und einem Flipflop.
- [pc84-led-herz](../pc84-led-herz): ein weiterer OPV-Blinker.
