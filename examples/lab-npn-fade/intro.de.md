---
level: beginner
age: 10+
prereqs: [lab-crossfade]
teaches: [rc-charging, emitter-follower, transistor]
---
## Was du siehst
Ein Elko mit einem Taster **UP** und einem Taster **DOWN**, zwei Transistoren, eine rote und eine grüne LED und ein Schiebeschalter **FAST**, der einen kleineren Kondensator wählt.

## Probier das
1. Klick auf **Sim**: Grün leuchtet, Rot ist dunkel.
2. Halte **UP** einige Sekunden: Grün wird langsam dunkel, während Rot langsam hell wird.
3. Lass los: Die Farben bleiben ungefähr, wo sie sind (sie wandern nur langsam zurück).
4. Halte **DOWN**: Rot verlischt, Grün kommt zurück.
5. Stell **FAST** auf den kleinen Kondensator und wiederhole das: dieselbe Überblendung, etwa viermal schneller.

## Was passiert hier
**UP** lädt den Kondensator über 10 kΩ, **DOWN** entlädt ihn über weitere 10 kΩ; seine Spannung steigt und fällt also langsam. Der linke Transistor überträgt diese Spannung (abzüglich etwa 0,7 V) auf die rote LED und ihren Widerstand: Steigt die Spannung, wird Rot heller. Der rechte Transistor hängt am selben Kondensator und liegt parallel zur grünen LED: Je mehr er leitet, desto mehr Strom nimmt er Grün weg, Grün verlischt also genau, während Rot aufleuchtet. Ein kleinerer Kondensator füllt und leert sich schneller. Die beiden Transistoren ziehen etwas Strom aus dem Kondensator; deshalb sinkt ein gehaltener Pegel langsam ab.

## Weiter geht's
- [lab-crossfade](../lab-crossfade) — eine Überblendung mit einem Operationsverstärker.
