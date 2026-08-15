---
level: beginner
age: 10+
prereqs: [arduino-01-blink]
teaches: [pwm, analog-output, led-brightness]
---
## Was du siehst
Eine LED an Pin D9 wird sanft heller und wieder dunkler, immer wieder. Die Helligkeit ändert sich in kleinen Schritten alle 30 ms.

## Probier das
1. Starte das Programm und beobachte die LED „atmen".
2. Ändere fadeAmount von 5 auf 1 — das Faden wird weicher, aber langsamer.
3. Wechsle Pin D9 zu D3 oder D11 (andere PWM-Pins) und prüfe, dass es weiterhin funktioniert.

## Was passiert hier
Der Arduino kann keine echte Analogspannung ausgeben, aber er kann Pin D9 sehr schnell ein- und ausschalten — tausende Male pro Sekunde. Durch Variation des Anteils der HIGH-Zeit (**Tastgrad**) erscheint die LED dunkler oder heller. Diese Technik heißt PWM (Pulsweitenmodulation). analogWrite(pin, 0) ist immer aus, analogWrite(pin, 255) immer an, Werte dazwischen ergeben proportionale Helligkeit.

## Warum das wichtig ist
PWM ist die Methode, mit der Mikrocontroller Helligkeit, Motordrehzahl und Servoposition steuern.

## Weiter geht's
- [arduino-01-analog-read-serial](../arduino-01-analog-read-serial) — ein Potentiometer lesen, um Dinge zu steuern.
- Experiment: benutze ein Potentiometer, um die Fade-Geschwindigkeit zu steuern.
