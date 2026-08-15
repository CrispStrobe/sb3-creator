---
level: intermediate
age: 12+
prereqs: [37-voltage-divider-basic]
teaches: [potentiometer, dimming, variable-resistance]
---
## Was du siehst
Ein Potentiometer (Poti) als einstellbarer Spannungsteiler geschaltet, dessen Schleifer ueber einen Vorwiderstand eine LED ansteuert. Das Drehen am Poti aendert die LED-Helligkeit stufenlos von aus bis volle Helligkeit. Ein Knopf steuert das Licht.

## Probier das
1. Starte die Simulation und drehe das Potentiometer von einem Ende zum anderen — beobachte, wie die LED heller und dunkler wird.
2. Stelle das Poti auf die Mittelposition und pruefe die Spannung am Schleifer — sie sollte etwa die Haelfte der Versorgung betragen.
3. Aendere den Gesamtwiderstand des Potis und beobachte, ob sich der Dimmbereich aendert (er sollte es nicht, weil das Verhaeltnis gleich bleibt).

## Was passiert hier
Ein Potentiometer ist ein Widerstand mit drei Anschluessen und einem verschiebbaren Kontakt (Schleifer), der den Widerstand in zwei Teile aufteilt. Es bildet einen Spannungsteiler, dessen Verhaeltnis du mechanisch einstellen kannst. Die Schleiferspannung reicht von 0 V bis VCC, wenn du den Knopf drehst. Der Vorwiderstand nach dem Schleifer stellt sicher, dass der LED-Strom auch bei maximaler Helligkeit sicher bleibt. Das ist der klassische analoge Dimmer — kein Code, kein PWM, nur ein Knopf.

## Warum das wichtig ist
Potentiometer sind die haeufigste menschliche Eingabe in der analogen Elektronik. Lautstaerkeregler, Helligkeitsdimmer und Joystick-Achsen nutzen alle Potis. Zu verstehen, wie ein Poti eine variable Spannung erzeugt, bereitet darauf vor, analoge Eingaenge mit dem ADC eines MCU zu lesen.

## Weiter geht's
- [02-dimmer](../02-dimmer) — nutze ein Poti mit einem Mikrocontroller-ADC, um die LED-Helligkeit digital zu steuern.
- [37-voltage-divider-basic](../37-voltage-divider-basic) — sieh die feste Version dessen, was dieses Poti stufenlos macht.
- Experiment: Schliesse das Poti als variablen Widerstand an (nur zwei Anschluesse) statt als Teiler und beobachte, wie sich das Verhalten aendert.
