---
level: beginner
age: 12+
prereqs: [pc05-npn-switch]
teaches: [automatic-control, ldr-trigger, hardware-only]
---
## Was du siehst
Eine Lampe, die bei Dunkelheit automatisch angeht, nur mit einem LDR, einem Transistor und ein paar Widerstaenden — kein Mikrocontroller. Der LDR misst das Umgebungslicht, der Transistor schaltet die Lampe, und die Schaltung laeuft von selbst.

## Probier das
1. Starte die Simulation bei "Tageslicht" und pruefe, dass die Lampe aus bleibt.
2. Reduziere den Lichtpegel (LDR abdecken) und beobachte, wie die Lampe von selbst angeht.
3. Erhoehe das Licht wieder und sieh, wie die Lampe zurueckschaltet.

## Was passiert hier
Der LDR (lichtabhaengiger Widerstand) hat hohen Widerstand bei Dunkelheit und niedrigen bei Licht. Er bildet einen Spannungsteiler mit einem festen Widerstand. Bei Dunkelheit steigt der LDR-Widerstand, die Spannung an der Transistorbasis ueberschreitet die Schwelle, und der Transistor schaltet ein und versorgt die Lampe. Bei Licht ist der LDR-Widerstand niedrig, die Basisspannung faellt unter die Schwelle, und der Transistor schaltet aus. Die Schaltung ist ein automatischer Schalter ohne Code, ohne Takt, ohne Programmierung — nur Physik und eine Schwelle.

## Warum das wichtig ist
Automatische Nachtlichter sind ueberall — Gartenlampen, Strassenbeleuchtung, Notbeleuchtung. Diese Schaltung zeigt, dass nuetzliche Automatisierung keine Software braucht. Ein Sensor, eine Schwelle und ein Schalter genuegen fuer viele reale Steuerungsprobleme, und das Verstaendnis dieses analogen Ansatzes macht digitale Loesungen weniger zur Blackbox.

## Weiter geht's
- [pc05-npn-switch](../pc05-npn-switch) — das Transistor-Schaltprinzip, das hier verwendet wird.
- [pc55-ntc-indicator](../pc55-ntc-indicator) — eine aehnliche Schaltung mit Temperatur statt Licht.
- Experiment: Fuege ein Potentiometer zum Spannungsteiler hinzu, um die Lichtschwelle einstellbar zu machen — so funktionieren kommerzielle Daemmerungsschalter mit einstellbarer Empfindlichkeit.
