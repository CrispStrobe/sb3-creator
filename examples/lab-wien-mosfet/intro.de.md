# Wien-Brücken-Sinus mit einem MOSFET

Ein Operationsverstärker mit der Verstärkung drei und ein Wien-Glied erzeugen einen Sinus von etwa 1 kHz. Ein MOSFET als spannungsgesteuerter Widerstand, gesteuert von einem Germaniumdioden-Gleichrichter, hält die Amplitude konstant und sauber.

**Vermittelt:** Schwingbedingung, automatische Verstärkungsregelung, MOSFET als Widerstand

## Was zu tun ist

Klick auf **Sim** und beobachte den Ausgang an voltmeter_17 oder mit dem Oszilloskop am Ausgang des Operationsverstärkers. Nach einigen hundert Millisekunden schließt du AGC OFF (switch_16).

## Was du sehen solltest

- Ein Sinus von etwa 1 kHz, der sich bei etwa 1,2 V Spitze einpendelt.
- Mit AGC OFF wächst die Schwingung, bis ihre Spitzen an den Grenzen des Operationsverstärkers abgeschnitten werden.

## Warum es funktioniert

Das Wien-Glied gibt bei seiner Frequenz ein Drittel des Ausgangs zurück; der Verstärker muss also genau dreifach verstärken. Der Kanal des MOSFET ist Teil des Widerstands, der diese Verstärkung festlegt. Die Diode lädt die Gates umso negativer, je größer der Ausschlag ist; der Kanal wird enger, die Verstärkung sinkt, bis Verstärkung und Verluste im Gleichgewicht sind.
