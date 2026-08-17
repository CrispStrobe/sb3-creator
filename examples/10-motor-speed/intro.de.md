---
level: intermediate
age: 12+
prereqs: [09-relay-clicker, 02-dimmer]
teaches: [motor-control, darlington, pwm]
---
## Was du siehst
Ein Gleichstrommotor dreht schneller oder langsamer, wenn du am Potentiometer drehst. Der MCU liest das Poti über den ADC und treibt den Motor über einen TIP120-Darlington-Transistor mit PWM. Eine Freilaufdiode schützt den Transistor vor der induktiven Rückschlagspannung des Motors. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und drehe am Potentiometer — der Motor beschleunigt und verlangsamt sich gleichmäßig.
2. Setze das Poti auf die niedrigste Position und überprüfe, dass der Motor vollständig stoppt.
3. Trenne die Freilaufdiode ab und beobachte die Spannungsspitzen, die auftreten, wenn die PWM den Motor abschaltet.

## Was passiert hier
Das kombiniert zwei frühere Ideen: die ADC-zu-PWM-Umwandlung aus [02-dimmer](../02-dimmer) und den Transistor-Treiber aus [09-relay-clicker](../09-relay-clicker). Der TIP120 ist ein Darlington-Paar — zwei Transistoren in einem Gehäuse —, das den Motorstrom (bis 5 A) bewältigen kann und direkt von einem MCU-Pin angesteuert wird. Der PWM-Tastgrad bestimmt die mittlere Spannung am Motor und damit seine Drehzahl. Die Freilaufdiode am Motor leitet die induktive Spannungsspitze ab, die bei jedem PWM-Abschaltvorgang auftritt, und schützt so den TIP120.

## Warum das wichtig ist
Variable Motordrehzahlsteuerung wird in Lüftern, Pumpen, Robotern und Förderbändern eingesetzt. Das Muster — Sensor liest einen Sollwert, MCU wendet PWM über einen Leistungstransistor an — ist dasselbe, ob der Motor 5 V oder 24 V hat. Es hier zu verstehen bedeutet, es auf reale Anwendungen skalieren zu können.

## Weiter geht's
- [02-dimmer](../02-dimmer) — die einfachere Pot-zu-PWM-Version nur mit LED.
- [09-relay-clicker](../09-relay-clicker) — Ein/Aus-Motorsteuerung ohne Geschwindigkeitsvariation.
- Experiment: Füge ein zweites Poti hinzu, um eine Mindestdrehzahl einzustellen, damit der Motor nie unter Schleichfahrt fällt.
