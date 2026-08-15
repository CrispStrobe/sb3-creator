---
level: intermediate
age: 12+
prereqs: [pc47-555-monostable]
teaches: [555-audio, pulse-generation, frequency-control]
---
## Was du siehst
Ein 555-Timer als astabiler Oszillator konfiguriert, der Audiofrequenzpulse erzeugt. Ein Lautsprecher oder Summer am Ausgang erzeugt einen hoerbaren Ton, dessen Tonhoehe von den Widerstands- und Kondensatorwerten abhaengt.

## Probier das
1. Starte die Simulation und hoere den vom 555 erzeugten Ton.
2. Aendere den Zeitgeberwiderstand auf einen groesseren Wert und hoere, wie die Tonhoehe sinkt, weil die Frequenz abnimmt.
3. Ersetze den festen Widerstand durch ein Potentiometer und variiere die Tonhoehe stufenlos.

## Was passiert hier
Im astabilen Modus laedt der 555 einen Kondensator ueber zwei Widerstaende, bis er 2/3 der Versorgungsspannung erreicht, und entlaedt ihn dann ueber einen Widerstand, bis er 1/3 erreicht. Dieser Zyklus wiederholt sich endlos und erzeugt eine Rechteckwelle am Ausgang. Die Frequenz wird durch die Widerstands- und Kondensatorwerte bestimmt: f = 1,44 / ((R1 + 2*R2) * C). Mit Werten, die Hunderte oder Tausende Hertz ergeben, ist die Rechteckwelle als Ton hoerbar.

## Warum das wichtig ist
Der 555-Timer ist einer der meistproduzierten integrierten Schaltkreise der Geschichte. Eine praezise Frequenz mit nur zwei Widerstaenden und einem Kondensator zu erzeugen — ohne Mikrocontroller, ohne Software — macht ihn ideal fuer Alarme, Summer und einfache Tongeneratoren. Ihn zu verstehen oeffnet die Tuer zu unzaehligen klassischen Schaltungen.

## Weiter geht's
- [pc47-555-monostable](../pc47-555-monostable) — der 555 im Einschuss-Modus statt als Daueroszillator.
- [pc53-buzzer-switch](../pc53-buzzer-switch) — eine einfachere Tonschaltung ohne Frequenzkontrolle.
- Experiment: Fuege einen zweiten 555 hinzu, der mit niedriger Frequenz (wenige Hertz) laeuft, und nutze seinen Ausgang, um den Audio-555 ein- und auszuschalten — so entsteht ein pulsierender Alarmton.
