# OPITEC-Transistor-Miniorgel

Quelle: [OPITEC 107056, Schaltplan Seite 2](https://www.opitec.com/de-de/opitec-elektronik-miniorgel/107056).

BC548/BC558, 3,3 nF, 10 nF, 1 MΩ und 180 kΩ mit acht 1-MΩ-Trimmern und Tasten bilden den wirklichen Rückkopplungsoszillator. Die Stückliste nennt 150 kΩ; Schaltplan und Aufbau nennen 180 kΩ. Hier gilt der Schaltplan. Der unbenutzte a-Anschluss der Trimmer bleibt offen. Für einen definierten Start steigt die Versorgung in 10 µs auf 9 V.

Die Transistorbezeichnungen benennen die Bauteile für den Aufbau. Die Simulation verwendet ausdrücklich generische Exponentialmodelle: IS=1e-14 A, BF=100, BR=1, N=1, RB=10 Ω, RC=1 Ω, CJE=10 pF, CJC=4 pF und TF=0,3 ns. Dies sind keine gemessenen BC548/558-Modelle. Der Lautsprecher ist ein elektrischer 8-Ω-Widerstand.

Mit denselben Modellen und Startbedingungen stimmen Brickwright und ngspice überein: bei 500 kΩ etwa 255,7 Hz und 8,021 V Spitze. Eine Taste drücken; mehrere Tasten ergeben parallele Zeitwiderstände, keine Akkorde. Alle Tasten loslassen beendet den Dauerton.

Im Oszilloskop den Lautsprecherknoten gegen Simulator-Masse messen. Die Zeit-/Hüllkurvenansicht zeigt schmale Schaltimpulse; langsame Abtastung kann sie verpassen. Für FFT und Aufnahme abspielen/WAV echte Abtastwerte im Spektrum verwenden. Die stärkste Spektrumspitze kann ein Oberton sein; die Grundfrequenz aus dem Impulsabstand bestimmen. Die Wiedergabe entfernt den Gleichanteil und skaliert fest und leise. Eine Hüllkurve ist keine abspielbare Wellenform. Reale Tonhöhe, Lautstärke und Lautsprecherverhalten müssen am Aufbau geprüft werden.

## Anfangsstimmung

Die acht Trimmer sind für das angegebene Modell ungefähr auf C4–C5 eingestellt. Das reale Instrument muss gesondert gestimmt werden.

| Taste | Ton | Wirksamer Trimmerwert | SPICE-Frequenz |
|---|---|---:|---:|
| 1 | C4 | 483.40 kΩ | 261.30 Hz |
| 2 | D4 | 401.37 kΩ | 293.82 Hz |
| 3 | E4 | 331.06 kΩ | 329.93 Hz |
| 4 | F4 | 299.81 kΩ | 349.36 Hz |
| 5 | G4 | 243.16 kΩ | 391.82 Hz |
| 6 | A4 | 192.38 kΩ | 440.80 Hz |
| 7 | B4 | 149.41 kΩ | 493.98 Hz |
| 8 | C5 | 129.88 kΩ | 523.00 Hz |
