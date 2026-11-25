# Zweiklanghorn mit Folgeverstärker

Zwei Transistoren schalten abwechselnd ein und erzeugen einen Rechteckton. Ein LM386-Verstärker, so geschaltet, dass er sein Eingangssignal nur nachbildet, treibt damit den Lautsprecher. Ein Taster und ein Schiebeschalter verändern einen Zeitwiderstand, und das Horn springt zwischen zwei Tönen.

**Vermittelt:** Transistor-Multivibrator, Zeitwiderstand und Tonhöhe, Spannungsfolger als Lautsprechertreiber

## Was zu tun ist

Klick auf **Sim**: Das Horn ertönt. Halte den Taster (HIGH) und lass ihn ein paar Mal los. Stell dann den Schiebeschalter um und probier den Taster noch einmal.

## Was du sehen solltest

- In Ruhe etwa 670 Hz; mit gehaltenem Taster etwa 900 Hz.
- Mit umgestelltem Schiebeschalter: etwa 910 Hz, mit gehaltenem Taster etwa 1380 Hz.
- Der Ausgang des Verstärkers schwingt genau so weit wie sein Eingang, nicht weiter.

## Warum es funktioniert

Jeder Transistor bleibt aus, bis seine Basis über ihren Basiswiderstand wieder aufgeladen ist; ein kleinerer Widerstand lädt sie schneller, jede Hälfte der Schwingung wird kürzer und der Ton höher. Der −-Eingang des Verstärkers liegt an seinem eigenen Ausgang, also kann er den Ausgang nur gleich dem +-Eingang machen: Verstärkung eins. Was er hinzufügt, ist Strom: Die 1-kΩ-Kollektorwiderstände des Oszillators könnten nie ein Zehntel Ampere durch einen 8-Ω-Lautsprecher treiben, der Verstärker schon.
