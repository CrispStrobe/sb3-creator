---
level: advanced
age: 16+
prereqs: [01-blink]
teaches: [servo, pwm-control, angular-position]
---
## Was du siehst
Ein Servomotor, der zwischen 0 und 180 Grad hin- und herfaehrt. Der MCU erzeugt ein PWM-Signal, das dem Servo sagt, wohin er zeigen soll — ein 1-ms-Puls bedeutet 0 Grad, 1,5 ms bedeutet 90 Grad und 2 ms bedeutet 180 Grad. Der Servo wiederholt diese Bewegung fortlaufend. Dieses Beispiel funktioniert auf allen unterstützten Mikrocontrollern — wähle ein anderes Gerät in der Werkzeugleiste, um die angepasste Schaltung zu sehen.

## Probier das
1. Starte die Simulation und beobachte, wie der Servoarm von einem Endpunkt zum anderen faehrt.
2. Halte die Bewegung bei einem bestimmten Winkel an und lies die PWM-Pulsbreite ab — bestaetie, dass sie dem erwarteten Wert entspricht.
3. Aendere die Geschwindigkeit, indem du die Verzoegerung zwischen den Winkelschritten anpasst.

## Was passiert hier
Ein Hobby-Servo erwartet ein 50-Hz-PWM-Signal (20 ms Periode). Die Pulsbreite innerhalb jeder Periode codiert den Zielwinkel: 1 ms fuer 0 Grad, 2 ms fuer 180 Grad, mit linearer Interpolation dazwischen. Der Servo enthaelt einen Motor, ein Getriebe und ein Rueckmeldepotentiometer. Er vergleicht die Position des Potis mit der angeforderten Position und treibt den Motor, bis beide uebereinstimmen. Diese geschlossene Regelung findet komplett im Servo statt — der MCU muss nur den Puls senden.

## Warum das wichtig ist
Servos werden in Robotik, RC-Fahrzeugen, Kameragimbals und automatisierten Schloessern eingesetzt. Sie sind der einfachste Weg, praezise Winkelsteuerung von einem Mikrocontroller zu bekommen — ein Pin, ein Kabel, und der Servo erledigt den Rest.

## Weiter geht's
- [54-motor-driver](../54-motor-driver) — vergleiche die Positionssteuerung eines Servos mit der Drehzahlsteuerung eines Gleichstrommotors ueber eine H-Bruecke.
- [24-pwm-fade](../24-pwm-fade) — verstehe das PWM-Signal, das den Servo antreibt.
- Experiment: Aendere das Programm, sodass der Servo auf Tastendruck bestimmte Winkel anfaehrt (0, 45, 90, 135, 180) statt kontinuierlich zu fahren.
