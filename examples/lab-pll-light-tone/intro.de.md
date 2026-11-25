# Licht hörbar gemacht: Ein Fototransistor stimmt den PLL-Oszillator

Beweg den Lichtregler des Fototransistors, und der Lautsprecher ändert seine Tonhöhe: helleres Licht, höherer Ton. Der Fototransistor liefert eine Spannung, und der Oszillator eines PLL-Bausteins macht daraus einen Ton.

**Vermittelt:** Sensoren als Steuerspannung, der spannungsgesteuerte Oszillator

## Was zu tun ist

Klick auf **Sim** und hör zu. Beweg den Lichtregler des Fototransistors zwischen 0,1 und 0,3.

## Was du sehen solltest

- Licht 0,1: ein tiefer Ton von etwa 250 Hz.
- Licht 0,2: etwa 440 Hz.
- Licht 0,3: etwa 640 Hz.

## Warum es funktioniert

Der Fototransistor lässt einen Strom durch, der dem Licht proportional ist, und der Widerstand von 3,3 kΩ macht daraus eine Spannung. Der Oszillator des 4046 lädt seinen Kondensator umso schneller, je höher diese Spannung ist, also steigt der Ton mit dem Licht. Der LM386 macht ihn laut genug für den Lautsprecher. Blinde Menschen haben solche Licht-zu-Ton-Geräte benutzt, um Fenster und Lampen zu finden.
