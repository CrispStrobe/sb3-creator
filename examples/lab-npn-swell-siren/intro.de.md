---
level: intermediate
age: 10+
prereqs: [lab-npn-two-tone-bell]
teaches: [astable, rc-charging, frequency, sound]
---
## Was du siehst
Ein Transistor-Tongenerator, bei dem ein Basiswiderstand nicht an der Batterie hängt, sondern an einem Elko. Ein Taster lädt diesen Kondensator; ein Schiebeschalter schaltet einen zweiten, größeren dazu.

## Probier das
1. Klick auf **Sim**. Stille: Der Kondensator ist leer.
2. Halte den Taster: Ein Ton setzt ein und gleitet nach oben.
3. Lass los: Der Ton gleitet wieder hinunter und verklingt.
4. Stell den Schiebeschalter **SLOW** um, damit der große Kondensator dazukommt, und probier es noch einmal: Jetzt schwillt der Ton viel langsamer an und ab.

## Was passiert hier
Jedes Mal, wenn der erste Transistor sperrt, muss seine Basis über ihren 47-kΩ-Widerstand nachgeladen werden, bevor er wieder einschaltet. Hier hängt dieser Widerstand am Vorspannungs-Kondensator. Je höher dessen Spannung, desto schneller lädt die Basis nach und desto höher der Ton. Der Taster füllt den Kondensator über 2,2 kΩ, der Ton steigt; nach dem Loslassen leert ihn die Basis des Transistors selbst langsam, der Ton sinkt, und unter etwa 0,6 V bleibt der Oszillator stehen. Ein größerer Kondensator braucht in beide Richtungen länger.

## Weiter geht's
- [lab-siren-glide](../lab-siren-glide) — eine gleitende Sirene mit einem Timer-Baustein.
- [lab-npn-police-siren](../lab-npn-police-siren) — eine Sirene, die zwischen zwei Tönen springt.
