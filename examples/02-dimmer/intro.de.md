---
level: intermediate
age: 12+
prereqs: [01-blink]
teaches: [adc, pwm, potentiometer]
---
## Was du siehst
Eine LED wird heller oder dunkler, wenn du am Potentiometer drehst. Der MCU liest die Position des Potis als analoge Spannung und steuert die LED mit Software-PWM, deren Tastgrad der Spannung entspricht.

## Probier das
1. Starte das Programm und schiebe den Potentiometer-Regler von einem Ende zum anderen.
2. Beobachte, wie die LED von ganz aus bis voll hell geht, wenn der Pot-Wert von 0 auf 255 steigt.
3. Stelle das Poti in die Mitte und beachte, dass die LED mit ungefähr halber Helligkeit leuchtet.

## Was passiert hier
Das Potentiometer wirkt als variabler Spannungsteiler und liefert 0–5 V an den ADC-Eingang des MCU. Der MCU wandelt diese Spannung in eine Zahl (0–255) um. Dann schaltet er den LED-Pin in einer schnellen Schleife abwechselnd ein und aus — der Anteil der Einschaltzeit (Tastgrad) entspricht dem ADC-Wert geteilt durch 255. Dein Auge mittelt das Flackern zu einer wahrgenommenen Helligkeit. Das ist Software-PWM: keine spezielle Timer-Hardware, nur eine schnelle Schleife.

## Warum das wichtig ist
PWM ist die Standardmethode, um Helligkeit, Motordrehzahl und Servoposition in eingebetteten Systemen zu steuern. Einen analogen Sensor auszulesen und seinen Wert zur Steuerung eines Ausgangs zu verwenden, ist der Kern der meisten realen MCU-Anwendungen.

## Weiter geht's
- [10-motor-speed](../10-motor-speed) — dieselbe Pot-zu-PWM-Idee nutzen, um einen Gleichstrommotor zu steuern.
- [03-night-light](../03-night-light) — das Poti durch einen Lichtsensor für automatische Steuerung ersetzen.
- Experiment: Füge eine zweite LED an einem anderen Pin hinzu und lass sie gegenläufig dimmen (hell, wenn die erste dunkel ist).
