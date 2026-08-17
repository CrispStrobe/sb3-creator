---
level: beginner
age: 12+
prereqs: [01-blink]
teaches: [relay, npn-driver, flyback-diode]
---
## Was du siehst
Ein Relais klickt alle zwei Sekunden ein und aus. Ein NPN-Transistor treibt die Relaisspule, weil der MCU-Pin allein nicht genug Strom liefern kann. Eine Status-LED spiegelt den Relaiszustand, sodass du das Timing auch ohne Klick-Geräusch sehen kannst. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte das Programm und höre, wie das Relais ein- und ausklickt.
2. Beobachte die Status-LED — sie folgt dem Relais exakt.
3. Entferne die Freilaufdiode aus der Schaltung und beobachte, was mit der Spannungsspitze passiert, wenn das Relais abschaltet.

## Was passiert hier
Die Relaisspule braucht 50–80 mA zum Anziehen, aber ein 8051-Pin liefert weniger als 1 mA. Ein NPN-Transistor verstärkt das Signal: Der MCU steuert die Basis des Transistors über einen Widerstand, und der Transistor schaltet den Spulenstrom zwischen Kollektor und Emitter. Beim Abschalten der Spule bricht das Magnetfeld zusammen und erzeugt eine Spannungsspitze, die den Transistor zerstören könnte. Die Freilaufdiode (antiparallel zur Spule geschaltet) leitet diese Spitze sicher ab. Die Status-LED an einem separaten Pin gibt visuelle Rückmeldung.

## Warum das wichtig ist
Relais ermöglichen es einem kleinen MCU, netzspannungsgesteuerte Geräte zu schalten — Lampen, Heizungen, Motoren. Das Muster aus NPN-Treiber und Freilaufdiode findet sich in nahezu jeder Relaisschaltung. Falsch umgesetzt zerstört es Bauteile; richtig gemacht ist es ein Baustein für Heimautomation und Industriesteuerung.

## Weiter geht's
- [10-motor-speed](../10-motor-speed) — dasselbe Transistor-Treiber-Muster, aber mit PWM für Geschwindigkeitsregelung.
- [01-blink](../01-blink) — die einfache Ausgabe wiederholen, wenn Relais-Ansteuerung ein großer Schritt scheint.
- Experiment: Füge ein zweites Relais hinzu und lass sie alternieren, sodass eines an ist, während das andere aus ist.
