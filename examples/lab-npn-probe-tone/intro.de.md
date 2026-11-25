---
level: beginner
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, resistance, conductors, sound]
---
## Was du siehst
Ein Transistor-Tongenerator mit zwei Prüfspitzen. Der Schalter **PROBES** sagt, ob die Spitzen etwas berühren; das Poti **MATERIAL** steht für das, was sie berühren, von Metall (0) bis trockener Haut (Anschlag). Dazu eine gelbe LED, ein Schiebeschalter **HIGH** und der Hörer.

## Probier das
1. Klick auf **Sim**. Die Spitzen berühren nichts, wie bei einem Isolator: Stille.
2. Schließ **PROBES**. Voreingestellt ist ein Stück Obst: ein mittlerer Pfeifton.
3. Dreh **MATERIAL** auf 0 (Metall oder ein dick gemalter Bleistiftstrich): ein hoher Pfeifton. Das ist ein Durchgangsprüfer.
4. Dreh in Richtung trockene Haut: Der Ton fällt weit ab. Stell dir Löschpapier vor, das nasser wird, oder Hände, die schwitzen, als Zurückdrehen: Der Ton steigt (ein Regenmelder, ein „Lügendetektor“).
5. Achte auf die LED: Je mehr das Material bremst, desto heller wird sie.
6. Stell **HIGH** auf den kleinen Kondensator: Dieselbe Probe pfeift jetzt schrill, um 10 kHz.

## Was passiert hier
Was zwischen den Spitzen liegt, ist der Widerstand, über den die Basis des ersten Transistors nach jedem Umschalten nachgeladen wird. Ein guter Leiter lädt schnell, die Schaltung schaltet oft um: ein hoher Ton. Ein schlechter Leiter lädt langsam: ein tiefer Ton. Ein Isolator lädt gar nicht: kein Ton. Der Schutzwiderstand von 22 kΩ schützt die Basis, wenn die Spitzen Metall berühren. Die LED leuchtet, solange der erste Transistor gesperrt ist, und diese Zeit wächst mit dem Widerstand.

## Weiter geht's
- [lab-pitch-probe](../lab-pitch-probe) — dieselbe Probe mit einem Timer-Baustein.
