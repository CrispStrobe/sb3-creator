---
level: intermediate
age: 12+
prereqs: [02-dimmer]
teaches: [comparison, dual-adc, decision-logic]
---
## Was du siehst
Zwei Potentiometer speisen jeweils einen ADC-Kanal. Eine LED zeigt an, welches Poti höher eingestellt ist. Dreht man eines über das andere hinaus, wechselt die LED. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und drehe beide Potis auf die Mittelstellung — die LED flackert möglicherweise, weil die Werte fast gleich sind.
2. Drehe das linke Poti ganz im Uhrzeigersinn und das rechte ganz gegen den Uhrzeigersinn — die LED sollte stabil leuchten (oder aus sein, je nachdem welche Seite sie anzeigt).
3. Versuche, den genauen Umschaltpunkt zu finden, an dem die LED wechselt, und beobachte, wie empfindlich das ist.

## Was passiert hier
Der MCU liest zwei analoge Spannungen und vergleicht sie in Software. Wenn Kanal A größer ist als Kanal B, geht die LED an; andernfalls aus. Das ist das digitale Äquivalent einer analogen Komparatorschaltung, nur im Code umgesetzt. Der Vergleich findet bei jeder Schleifeniteration statt, daher reagiert das System nahezu sofort. In der Nähe des Umschaltpunkts kann Rauschen in den ADC-Werten die LED zum Flackern bringen — eine praxisnahe Lektion, warum Komparatoren oft eine Hysterese enthalten.

## Warum das wichtig ist
Zwei Messwerte zu vergleichen und daraus eine Entscheidung abzuleiten ist der Kern von Steuerungslogik. Thermostate vergleichen eine Temperatur mit einem Sollwert. Motorsteuerungen vergleichen Soll- mit Ist-Drehzahl. Diese einfache Zwei-Poti-Schaltung ist die minimale Version dieses Musters.

## Weiter geht's
- [02-dimmer](../02-dimmer) — ein einzelnes Potentiometer auslesen, die einfachere Vorstufe.
- [16-ldr-bargraph](../16-ldr-bargraph) — einen Wert gegen mehrere Schwellenwerte vergleichen.
- Experiment: Füge eine Hysterese hinzu — der führende Kanal muss mindestens 10 voraus sein, bevor umgeschaltet wird, um das Flackern am Umschaltpunkt zu vermeiden.
