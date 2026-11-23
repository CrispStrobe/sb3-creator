---
level: beginner
age: 10+
prereqs: [pc47-555-monostable]
teaches: [monostable, 555-timer, pulse-stretching, game]
---
## Was du siehst
Der heiße Draht: Führe eine Metallschlaufe an einem gebogenen Draht entlang, ohne ihn zu berühren. Hier sind Draht und Schlaufe der WIRE-Taster. Jede Berührung lässt den Summer ertönen und die rote LED etwa eine Sekunde lang leuchten. Solange nichts berührt, meldet die grüne LED "bereit".

## Probier das
1. Starte die Simulation. Grün leuchtet.
2. Tippe den WIRE-Taster so kurz an, wie du kannst. Der Summer ertönt trotzdem eine volle Sekunde.
3. Tippe noch einmal, während der Alarm noch läuft, und achte darauf, wann er aufhört. Erkläre, was du siehst, mit dem Kondensator.
4. Zähl deine Berührungen in einem Durchgang. Weniger ist besser.

## Was dahintersteckt
Ein Streifen der Schlaufe am Draht dauert nur wenige Millisekunden, viel zu kurz, um etwas zu hören. Der 555 als Monoflop fängt diesen kurzen Einbruch an seinem TRIGGER-Pin auf und hält seinen Ausgang auf High, während der Kondensator über den 100-kΩ-Widerstand lädt. Erreicht der Kondensator zwei Drittel der Versorgung, beendet der Chip den Impuls und entlädt den Kondensator. Der Alarm dauert also immer 1,1 × R × C, etwa 1,1 s, egal wie kurz die Berührung war.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable): dasselbe Monoflop mit einer LED.
- [lab-555-inside](../lab-555-inside): die Schwellen im Inneren des 555.
