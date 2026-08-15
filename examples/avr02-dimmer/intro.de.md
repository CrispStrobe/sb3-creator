---
level: beginner
age: 10+
prereqs: [avr01-blink]
teaches: [adc, pwm, potentiometer, analog-control]
---
## Was du siehst
Ein Potentiometer steuert die Helligkeit einer LED. Drehe am Knopf und die LED dimmt stufenlos von aus bis volle Helligkeit — analoger Eingang treibt einen digitalen Ausgang.

## Probier das
1. Klick auf **Sim** und beachte die Helligkeit der LED.
2. Verstelle das Potentiometer und beobachte, wie die LED in Echtzeit reagiert.
3. Setze den Poti auf 0 % — die LED geht ganz aus. Auf 100 % — volle Helligkeit.

## Was passiert hier
Der Arduino liest die Spannung des Potis am Analogpin A0 (0–1023), teilt durch 1023, skaliert auf Prozent und stellt die LED-Helligkeit an Pin D9 per PWM ein. Das Poti ist ein Spannungsteiler: Sein Schleifer gibt je nach Position eine Spannung zwischen 0 und 5 V aus. Der ADC wandelt diese analoge Spannung in eine Zahl um, die das Programm verwenden kann.

## Warum das wichtig ist
Analog-Digital-Wandlung ist die Art, wie Mikrocontroller die physische Welt wahrnehmen — Temperatur, Licht, Position, Druck. Dieses Beispiel zeigt die gesamte Kette: Sensor → ADC → Berechnung → Ausgabe.

## Weiter geht's
- [avr04-serial-pot](../avr04-serial-pot) — den Poti-Wert über die serielle Schnittstelle ausgeben statt eine LED zu steuern.
- [02-dimmer](../02-dimmer) — dasselbe Konzept auf einem STC12-Mikrocontroller.
- Experiment: Füge ein zweites Poti an A1 hinzu und steuere damit die Blinkrate statt der Helligkeit.
