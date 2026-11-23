# LC-Oszillator mit Rückkopplungsspule und Amplitudenmodulation

Ein Transistorverstärker schwingt, wenn eine zweite Wicklung auf seiner Schwingkreisspule einen Teil des Ausgangs im richtigen Moment an den Eingang zurückgibt. Spule und Kondensator bestimmen die Frequenz. Ein zweiter Transistor lässt dann ein Tonsignal steuern, wie viel von diesem Träger durchkommt: Amplitudenmodulation, so wie der AM-Rundfunk den Ton auf einen Träger bringt.

**Vermittelt:** Mitkopplung, LC-Resonanz, Amplitudenmodulation

## Was zu tun ist

Klick auf **Sim** und öffne das Oszilloskop. Kanal 1 zeigt den Oszillator, Kanal 2 den modulierten Ausgang. Ändere die Amplitude des Tongenerators und probiere danach einen anderen Schwingkreiskondensator.

## Was du sehen solltest

- Auf Kanal 1 einen gleichmäßigen Sinus von etwa 10,7 kHz.
- Auf Kanal 2 Pakete des Trägers, deren Höhe dem 500-Hz-Ton folgt.
- Mehr Ton: Zwischen den Spitzen reißen die Pakete ganz ab.

## Warum es funktioniert

Der Schwingkreis im Kollektor schwingt mit seiner eigenen Frequenz. Die Rückkopplungswicklung gibt einen kleinen Teil davon im Takt an die Basis zurück, so wird jede Schwingung nachgefüllt und hört nicht auf. Q2 ist genau an der Schwelle zum Leiten eingestellt; die Tonspannung verschiebt diese Schwelle auf und ab, deshalb kommt mal mehr, mal weniger von jeder Trägerspitze durch. Der Träger ist hier gegenüber echten Radiofrequenzen heruntergesetzt, damit die Simulation schnell bleibt; das Prinzip ist dasselbe.
