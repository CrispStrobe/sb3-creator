# Lärmmesser: Operationsverstärker, LM386 und ein Transistor-Gleichrichter

Ein Ohrhörer als Mikrofon liefert weniger als ein Millivolt. Ein Operationsverstärker und ein Verstärkerchip machen daraus das Zweitausendfache, und ein Transistor-Gleichrichter verwandelt den Schall in einen ruhigen Zeigerausschlag.

**Vermittelt:** Mikrofone, zweistufige Verstärkung, Dezibel, Spitzengleichrichtung

## Was zu tun ist

Klick auf **Sim** und warte einen Moment, bis sich das Messgerät beruhigt hat. Stell dann den Schallpegel am Ohrhörer auf 70 dB, dann 80 dB, dann wieder auf 0.

## Was du sehen solltest

- Ruhe: Der Zeiger steht auf null.
- 70 dB: Er bewegt sich kaum (etwa 0,16 V).
- 80 dB: etwa 2,4 V.

## Warum es funktioniert

Schall bewegt die Membran des Ohrhörers, und seine Spule liefert eine winzige Spannung. Der Operationsverstärker verstärkt sie etwa 100-fach, der LM386 noch einmal 20-fach. Kondensator und Diode an der Basis des Transistors verschieben das Signal so, dass es von Masse aus nach oben schwingt; der Transistor lädt dann den Kondensator am Messgerät auf den höchsten Punkt jeder Schwingung. Jede 10 dB mehr sind etwa der dreifache Schalldruck.
